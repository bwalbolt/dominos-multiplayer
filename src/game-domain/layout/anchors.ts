import { domino } from "../../../theme/tokens";
import {
  BoardState,
  ChainSide,
  DominoPip,
  PlayedTile,
  TileId,
  TileSide,
} from "../types";
import { projectPlacement } from "./project-placement";
import { getSpinnerBranchUnlocks } from "./spinner";
import {
  BoardGeometry,
  BoardLayoutOpenEnd,
  BoardLayoutProblem,
  BoardLayoutSolution,
  LayoutAnchor,
  LayoutOpenSlot,
  LayoutOrientation,
  LayoutScore,
  PlacedTileGeometry,
  Point,
  Rect,
  RootKind,
  Size,
} from "./types";
import { computeFitTransform } from "./viewport";

const DEFAULT_PADDING = domino.width;
const DEFAULT_VIEWPORT: Size = {
  width: 402,
  height: 560,
};
const SIDE_ORDER: readonly ChainSide[] = ["left", "right", "up", "down"];
const TURN_LEFT: Readonly<Record<LayoutOrientation, LayoutOrientation>> = {
  right: "up",
  up: "left",
  left: "down",
  down: "right",
};
const TURN_RIGHT: Readonly<Record<LayoutOrientation, LayoutOrientation>> = {
  right: "down",
  down: "left",
  left: "up",
  up: "right",
};
const SCORE_EPSILON = 0.000001;

type CalculateBoardGeometryOptions = {
  readonly viewport?: Size;
  readonly padding?: number;
};

type RootCandidate = Readonly<{
  rotationDeg: number;
  startHeadings: Partial<Record<ChainSide, LayoutOrientation>>;
}>;

type ExtractedLayoutProblem = Readonly<{
  problem: BoardLayoutProblem;
  rootTile: PlayedTile;
  armTilesBySide: Readonly<Record<ChainSide, readonly PlayedTile[]>>;
  openEndsBySide: Readonly<Partial<Record<ChainSide, DominoPip>>>;
  rootPipsBySide: Readonly<Partial<Record<ChainSide, DominoPip>>>;
}>;

type RuntimeArmState = Readonly<{
  side: ChainSide;
  isOpen: boolean;
  tiles: readonly PlayedTile[];
  startHeading: LayoutOrientation;
  rootAttachmentPoint: Point;
  openFaceCenter: Point | null;
  currentHeading: LayoutOrientation;
  placedCount: number;
  bends: number;
  leftTurns: number;
  rightTurns: number;
  runLengths: readonly number[];
  currentRunLength: number;
  lastTileId: TileId | null;
}>;

type SolverPlacedTile = PlacedTileGeometry & {
  readonly placedAtSeq: number;
  readonly logicalSide: ChainSide;
  readonly heading: LayoutOrientation;
};

type SearchState = Readonly<{
  placedTiles: readonly SolverPlacedTile[];
  tileRects: readonly Rect[];
  openSlots: readonly LayoutOpenSlot[];
  arms: Readonly<Record<ChainSide, RuntimeArmState>>;
}>;

export function calculateBoardGeometry(
  board: BoardState,
  options?: CalculateBoardGeometryOptions,
): BoardGeometry {
  return solveBoardLayout(board, options).geometry;
}

export function solveBoardLayout(
  board: BoardState,
  options?: CalculateBoardGeometryOptions,
): BoardLayoutSolution {
  if (board.tiles.length === 0) {
    return buildEmptySolution(options?.viewport ?? null, options?.padding ?? DEFAULT_PADDING);
  }

  const extracted = extractProblem(board, options?.viewport ?? null);
  const padding = options?.padding ?? DEFAULT_PADDING;
  const viewport = normalizeViewport(extracted.problem.viewport);
  const matchingRootCandidates =
    extracted.problem.rootKind === "spinner"
      ? buildRootCandidates(extracted.problem.rootKind)
      : buildRootCandidates(extracted.problem.rootKind).filter((candidate) =>
          isCompatibleLineRootCandidate(
            extracted.rootTile,
            extracted.rootPipsBySide,
            candidate,
          ),
        );
  const rootCandidates =
    matchingRootCandidates.length > 0
      ? matchingRootCandidates
      : buildRootCandidates(extracted.problem.rootKind);
  let best: BoardLayoutSolution | null = null;

  for (const rootCandidate of rootCandidates) {
    const initialState = createInitialState(extracted, rootCandidate);
    const seeded = buildSeedSolutions(extracted, initialState, padding, viewport);

    for (const solution of seeded) {
      if (!best || isBetterScore(solution.score, best.score)) {
        best = solution;
      }
    }

    best = search(extracted, initialState, padding, viewport, best);
  }

  if (best) {
    return best;
  }

  return buildFinalSolution(extracted, createInitialState(extracted, rootCandidates[0]), padding, viewport);
}

export function extractBoardLayoutProblem(
  board: BoardState,
  viewport: Size | null,
): BoardLayoutProblem {
  const extracted = extractProblem(board, viewport);
  return extracted.problem;
}

function search(
  extracted: ExtractedLayoutProblem,
  state: SearchState,
  padding: number,
  viewport: Size | null,
  best: BoardLayoutSolution | null,
): BoardLayoutSolution | null {
  const nextSide = selectNextSide(state.arms);

  if (nextSide === null) {
    const candidate = buildFinalSolution(extracted, state, padding, viewport);
    return !best || isBetterScore(candidate.score, best.score) ? candidate : best;
  }

  let currentBest = best;
  const candidateStates = buildCandidateStates(state, nextSide);

  for (const candidateState of candidateStates) {
    const optimistic = buildOptimisticStateScore(extracted, candidateState, padding, viewport);

    if (currentBest && !canBeat(optimistic, currentBest.score)) {
      continue;
    }

    currentBest = search(extracted, candidateState, padding, viewport, currentBest);
  }

  return currentBest;
}

function buildSeedSolutions(
  extracted: ExtractedLayoutProblem,
  initialState: SearchState,
  padding: number,
  viewport: Size | null,
): readonly BoardLayoutSolution[] {
  const solutions: BoardLayoutSolution[] = [];
  const patterns = [
    { segments: [Number.POSITIVE_INFINITY], turn: "left" as const },
    { segments: [3, 3, 2], turn: "left" as const },
    { segments: [3, 3, 2], turn: "right" as const },
  ];

  for (const pattern of patterns) {
    const candidate = buildPatternSolution(extracted, initialState, pattern.segments, pattern.turn, padding, viewport);

    if (candidate) {
      solutions.push(candidate);
    }
  }

  return solutions;
}

function buildPatternSolution(
  extracted: ExtractedLayoutProblem,
  initialState: SearchState,
  segments: readonly number[],
  turn: "left" | "right",
  padding: number,
  viewport: Size | null,
): BoardLayoutSolution | null {
  let state = initialState;

  for (const side of getSolveOrder(state.arms)) {
    const arm = state.arms[side];
    let heading = arm.startHeading;
    let segmentIndex = 0;
    let segmentTarget = getSegmentTarget(segments, segmentIndex);
    let segmentCount = 0;

    for (let index = 0; index < arm.tiles.length; index += 1) {
      if (segmentCount >= segmentTarget) {
        heading = turn === "left" ? TURN_LEFT[heading] : TURN_RIGHT[heading];
        segmentIndex += 1;
        segmentTarget = getSegmentTarget(segments, segmentIndex);
        segmentCount = 0;
      }

      const nextState = buildCandidateStates(state, side).find((candidate) => {
        const placedTile = candidate.placedTiles[candidate.placedTiles.length - 1];
        return placedTile.heading === heading;
      });

      if (!nextState) {
        return null;
      }

      state = nextState;
      segmentCount += 1;
    }
  }

  return buildFinalSolution(extracted, state, padding, viewport);
}

function buildEmptySolution(
  viewport: Size | null,
  padding: number,
): BoardLayoutSolution {
  const geometry: BoardGeometry = {
    placedTiles: [],
    anchors: [
      {
        id: "initial",
        ownerTileId: null,
        attachmentPoint: { x: 0, y: 0 },
        direction: "left",
        openPip: 0,
      },
    ],
  };
  const problem: BoardLayoutProblem = {
    viewport,
    tileSize: {
      shortSide: domino.width,
      longSide: domino.height,
    },
    rootKind: "line",
    rootTileId: null,
    openEnds: [],
    arms: SIDE_ORDER.map((side) => ({
      side,
      isOpen: false,
      tiles: [],
    })),
  };
  const camera = computeFitTransform(createZeroRect(), viewport ?? DEFAULT_VIEWPORT, padding);

  return {
    geometry,
    openSlots: [],
    occupiedBounds: createZeroRect(),
    playableBounds: createZeroRect(),
    fitScale: viewport ? camera.scale : 1,
    camera,
    bendPlan: {
      left: [],
      right: [],
      up: [],
      down: [],
    },
    score: {
      fitScale: viewport ? camera.scale : 1,
      compactness: 0,
      bendCount: 0,
      rightTurnCount: 0,
      leftTurnCount: 0,
    },
    problem,
  };
}

function extractProblem(
  board: BoardState,
  viewport: Size | null,
): ExtractedLayoutProblem {
  const sortedTiles = [...board.tiles].sort((left, right) => left.placedAtSeq - right.placedAtSeq);
  const spinnerId = board.spinnerTileId;
  const rootTileIndex = spinnerId 
    ? sortedTiles.findIndex(t => t.tile.id === spinnerId)
    : 0;
  const rootTile = sortedTiles[rootTileIndex === -1 ? 0 : rootTileIndex];
  const rootKind: RootKind = rootTile.tile.sideA === rootTile.tile.sideB ? "spinner" : "line";
  
  // armTiles are all tiles EXCEPT the root tile
  const armTiles = sortedTiles.filter((_, index) => index !== (rootTileIndex === -1 ? 0 : rootTileIndex));
  const armTilesBySide = groupTilesBySide(armTiles);
  const activeOpenEnds = getActiveOpenEnds(board);
  const openEndsBySide = activeOpenEnds.reduce<Partial<Record<ChainSide, DominoPip>>>(
    (accumulator, openEnd) => ({
      ...accumulator,
      [openEnd.side]: openEnd.openPip,
    }),
    {},
  );
  const openEndSideSet = new Set(activeOpenEnds.map((openEnd) => openEnd.side));

  return {
    rootTile,
    armTilesBySide,
    openEndsBySide,
    rootPipsBySide: getRootPipsBySide(armTilesBySide, board.openEnds),
    problem: {
      viewport,
      tileSize: {
        shortSide: domino.width,
        longSide: domino.height,
      },
      rootKind,
      rootTileId: rootTile.tile.id,
      openEnds: activeOpenEnds,
      arms: SIDE_ORDER.map((side) => ({
        side,
        isOpen: openEndSideSet.has(side),
        tiles: armTilesBySide[side].map((tile) => ({
          tileId: tile.tile.id,
          isDouble: tile.tile.sideA === tile.tile.sideB,
        })),
      })),
    },
  };
}

function getActiveOpenEnds(board: BoardState): readonly BoardLayoutOpenEnd[] {
  const { up, down } = getSpinnerBranchUnlocks(board);

  return board.openEnds
    .filter((openEnd) => {
      if (openEnd.side === "up") {
        return up;
      }

      if (openEnd.side === "down") {
        return down;
      }

      return true;
    })
    .map((openEnd) => ({
      side: openEnd.side,
      ownerTileId: openEnd.tileId,
      openPip: openEnd.pip,
    }));
}

function groupTilesBySide(
  tiles: readonly PlayedTile[],
): Readonly<Record<ChainSide, readonly PlayedTile[]>> {
  const grouped: Record<ChainSide, PlayedTile[]> = {
    left: [],
    right: [],
    up: [],
    down: [],
  };

  for (const tile of tiles) {
    grouped[tile.side].push(tile);
  }

  for (const side of SIDE_ORDER) {
    grouped[side].sort((left, right) => left.placedAtSeq - right.placedAtSeq);
  }

  return grouped;
}

function buildRootCandidates(rootKind: RootKind): readonly RootCandidate[] {
  if (rootKind === "spinner") {
    return [
      {
        rotationDeg: 0,
        startHeadings: {
          left: "left",
          right: "right",
          up: "up",
          down: "down",
        },
      },
    ];
  }

  return [
    {
      rotationDeg: 90,
      startHeadings: {
        left: "left",
        right: "right",
      },
    },
    {
      rotationDeg: 270,
      startHeadings: {
        left: "left",
        right: "right",
      },
    },
    {
      rotationDeg: 0,
      startHeadings: {
        left: "up",
        right: "down",
      },
    },
    {
      rotationDeg: 0,
      startHeadings: {
        left: "down",
        right: "up",
      },
    },
    {
      rotationDeg: 180,
      startHeadings: {
        left: "down",
        right: "up",
      },
    },
    {
      rotationDeg: 180,
      startHeadings: {
        left: "up",
        right: "down",
      },
    },
  ];
}

function getInwardPip(playedTile: PlayedTile): DominoPip {
  if (playedTile.tile.sideA === playedTile.tile.sideB) {
    return playedTile.tile.sideA;
  }

  return playedTile.tile.sideA === playedTile.openPipFacingOutward
    ? playedTile.tile.sideB
    : playedTile.tile.sideA;
}

function getPipAtDirection(
  tile: PlayedTile["tile"],
  rotationDeg: number,
  direction: LayoutOrientation,
): DominoPip | undefined {
  switch (rotationDeg) {
    case 0:
      return direction === "up"
        ? tile.sideA
        : direction === "down"
          ? tile.sideB
          : undefined;
    case 90:
      return direction === "right"
        ? tile.sideA
        : direction === "left"
          ? tile.sideB
          : undefined;
    case 180:
      return direction === "down"
        ? tile.sideA
        : direction === "up"
          ? tile.sideB
          : undefined;
    case 270:
      return direction === "left"
        ? tile.sideA
        : direction === "right"
          ? tile.sideB
          : undefined;
    default:
      return undefined;
  }
}

function getRootPipsBySide(
  armTilesBySide: Readonly<Record<ChainSide, readonly PlayedTile[]>>,
  boardOpenEnds: readonly BoardState["openEnds"][number][],
): Partial<Record<ChainSide, DominoPip>> {
  const rootPipsBySide: Partial<Record<ChainSide, DominoPip>> = {};

  for (const side of ["left", "right"] as const) {
    const firstArmTile = armTilesBySide[side][0];

    if (firstArmTile) {
      rootPipsBySide[side] = getInwardPip(firstArmTile);
      continue;
    }

    const openEnd = boardOpenEnds.find((candidate) => candidate.side === side);
    if (openEnd) {
      rootPipsBySide[side] = openEnd.pip;
    }
  }

  return rootPipsBySide;
}

function isCompatibleLineRootCandidate(
  rootTile: PlayedTile,
  rootPipsBySide: Readonly<Partial<Record<ChainSide, DominoPip>>>,
  candidate: RootCandidate,
): boolean {
  for (const side of ["left", "right"] as const) {
    const expectedPip = rootPipsBySide[side];

    if (expectedPip === undefined) {
      continue;
    }

    const direction = candidate.startHeadings[side];
    if (!direction) {
      return false;
    }

    const actualPip = getPipAtDirection(rootTile.tile, candidate.rotationDeg, direction);
    if (actualPip !== expectedPip) {
      return false;
    }
  }

  return true;
}

function createRootPlacedTile(rootTile: PlayedTile, rotationDeg: number): SolverPlacedTile {
  const isVertical = rotationDeg === 0 || rotationDeg === 180;

  return {
    tileId: rootTile.tile.id,
    value1: rootTile.tile.sideA,
    value2: rootTile.tile.sideB,
    center: { x: 0, y: 0 },
    rotationDeg,
    width: isVertical ? domino.width : domino.height,
    height: isVertical ? domino.height : domino.width,
    placedAtSeq: rootTile.placedAtSeq,
    logicalSide: rootTile.side,
    heading:
      rotationDeg === 0
        ? "up"
        : rotationDeg === 180
          ? "down"
          : rotationDeg === 90
            ? "right"
            : "left",
  };
}

function resolveInwardTileSide(playedTile: PlayedTile): TileSide {
  return playedTile.tile.sideA === getInwardPip(playedTile) ? "sideA" : "sideB";
}

function createPlacement(
  playedTile: PlayedTile,
  logicalSide: ChainSide,
  attachmentPoint: Point,
  heading: LayoutOrientation,
): SolverPlacedTile {
  const anchor: LayoutAnchor = {
    id: `${playedTile.tile.id}-${logicalSide}`,
    ownerTileId: null,
    attachmentPoint,
    direction: logicalSide,
    ...(heading === logicalSide ? {} : { visualDirection: heading }),
    openPip: playedTile.openPipFacingOutward,
  };
  const geometry = projectPlacement(
    playedTile.tile,
    anchor,
    resolveInwardTileSide(playedTile),
  );

  return {
    ...geometry,
    placedAtSeq: playedTile.placedAtSeq,
    logicalSide,
    heading,
  };
}

function createInitialState(
  extracted: ExtractedLayoutProblem,
  rootCandidate: RootCandidate,
): SearchState {
  const rootTile = createRootPlacedTile(extracted.rootTile, rootCandidate.rotationDeg);
  const rootRect = rectFromTile(rootTile);
  const rootAnchors = SIDE_ORDER.reduce<Record<ChainSide, Point>>((accumulator, side) => {
    const heading = rootCandidate.startHeadings[side] ?? side;
    accumulator[side] = getRectEdgePoint(rootRect, heading);
    return accumulator;
  }, {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    up: { x: 0, y: 0 },
    down: { x: 0, y: 0 },
  });

  const arms = SIDE_ORDER.reduce<Record<ChainSide, RuntimeArmState>>((accumulator, side) => {
    const armProblem = extracted.problem.arms.find((arm) => arm.side === side);

    accumulator[side] = {
      side,
      isOpen: armProblem?.isOpen ?? false,
      tiles: extracted.armTilesBySide[side],
      startHeading: rootCandidate.startHeadings[side] ?? side,
      rootAttachmentPoint: rootAnchors[side],
      openFaceCenter: null,
      currentHeading: rootCandidate.startHeadings[side] ?? side,
      placedCount: 0,
      bends: 0,
      leftTurns: 0,
      rightTurns: 0,
      runLengths: [],
      currentRunLength: 0,
      lastTileId: extracted.rootTile.tile.id,
    };
    return accumulator;
  }, {
    left: createEmptyArmState("left"),
    right: createEmptyArmState("right"),
    up: createEmptyArmState("up"),
    down: createEmptyArmState("down"),
  });

  const openSlots = SIDE_ORDER.flatMap((side) => {
    const arm = arms[side];

    if (!arm.isOpen || arm.tiles.length > 0) {
      return [];
    }

    return [createOpenSlot(side, arm.rootAttachmentPoint, arm.startHeading)];
  });

  return {
    placedTiles: [rootTile],
    tileRects: [rootRect],
    openSlots,
    arms,
  };
}

function createEmptyArmState(side: ChainSide): RuntimeArmState {
  return {
    side,
    isOpen: false,
    tiles: [],
    startHeading: side,
    rootAttachmentPoint: { x: 0, y: 0 },
    openFaceCenter: null,
    currentHeading: side,
    placedCount: 0,
    bends: 0,
    leftTurns: 0,
    rightTurns: 0,
    runLengths: [],
    currentRunLength: 0,
    lastTileId: null,
  };
}

function rectFromTile(tile: PlacedTileGeometry): Rect {
  return {
    x: tile.center.x - tile.width / 2,
    y: tile.center.y - tile.height / 2,
    width: tile.width,
    height: tile.height,
  };
}

function getRectEdgePoint(rect: Rect, heading: LayoutOrientation): Point {
  if (heading === "left") {
    return { x: rect.x, y: rect.y + rect.height / 2 };
  }

  if (heading === "right") {
    return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
  }

  if (heading === "up") {
    return { x: rect.x + rect.width / 2, y: rect.y };
  }

  return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
}

function offsetPoint(
  point: Point,
  heading: LayoutOrientation,
  distance: number,
): Point {
  if (heading === "left") {
    return { x: point.x - distance, y: point.y };
  }

  if (heading === "right") {
    return { x: point.x + distance, y: point.y };
  }

  if (heading === "up") {
    return { x: point.x, y: point.y - distance };
  }

  return { x: point.x, y: point.y + distance };
}

function getOpenFaceCenter(
  tile: PlacedTileGeometry,
  heading: LayoutOrientation,
): Point {
  if (tile.value1 === tile.value2) {
    return tile.center;
  }

  return offsetPoint(tile.center, heading, domino.width / 2);
}

function getPlacementAttachmentPoint(
  openFaceCenter: Point,
  heading: LayoutOrientation,
): Point {
  return offsetPoint(openFaceCenter, heading, domino.width / 2);
}

function createOpenSlot(
  side: ChainSide,
  attachmentPoint: Point,
  heading: LayoutOrientation,
): LayoutOpenSlot {
  return {
    side,
    attachmentPoint,
    visualDirection: heading,
    rect: createSlotRect(attachmentPoint, heading),
  };
}

function createSlotRect(attachmentPoint: Point, heading: LayoutOrientation): Rect {
  if (heading === "left") {
    return {
      x: attachmentPoint.x - domino.height,
      y: attachmentPoint.y - domino.width / 2,
      width: domino.height,
      height: domino.width,
    };
  }

  if (heading === "right") {
    return {
      x: attachmentPoint.x,
      y: attachmentPoint.y - domino.width / 2,
      width: domino.height,
      height: domino.width,
    };
  }

  if (heading === "up") {
    return {
      x: attachmentPoint.x - domino.width / 2,
      y: attachmentPoint.y - domino.height,
      width: domino.width,
      height: domino.height,
    };
  }

  return {
    x: attachmentPoint.x - domino.width / 2,
    y: attachmentPoint.y,
    width: domino.width,
    height: domino.height,
  };
}

function updateArmState(
  arm: RuntimeArmState,
  tileId: TileId,
  openFaceCenter: Point,
  nextHeading: LayoutOrientation,
  turnDirection: "straight" | "left" | "right",
): RuntimeArmState {
  const isTurn = turnDirection !== "straight" && arm.placedCount > 0;
  const nextRunLengths =
    arm.placedCount === 0
      ? [1]
      : turnDirection === "straight"
        ? [...arm.runLengths.slice(0, -1), arm.currentRunLength + 1]
        : [...arm.runLengths, 1];

  return {
    ...arm,
    openFaceCenter,
    currentHeading: nextHeading,
    placedCount: arm.placedCount + 1,
    bends: arm.bends + (isTurn ? 1 : 0),
    leftTurns: arm.leftTurns + (turnDirection === "left" ? 1 : 0),
    rightTurns: arm.rightTurns + (turnDirection === "right" ? 1 : 0),
    runLengths: nextRunLengths,
    currentRunLength: turnDirection === "straight" ? arm.currentRunLength + 1 : 1,
    lastTileId: tileId,
  };
}

function selectNextSide(
  arms: Readonly<Record<ChainSide, RuntimeArmState>>,
): ChainSide | null {
  const candidates = SIDE_ORDER.filter((side) => arms[side].placedCount < arms[side].tiles.length);

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((leftSide, rightSide) => {
    const leftRemaining = arms[leftSide].tiles.length - arms[leftSide].placedCount;
    const rightRemaining = arms[rightSide].tiles.length - arms[rightSide].placedCount;

    if (leftRemaining !== rightRemaining) {
      return rightRemaining - leftRemaining;
    }

    return SIDE_ORDER.indexOf(leftSide) - SIDE_ORDER.indexOf(rightSide);
  });

  return candidates[0];
}

function buildCandidateStates(
  state: SearchState,
  side: ChainSide,
): readonly SearchState[] {
  const arm = state.arms[side];
  const playedTile = arm.tiles[arm.placedCount];

  if (!playedTile) {
    return [];
  }

  const previousHeading = arm.placedCount === 0 ? arm.startHeading : arm.currentHeading;
  const headings =
    arm.placedCount === 0
      ? [arm.startHeading]
      : [arm.currentHeading, TURN_LEFT[previousHeading], TURN_RIGHT[previousHeading]];
  const uniqueHeadings = [...new Set(headings)];
  const candidates: SearchState[] = [];

  for (const heading of uniqueHeadings) {
    const attachmentPoint =
      arm.placedCount === 0 || arm.openFaceCenter === null
        ? arm.rootAttachmentPoint
        : getPlacementAttachmentPoint(arm.openFaceCenter, heading);
    const tile = createPlacement(playedTile, side, attachmentPoint, heading);
    const tileRect = rectFromTile(tile);

    if (
      hasRectOverlap(tileRect, state.tileRects) ||
      hasReservedSlotOverlap(tileRect, state.openSlots)
    ) {
      continue;
    }

    const turnDirection =
      arm.placedCount === 0 || heading === previousHeading
        ? "straight"
        : TURN_LEFT[previousHeading] === heading
          ? "left"
          : "right";
    const nextOpenFaceCenter = getOpenFaceCenter(tile, heading);
    const nextArm = updateArmState(
      arm,
      tile.tileId,
      nextOpenFaceCenter,
      heading,
      turnDirection,
    );
    const nextArms = {
      ...state.arms,
      [side]: nextArm,
    };
    const createdOpenSlot =
      nextArm.placedCount === nextArm.tiles.length && nextArm.isOpen
        ? createOpenSlot(
            side,
            getPlacementAttachmentPoint(nextOpenFaceCenter, heading),
            heading,
          )
        : null;
    const nextOpenSlots = createdOpenSlot ? [...state.openSlots, createdOpenSlot] : state.openSlots;

    if (hasOpenSlotOverlap(createdOpenSlot, [...state.tileRects, tileRect], state.openSlots)) {
      continue;
    }

    candidates.push({
      placedTiles: [...state.placedTiles, tile],
      tileRects: [...state.tileRects, tileRect],
      openSlots: nextOpenSlots,
      arms: nextArms,
    });
  }

  candidates.sort((left, right) => {
    const leftScore = buildOptimisticScore(left);
    const rightScore = buildOptimisticScore(right);

    if (Math.abs(leftScore.fitScale - rightScore.fitScale) > SCORE_EPSILON) {
      return rightScore.fitScale - leftScore.fitScale;
    }

    if (Math.abs(leftScore.compactness - rightScore.compactness) > SCORE_EPSILON) {
      return leftScore.compactness - rightScore.compactness;
    }

    return leftScore.rightTurnCount - rightScore.rightTurnCount;
  });

  return candidates;
}

function buildOptimisticScore(state: SearchState): LayoutScore {
  return {
    fitScale: 1,
    compactness: state.placedTiles.reduce(
      (total, tile) => total + tile.center.x * tile.center.x + tile.center.y * tile.center.y,
      0,
    ),
    bendCount: SIDE_ORDER.reduce((total, side) => total + state.arms[side].bends, 0),
    rightTurnCount: SIDE_ORDER.reduce((total, side) => total + state.arms[side].rightTurns, 0),
    leftTurnCount: SIDE_ORDER.reduce((total, side) => total + state.arms[side].leftTurns, 0),
  };
}

function hasRectOverlap(candidateRect: Rect, rects: readonly Rect[]): boolean {
  return rects.some((rect) => rectsOverlap(rect, candidateRect));
}

function hasReservedSlotOverlap(
  candidateRect: Rect,
  openSlots: readonly LayoutOpenSlot[],
): boolean {
  return openSlots.some((openSlot) => rectsOverlap(openSlot.rect, candidateRect));
}

function hasOpenSlotOverlap(
  slot: LayoutOpenSlot | null,
  tileRects: readonly Rect[],
  openSlots: readonly LayoutOpenSlot[],
): boolean {
  if (!slot) {
    return false;
  }

  if (hasRectOverlap(slot.rect, tileRects)) {
    return true;
  }

  return openSlots.some((openSlot) => rectsOverlap(openSlot.rect, slot.rect));
}

function rectsOverlap(left: Rect, right: Rect): boolean {
  const overlapX = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
  const overlapY = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);

  return overlapX > 0.01 && overlapY > 0.01;
}

function boundsFromRects(rects: readonly Rect[]): Rect {
  if (rects.length === 0) {
    return createZeroRect();
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function createZeroRect(): Rect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
}

function buildFinalSolution(
  extracted: ExtractedLayoutProblem,
  state: SearchState,
  padding: number,
  viewport: Size | null,
): BoardLayoutSolution {
  const placedTiles = [...state.placedTiles].sort((left, right) => left.placedAtSeq - right.placedAtSeq);
  const publicPlacedTiles: readonly PlacedTileGeometry[] = placedTiles.map((tile) => ({
    tileId: tile.tileId,
    value1: tile.value1,
    value2: tile.value2,
    center: tile.center,
    rotationDeg: tile.rotationDeg,
    width: tile.width,
    height: tile.height,
  }));
  const anchors = buildAnchors(extracted, state, publicPlacedTiles);
  const openSlots = anchors.map((anchor) =>
    createOpenSlot(anchor.direction, anchor.attachmentPoint, anchor.visualDirection ?? anchor.direction),
  );
  const occupiedBounds = boundsFromRects(publicPlacedTiles.map(rectFromTile));
  const playableBounds = boundsFromRects([
    ...publicPlacedTiles.map(rectFromTile),
    ...openSlots.map((slot) => slot.rect),
  ]);
  const camera = computeFitTransform(playableBounds, viewport ?? DEFAULT_VIEWPORT, padding);
  const score = computeScore(publicPlacedTiles, camera.scale, state.arms);

  return {
    geometry: {
      placedTiles: publicPlacedTiles,
      anchors,
    },
    openSlots,
    occupiedBounds,
    playableBounds,
    fitScale: score.fitScale,
    camera,
    bendPlan: {
      left: state.arms.left.runLengths,
      right: state.arms.right.runLengths,
      up: state.arms.up.runLengths,
      down: state.arms.down.runLengths,
    },
    score,
    problem: extracted.problem,
  };
}

function buildAnchors(
  extracted: ExtractedLayoutProblem,
  state: SearchState,
  placedTiles: readonly PlacedTileGeometry[],
): readonly LayoutAnchor[] {
  return extracted.problem.openEnds.map((openEnd) => {
    const arm = state.arms[openEnd.side];
    const ownerTileId = arm.placedCount > 0 ? arm.lastTileId : extracted.rootTile.tile.id;
    const visualDirection = arm.placedCount > 0 ? arm.currentHeading : arm.startHeading;
    const attachmentPoint = arm.placedCount > 0
      ? arm.openFaceCenter
        ? getPlacementAttachmentPoint(arm.openFaceCenter, visualDirection)
        : arm.rootAttachmentPoint
      : arm.rootAttachmentPoint;

    return {
      id: `${ownerTileId ?? "root"}-${openEnd.side}`,
      ownerTileId,
      attachmentPoint,
      direction: openEnd.side,
      ...(visualDirection === openEnd.side ? {} : { visualDirection }),
      openPip: openEnd.openPip,
    };
  });
}

function buildOptimisticStateScore(
  extracted: ExtractedLayoutProblem,
  state: SearchState,
  padding: number,
  viewport: Size | null,
): LayoutScore {
  const anchors = buildAnchors(
    extracted,
    {
      ...state,
      arms: SIDE_ORDER.reduce<Record<ChainSide, RuntimeArmState>>((accumulator, side) => {
        accumulator[side] = state.arms[side];
        return accumulator;
      }, {
        left: state.arms.left,
        right: state.arms.right,
        up: state.arms.up,
        down: state.arms.down,
      }),
    },
    state.placedTiles,
  );
  const openSlots = anchors
    .filter((anchor) => state.arms[anchor.direction].placedCount === state.arms[anchor.direction].tiles.length)
    .map((anchor) =>
      createOpenSlot(anchor.direction, anchor.attachmentPoint, anchor.visualDirection ?? anchor.direction),
    );
  const playableBounds = boundsFromRects([
    ...state.tileRects,
    ...openSlots.map((slot) => slot.rect),
  ]);
  const camera = computeFitTransform(playableBounds, viewport ?? DEFAULT_VIEWPORT, padding);

  return computeScore(state.placedTiles, viewport ? camera.scale : 1, state.arms);
}

function computeScore(
  placedTiles: readonly PlacedTileGeometry[],
  fitScale: number,
  arms: Readonly<Record<ChainSide, RuntimeArmState>>,
): LayoutScore {
  const compactness = placedTiles.reduce(
    (total, tile) => total + tile.center.x * tile.center.x + tile.center.y * tile.center.y,
    0,
  );

  return {
    fitScale,
    compactness,
    bendCount: SIDE_ORDER.reduce((total, side) => total + arms[side].bends, 0),
    rightTurnCount: SIDE_ORDER.reduce((total, side) => total + arms[side].rightTurns, 0),
    leftTurnCount: SIDE_ORDER.reduce((total, side) => total + arms[side].leftTurns, 0),
  };
}

function canBeat(candidate: LayoutScore, best: LayoutScore): boolean {
  if (candidate.fitScale < best.fitScale - SCORE_EPSILON) {
    return false;
  }

  if (Math.abs(candidate.fitScale - best.fitScale) <= SCORE_EPSILON) {
    if (candidate.compactness > best.compactness + SCORE_EPSILON) {
      return false;
    }

    if (Math.abs(candidate.compactness - best.compactness) <= SCORE_EPSILON) {
      if (candidate.bendCount > best.bendCount) {
        return false;
      }

      if (candidate.bendCount === best.bendCount && candidate.rightTurnCount > best.rightTurnCount) {
        return false;
      }
    }
  }

  return true;
}

function isBetterScore(left: LayoutScore, right: LayoutScore): boolean {
  if (left.fitScale > right.fitScale + SCORE_EPSILON) {
    return true;
  }

  if (left.fitScale < right.fitScale - SCORE_EPSILON) {
    return false;
  }

  if (left.compactness < right.compactness - SCORE_EPSILON) {
    return true;
  }

  if (left.compactness > right.compactness + SCORE_EPSILON) {
    return false;
  }

  if (left.bendCount !== right.bendCount) {
    return left.bendCount < right.bendCount;
  }

  if (left.rightTurnCount !== right.rightTurnCount) {
    return left.rightTurnCount < right.rightTurnCount;
  }

  return left.leftTurnCount > right.leftTurnCount;
}

function getSolveOrder(
  arms: Readonly<Record<ChainSide, RuntimeArmState>>,
): readonly ChainSide[] {
  return [...SIDE_ORDER].sort((leftSide, rightSide) => {
    const leftLength = arms[leftSide].tiles.length;
    const rightLength = arms[rightSide].tiles.length;

    if (leftLength !== rightLength) {
      return rightLength - leftLength;
    }

    return SIDE_ORDER.indexOf(leftSide) - SIDE_ORDER.indexOf(rightSide);
  });
}

function getSegmentTarget(segments: readonly number[], index: number): number {
  if (segments.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (index < segments.length) {
    return segments[index];
  }

  return segments[segments.length - 1];
}

function normalizeViewport(viewport: Size | null): Size | null {
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  return viewport;
}
