import {
  buildBoardLayoutTransitionPlan,
} from "../animation-plan";
import { BoardLayoutSolution, LayoutAnchor, PlacedTileGeometry } from "../types";
import { BoardState, DominoPip, PlayerId, Tile, TileId } from "../../types";
import { domino } from "../../../../theme/tokens";

const player = "p1" as PlayerId;

const createTile = (id: string, sideA: DominoPip, sideB: DominoPip): Tile => ({
  id: id as TileId,
  sideA,
  sideB,
});

const createPlacedTile = (
  tile: Tile,
  center: { x: number; y: number },
  rotationDeg: number,
  placedAtSeq: number,
  logicalSide: "left" | "right" | "up" | "down",
  heading: "up" | "right" | "down" | "left",
): PlacedTileGeometry => ({
  tileId: tile.id,
  value1: tile.sideA,
  value2: tile.sideB,
  center,
  rotationDeg,
  width: rotationDeg === 0 || rotationDeg === 180 ? domino.width : domino.height,
  height: rotationDeg === 0 || rotationDeg === 180 ? domino.height : domino.width,
  placedAtSeq,
  logicalSide,
  heading,
});

const createAnchor = (
  id: string,
  ownerTileId: TileId,
  attachmentPoint: { x: number; y: number },
  direction: "left" | "right" | "up" | "down",
  openPip: DominoPip,
): LayoutAnchor => ({
  id,
  ownerTileId,
  attachmentPoint,
  direction,
  openPip,
});

const createBoard = (
  spinnerTileId: TileId | null,
  openEnds: BoardState["openEnds"],
  tiles: BoardState["tiles"],
): BoardState => ({
  layoutDirection: "wrapped",
  spinnerTileId,
  openEnds,
  tiles,
});

const createSolution = (
  rootTileId: TileId,
  tiles: readonly PlacedTileGeometry[],
  anchors: readonly LayoutAnchor[],
  bendPlan: BoardLayoutSolution["bendPlan"],
  camera: BoardLayoutSolution["camera"] = {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
): BoardLayoutSolution => ({
  geometry: {
    placedTiles: tiles,
    anchors,
  },
  openSlots: [],
  occupiedBounds: { x: 0, y: 0, width: 0, height: 0 },
  playableBounds: { x: 0, y: 0, width: 0, height: 0 },
  fitScale: 1,
  camera,
  bendPlan,
  score: {
    clarityViolation: 0,
    fitScale: 1,
    proximityPenalty: 0,
    compactness: 0,
    bendCount: 0,
    rightTurnCount: 0,
    leftTurnCount: 0,
  },
  problem: {
    viewport: { width: 402, height: 560 },
    tileSize: {
      shortSide: domino.width,
      longSide: domino.height,
    },
    rootKind: "spinner",
    rootTileId,
    openEnds: [],
    arms: [],
  },
});

describe("animation-plan", () => {
  it("detects a board rotation around the spinner", () => {
    const root = createTile("root", 6, 6);
    const right1 = createTile("right1", 6, 4);
    const left1 = createTile("left1", 6, 5);

    const previousBoard = createBoard(
      root.id,
      [{ side: "left", pip: 6, tileId: root.id }],
      [
        {
          tile: root,
          playedBy: player,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
        {
          tile: right1,
          playedBy: player,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 4,
        },
      ],
    );
    const nextBoard = createBoard(
      root.id,
      [{ side: "left", pip: 5, tileId: left1.id }],
      [
        {
          tile: root,
          playedBy: player,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
        {
          tile: right1,
          playedBy: player,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 4,
        },
        {
          tile: left1,
          playedBy: player,
          placedAtSeq: 3,
          side: "left",
          openPipFacingOutward: 5,
        },
      ],
    );
    const previousLayout = createSolution(
      root.id,
      [
        createPlacedTile(root, { x: 0, y: 0 }, 0, 1, "left", "up"),
        createPlacedTile(right1, { x: 84, y: 0 }, 270, 2, "right", "right"),
      ],
      [createAnchor("root-left", root.id, { x: -28, y: 0 }, "left", 6)],
      {
        left: [],
        right: [1],
        up: [],
        down: [],
      },
    );
    const nextLayout = createSolution(
      root.id,
      [
        createPlacedTile(root, { x: 0, y: 0 }, 90, 1, "left", "right"),
        createPlacedTile(right1, { x: 0, y: 84 }, 0, 2, "right", "down"),
        createPlacedTile(left1, { x: 0, y: -84 }, 180, 3, "left", "up"),
      ],
      [],
      {
        left: [1],
        right: [1],
        up: [],
        down: [],
      },
    );

    const plan = buildBoardLayoutTransitionPlan({
      previousBoard,
      previousLayout,
      nextBoard,
      nextLayout,
    });

    expect(plan).not.toBeNull();
    expect(
      plan?.tilePlans.find((tilePlan) => tilePlan.tileId === right1.id)
        ?.boardRotation,
    ).toEqual({
      pivot: { x: 0, y: 0 },
      angleDeg: 90,
    });
  });

  it("detects a new bend and hinges the new suffix around it", () => {
    const root = createTile("root", 6, 6);
    const right1 = createTile("right1", 6, 5);
    const right2 = createTile("right2", 5, 4);
    const right3 = createTile("right3", 4, 3);

    const previousBoard = createBoard(
      root.id,
      [{ side: "right", pip: 4, tileId: right2.id }],
      [
        {
          tile: root,
          playedBy: player,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
        {
          tile: right1,
          playedBy: player,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 5,
        },
        {
          tile: right2,
          playedBy: player,
          placedAtSeq: 3,
          side: "right",
          openPipFacingOutward: 4,
        },
      ],
    );
    const nextBoard = createBoard(
      root.id,
      [{ side: "right", pip: 3, tileId: right3.id }],
      [
        ...previousBoard.tiles,
        {
          tile: right3,
          playedBy: player,
          placedAtSeq: 4,
          side: "right",
          openPipFacingOutward: 3,
        },
      ],
    );
    const previousLayout = createSolution(
      root.id,
      [
        createPlacedTile(root, { x: 0, y: 0 }, 0, 1, "left", "up"),
        createPlacedTile(right1, { x: 84, y: 0 }, 270, 2, "right", "right"),
        createPlacedTile(right2, { x: 196, y: 0 }, 270, 3, "right", "right"),
      ],
      [createAnchor("right-open", right2.id, { x: 252, y: 0 }, "right", 4)],
      {
        left: [],
        right: [2],
        up: [],
        down: [],
      },
    );
    const nextLayout = createSolution(
      root.id,
      [
        createPlacedTile(root, { x: 0, y: 0 }, 0, 1, "left", "up"),
        createPlacedTile(right1, { x: 84, y: 0 }, 270, 2, "right", "right"),
        createPlacedTile(right2, { x: 196, y: 0 }, 270, 3, "right", "right"),
        createPlacedTile(right3, { x: 224, y: 84 }, 0, 4, "right", "down"),
      ],
      [],
      {
        left: [],
        right: [2, 1],
        up: [],
        down: [],
      },
    );

    const plan = buildBoardLayoutTransitionPlan({
      previousBoard,
      previousLayout,
      nextBoard,
      nextLayout,
    });
    const newTilePlan = plan?.tilePlans.find(
      (tilePlan) => tilePlan.tileId === right3.id,
    );

    expect(newTilePlan?.boardRotation).toBeNull();
    expect(newTilePlan?.bendRotation?.angleDeg).toBe(90);
    expect(newTilePlan?.opacityFrom).toBe(1);
  });

  it("attaches both a board rotation and a bend when they happen together", () => {
    const root = createTile("root", 6, 6);
    const right1 = createTile("right1", 6, 5);
    const right2 = createTile("right2", 5, 4);
    const right3 = createTile("right3", 4, 3);

    const previousBoard = createBoard(
      root.id,
      [{ side: "right", pip: 4, tileId: right2.id }],
      [
        {
          tile: root,
          playedBy: player,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
        {
          tile: right1,
          playedBy: player,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 5,
        },
        {
          tile: right2,
          playedBy: player,
          placedAtSeq: 3,
          side: "right",
          openPipFacingOutward: 4,
        },
      ],
    );
    const nextBoard = createBoard(
      root.id,
      [{ side: "right", pip: 3, tileId: right3.id }],
      [
        ...previousBoard.tiles,
        {
          tile: right3,
          playedBy: player,
          placedAtSeq: 4,
          side: "right",
          openPipFacingOutward: 3,
        },
      ],
    );
    const previousLayout = createSolution(
      root.id,
      [
        createPlacedTile(root, { x: 0, y: 0 }, 0, 1, "left", "up"),
        createPlacedTile(right1, { x: 84, y: 0 }, 270, 2, "right", "right"),
        createPlacedTile(right2, { x: 196, y: 0 }, 270, 3, "right", "right"),
      ],
      [createAnchor("right-open", right2.id, { x: 252, y: 0 }, "right", 4)],
      {
        left: [],
        right: [2],
        up: [],
        down: [],
      },
    );
    const nextLayout = createSolution(
      root.id,
      [
        createPlacedTile(root, { x: 0, y: 0 }, 90, 1, "left", "right"),
        createPlacedTile(right1, { x: 0, y: 84 }, 0, 2, "right", "down"),
        createPlacedTile(right2, { x: 0, y: 196 }, 0, 3, "right", "down"),
        createPlacedTile(right3, { x: -84, y: 224 }, 90, 4, "right", "left"),
      ],
      [],
      {
        left: [],
        right: [2, 1],
        up: [],
        down: [],
      },
    );

    const plan = buildBoardLayoutTransitionPlan({
      previousBoard,
      previousLayout,
      nextBoard,
      nextLayout,
    });
    const newTilePlan = plan?.tilePlans.find(
      (tilePlan) => tilePlan.tileId === right3.id,
    );

    expect(newTilePlan?.boardRotation).toEqual({
      pivot: { x: 0, y: 0 },
      angleDeg: 90,
    });
    expect(newTilePlan?.bendRotation?.angleDeg).toBe(90);
  });

  it("skips the transition plan when a spinner is introduced after a non-double opening", () => {
    const openingTile = createTile("opening", 2, 3);
    const spinnerTile = createTile("spinner", 2, 2);

    const previousBoard = createBoard(
      null,
      [
        { side: "left", pip: 3, tileId: openingTile.id },
        { side: "right", pip: 2, tileId: openingTile.id },
      ],
      [
        {
          tile: openingTile,
          playedBy: player,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 3,
        },
      ],
    );
    const nextBoard = createBoard(
      spinnerTile.id,
      [
        { side: "left", pip: 3, tileId: openingTile.id },
        { side: "right", pip: 2, tileId: spinnerTile.id },
        { side: "up", pip: 2, tileId: spinnerTile.id },
        { side: "down", pip: 2, tileId: spinnerTile.id },
      ],
      [
        previousBoard.tiles[0],
        {
          tile: spinnerTile,
          playedBy: player,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 2,
        },
      ],
    );
    const previousLayout = createSolution(
      openingTile.id,
      [createPlacedTile(openingTile, { x: 0, y: 0 }, 90, 1, "left", "right")],
      [createAnchor("opening-right", openingTile.id, { x: 56, y: 0 }, "right", 2)],
      {
        left: [],
        right: [],
        up: [],
        down: [],
      },
    );
    const nextLayout = createSolution(
      spinnerTile.id,
      [
        createPlacedTile(openingTile, { x: -84, y: 0 }, 90, 1, "left", "right"),
        createPlacedTile(spinnerTile, { x: 0, y: 0 }, 0, 2, "right", "up"),
      ],
      [],
      {
        left: [1],
        right: [],
        up: [],
        down: [],
      },
    );

    expect(
      buildBoardLayoutTransitionPlan({
        previousBoard,
        previousLayout,
        nextBoard,
        nextLayout,
      }),
    ).toBeNull();
  });
});
