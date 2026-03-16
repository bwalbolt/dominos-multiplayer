import { BoardState, ChainSide, PlayedTile, TileId, TileSide } from "../types";
import { projectPlacement } from "./project-placement";
import {
  BoardLayoutSolution,
  CameraTransform,
  LayoutOrientation,
  PlacedTileGeometry,
  Point,
} from "./types";

const SIDE_ORDER: readonly ChainSide[] = ["left", "right", "up", "down"];
const ORIENTATION_ORDER: readonly LayoutOrientation[] = ["up", "right", "down", "left"];
const FULL_ROTATION_DEGREES = 360;
const HALF_TURN_DEGREES = 180;
const QUARTER_TURN_DEGREES = 90;
const EPSILON = 0.001;

export type RotationMotionPlan = Readonly<{
  pivot: Point;
  angleDeg: number;
}>;

export type TileTransitionPlan = Readonly<{
  tileId: TileId;
  from: PlacedTileGeometry;
  to: PlacedTileGeometry;
  opacityFrom: number;
  boardRotation: RotationMotionPlan | null;
  bendRotation: RotationMotionPlan | null;
  residualTranslation: Point;
  residualRotationDeg: number;
}>;

export type BoardLayoutTransitionPlan = Readonly<{
  cameraFrom: CameraTransform;
  cameraTo: CameraTransform;
  tilePlans: readonly TileTransitionPlan[];
}>;

type BendMotionPlan = RotationMotionPlan &
  Readonly<{
    side: ChainSide;
    tileIds: readonly TileId[];
  }>;

type TileStartState = Readonly<{
  geometry: PlacedTileGeometry;
  opacityFrom: number;
}>;

type BuildBoardLayoutTransitionPlanArgs = Readonly<{
  previousBoard: BoardState;
  previousLayout: BoardLayoutSolution;
  nextBoard: BoardState;
  nextLayout: BoardLayoutSolution;
}>;

export function buildBoardLayoutTransitionPlan({
  previousBoard,
  previousLayout,
  nextBoard,
  nextLayout,
}: BuildBoardLayoutTransitionPlanArgs): BoardLayoutTransitionPlan | null {
  if (
    previousBoard.tiles.length > 0 &&
    previousBoard.spinnerTileId === null &&
    nextBoard.spinnerTileId !== null
  ) {
    return null;
  }

  const playedTiles = getAddedPlayedTiles(previousBoard, nextBoard);

  if (playedTiles.length !== 1) {
    return null;
  }

  const previousTileById = mapTilesById(previousLayout.geometry.placedTiles);
  const nextTileById = mapTilesById(nextLayout.geometry.placedTiles);
  const tileStarts = buildTileStarts(playedTiles, previousLayout, nextLayout);
  const boardRotation = detectBoardRotation(
    previousBoard,
    previousLayout,
    nextBoard,
    previousTileById,
    nextTileById,
  );
  const bendMotion = detectBendMotion(
    previousLayout,
    nextLayout,
    tileStarts,
    nextTileById,
    boardRotation,
  );
  const tilePlans = nextLayout.geometry.placedTiles.map((nextTile) => {
    const start = tileStarts.get(nextTile.tileId) ?? {
      geometry: nextTile,
      opacityFrom: 1,
    };
    const bendRotation =
      bendMotion && bendMotion.tileIds.includes(nextTile.tileId)
        ? { pivot: bendMotion.pivot, angleDeg: bendMotion.angleDeg }
        : null;
    const projected = applyProjectedMotions(
      start.geometry,
      boardRotation,
      bendRotation,
    );

    return {
      tileId: nextTile.tileId,
      from: start.geometry,
      to: nextTile,
      opacityFrom: start.opacityFrom,
      boardRotation,
      bendRotation,
      residualTranslation: {
        x: nextTile.center.x - projected.center.x,
        y: nextTile.center.y - projected.center.y,
      },
      residualRotationDeg: normalizeShortestAngle(
        nextTile.rotationDeg - projected.rotationDeg,
      ),
    } satisfies TileTransitionPlan;
  });

  return {
    cameraFrom: previousLayout.camera,
    cameraTo: nextLayout.camera,
    tilePlans,
  };
}

export function createStaticTileTransitionPlan(
  tile: PlacedTileGeometry,
): TileTransitionPlan {
  return {
    tileId: tile.tileId,
    from: tile,
    to: tile,
    opacityFrom: 1,
    boardRotation: null,
    bendRotation: null,
    residualTranslation: { x: 0, y: 0 },
    residualRotationDeg: 0,
  };
}

function getAddedPlayedTiles(
  previousBoard: BoardState,
  nextBoard: BoardState,
): readonly PlayedTile[] {
  const previousTileIds = new Set(previousBoard.tiles.map((tile) => tile.tile.id));

  if (nextBoard.tiles.length !== previousBoard.tiles.length + 1) {
    return [];
  }

  if (previousBoard.tiles.some((tile) => !nextBoard.tiles.some((candidate) => candidate.tile.id === tile.tile.id))) {
    return [];
  }

  return nextBoard.tiles.filter((tile) => !previousTileIds.has(tile.tile.id));
}

function buildTileStarts(
  addedTiles: readonly PlayedTile[],
  previousLayout: BoardLayoutSolution,
  nextLayout: BoardLayoutSolution,
): ReadonlyMap<TileId, TileStartState> {
  const starts = new Map<TileId, TileStartState>();
  const nextTileById = mapTilesById(nextLayout.geometry.placedTiles);

  for (const tile of previousLayout.geometry.placedTiles) {
    starts.set(tile.tileId, {
      geometry: tile,
      opacityFrom: 1,
    });
  }

  for (const playedTile of addedTiles) {
    const nextTile = nextTileById.get(playedTile.tile.id);

    if (!nextTile) {
      continue;
    }

    const projectedStart = projectPlayedTileFromPreviousLayout(
      previousLayout,
      playedTile,
    );

    starts.set(playedTile.tile.id, {
      geometry: projectedStart ?? nextTile,
      opacityFrom: projectedStart ? 1 : 0,
    });
  }

  return starts;
}

function detectBoardRotation(
  previousBoard: BoardState,
  previousLayout: BoardLayoutSolution,
  nextBoard: BoardState,
  previousTileById: ReadonlyMap<TileId, PlacedTileGeometry>,
  nextTileById: ReadonlyMap<TileId, PlacedTileGeometry>,
): RotationMotionPlan | null {
  const rootTileId =
    nextBoard.spinnerTileId && previousBoard.spinnerTileId === nextBoard.spinnerTileId
      ? nextBoard.spinnerTileId
      : previousLayout.problem.rootTileId;

  if (!rootTileId || rootTileId !== previousLayout.problem.rootTileId) {
    return null;
  }

  const previousRoot = previousTileById.get(rootTileId);
  const nextRoot = nextTileById.get(rootTileId);

  if (!previousRoot || !nextRoot) {
    return null;
  }

  const angleDeg = normalizeQuarterTurn(nextRoot.rotationDeg - previousRoot.rotationDeg);

  if (angleDeg === 0) {
    return null;
  }

  const pivotTileId =
    nextBoard.spinnerTileId && previousTileById.has(nextBoard.spinnerTileId)
      ? nextBoard.spinnerTileId
      : rootTileId;
  const pivotTile = nextTileById.get(pivotTileId) ?? previousTileById.get(pivotTileId);

  if (!pivotTile) {
    return null;
  }

  return {
    pivot: pivotTile.center,
    angleDeg,
  };
}

function detectBendMotion(
  previousLayout: BoardLayoutSolution,
  nextLayout: BoardLayoutSolution,
  tileStarts: ReadonlyMap<TileId, TileStartState>,
  nextTileById: ReadonlyMap<TileId, PlacedTileGeometry>,
  boardRotation: RotationMotionPlan | null,
): BendMotionPlan | null {
  const changedSides = SIDE_ORDER.filter(
    (side) =>
      !numberArrayEquals(previousLayout.bendPlan[side], nextLayout.bendPlan[side]),
  );

  for (const side of changedSides) {
    const previousSideTiles = getTilesForSide(previousLayout.geometry.placedTiles, side);
    const nextSideTiles = getTilesForSide(nextLayout.geometry.placedTiles, side);
    const sharedCount = Math.min(previousSideTiles.length, nextSideTiles.length);
    let firstAffectedIndex = -1;
    let sourceTileId: TileId | null = null;
    let previousHeading: LayoutOrientation | null = null;
    let nextHeading: LayoutOrientation | null = null;

    for (let index = 0; index < sharedCount; index += 1) {
      const previousTile = previousSideTiles[index];
      const nextTile = nextSideTiles[index];

      if (previousTile.tileId !== nextTile.tileId) {
        break;
      }

      const alignedHeading = rotateOrientation(
        previousTile.heading,
        boardRotation?.angleDeg ?? 0,
      );

      if (alignedHeading !== nextTile.heading) {
        firstAffectedIndex = index;
        sourceTileId = nextTile.tileId;
        previousHeading = alignedHeading;
        nextHeading = nextTile.heading;
        break;
      }
    }

    if (
      firstAffectedIndex === -1 &&
      nextSideTiles.length > previousSideTiles.length &&
      previousSideTiles.length > 0
    ) {
      const newTile = nextSideTiles[previousSideTiles.length];
      const previousTerminalTile = previousSideTiles[previousSideTiles.length - 1];
      const alignedHeading = rotateOrientation(
        previousTerminalTile.heading,
        boardRotation?.angleDeg ?? 0,
      );

      if (newTile && alignedHeading !== newTile.heading) {
        firstAffectedIndex = previousSideTiles.length;
        sourceTileId = newTile.tileId;
        previousHeading = alignedHeading;
        nextHeading = newTile.heading;
      }
    }

    if (
      firstAffectedIndex === -1 ||
      sourceTileId === null ||
      previousHeading === null ||
      nextHeading === null
    ) {
      continue;
    }

    const angleDeg = normalizeQuarterTurn(
      orientationToDegrees(nextHeading) - orientationToDegrees(previousHeading),
    );

    if (Math.abs(angleDeg) !== QUARTER_TURN_DEGREES) {
      continue;
    }

    const sourceStart = tileStarts.get(sourceTileId)?.geometry;
    const sourceEnd = nextTileById.get(sourceTileId);

    if (!sourceStart || !sourceEnd) {
      continue;
    }

    const rotatedSourceCenter = boardRotation
      ? rotatePoint(sourceStart.center, boardRotation.pivot, boardRotation.angleDeg)
      : sourceStart.center;
    const pivotAfterBoard = solveRotationPivot(
      rotatedSourceCenter,
      sourceEnd.center,
      angleDeg,
    );
    const pivot = boardRotation
      ? rotatePoint(pivotAfterBoard, boardRotation.pivot, -boardRotation.angleDeg)
      : pivotAfterBoard;

    return {
      side,
      tileIds: nextSideTiles
        .slice(firstAffectedIndex)
        .map((tile) => tile.tileId),
      pivot,
      angleDeg,
    };
  }

  return null;
}
function getTilesForSide(
  tiles: readonly PlacedTileGeometry[],
  side: ChainSide,
): readonly PlacedTileGeometry[] {
  return tiles.filter((tile) => tile.logicalSide === side);
}

function projectPlayedTileFromPreviousLayout(
  previousLayout: BoardLayoutSolution,
  playedTile: PlayedTile,
): PlacedTileGeometry | null {
  const inwardTileSide = resolveInwardTileSide(playedTile);
  const inwardPip =
    inwardTileSide === "sideA" ? playedTile.tile.sideA : playedTile.tile.sideB;
  const anchor =
    previousLayout.geometry.anchors.find(
      (candidate) =>
        candidate.direction === playedTile.side && candidate.openPip === inwardPip,
    ) ??
    previousLayout.geometry.anchors.find(
      (candidate) => candidate.direction === playedTile.side,
    );

  if (!anchor) {
    return null;
  }

  return projectPlacement(playedTile.tile, anchor, inwardTileSide);
}

function resolveInwardTileSide(playedTile: PlayedTile): TileSide {
  if (
    playedTile.tile.sideA === playedTile.openPipFacingOutward &&
    playedTile.tile.sideB !== playedTile.openPipFacingOutward
  ) {
    return "sideB";
  }

  return "sideA";
}

function applyProjectedMotions(
  tile: PlacedTileGeometry,
  boardRotation: RotationMotionPlan | null,
  bendRotation: RotationMotionPlan | null,
): Readonly<{ center: Point; rotationDeg: number }> {
  let center = tile.center;
  let rotationDeg = tile.rotationDeg;

  if (boardRotation) {
    center = rotatePoint(center, boardRotation.pivot, boardRotation.angleDeg);
    rotationDeg += boardRotation.angleDeg;
  }

  if (bendRotation) {
    const bendPivot = boardRotation
      ? rotatePoint(bendRotation.pivot, boardRotation.pivot, boardRotation.angleDeg)
      : bendRotation.pivot;

    center = rotatePoint(center, bendPivot, bendRotation.angleDeg);
    rotationDeg += bendRotation.angleDeg;
  }

  return {
    center,
    rotationDeg: normalizeDegrees(rotationDeg),
  };
}

function mapTilesById(
  tiles: readonly PlacedTileGeometry[],
): ReadonlyMap<TileId, PlacedTileGeometry> {
  return new Map(tiles.map((tile) => [tile.tileId, tile]));
}

function rotateOrientation(
  orientation: LayoutOrientation,
  angleDeg: number,
): LayoutOrientation {
  const quarterTurns = normalizeQuarterTurn(angleDeg) / QUARTER_TURN_DEGREES;
  const currentIndex = ORIENTATION_ORDER.indexOf(orientation);
  const nextIndex =
    ((currentIndex + quarterTurns) % ORIENTATION_ORDER.length + ORIENTATION_ORDER.length) %
    ORIENTATION_ORDER.length;

  return ORIENTATION_ORDER[nextIndex];
}

function orientationToDegrees(orientation: LayoutOrientation): number {
  return ORIENTATION_ORDER.indexOf(orientation) * QUARTER_TURN_DEGREES;
}

function rotatePoint(point: Point, pivot: Point, angleDeg: number): Point {
  if (angleDeg === 0) {
    return point;
  }

  const angleRad = (angleDeg * Math.PI) / HALF_TURN_DEGREES;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const offsetX = point.x - pivot.x;
  const offsetY = point.y - pivot.y;

  return {
    x: pivot.x + offsetX * cos - offsetY * sin,
    y: pivot.y + offsetX * sin + offsetY * cos,
  };
}

function solveRotationPivot(
  from: Point,
  to: Point,
  angleDeg: number,
): Point {
  const angleRad = (angleDeg * Math.PI) / HALF_TURN_DEGREES;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const a = 1 - cos;
  const b = sin;
  const determinant = a * a + b * b;

  if (Math.abs(determinant) < EPSILON) {
    return to;
  }

  const rotatedFromX = cos * from.x - sin * from.y;
  const rotatedFromY = sin * from.x + cos * from.y;
  const deltaX = to.x - rotatedFromX;
  const deltaY = to.y - rotatedFromY;

  return {
    x: (a * deltaX + b * deltaY) / determinant,
    y: (-b * deltaX + a * deltaY) / determinant,
  };
}

function normalizeDegrees(angleDeg: number): number {
  const normalized = angleDeg % FULL_ROTATION_DEGREES;
  return normalized < 0 ? normalized + FULL_ROTATION_DEGREES : normalized;
}

function normalizeQuarterTurn(angleDeg: number): number {
  const normalized = normalizeDegrees(angleDeg);

  if (normalized === 270) {
    return -QUARTER_TURN_DEGREES;
  }

  return normalized;
}

function normalizeShortestAngle(angleDeg: number): number {
  const normalized = normalizeQuarterTurn(angleDeg);

  if (normalized > HALF_TURN_DEGREES) {
    return normalized - FULL_ROTATION_DEGREES;
  }

  return normalized;
}

function numberArrayEquals(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
