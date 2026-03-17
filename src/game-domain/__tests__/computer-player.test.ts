import { getComputerAction } from "../computer-player";
import type {
  BoardState,
  PlayerId,
  ReconstructionState,
  Tile,
  TileId,
} from "../types";

describe("Computer Player", () => {
  const p1 = "p1" as PlayerId;
  const computer = "computer" as PlayerId;

  // Use a comprehensive catalog to avoid state issues between tests
  const tileCatalog: Record<TileId, Tile> = {
    ["tile-6-6" as TileId]: { id: "tile-6-6" as TileId, sideA: 6, sideB: 6 },
    ["tile-5-5" as TileId]: { id: "tile-5-5" as TileId, sideA: 5, sideB: 5 },
    ["tile-6-5" as TileId]: { id: "tile-6-5" as TileId, sideA: 6, sideB: 5 },
    ["tile-6-4" as TileId]: { id: "tile-6-4" as TileId, sideA: 6, sideB: 4 },
    ["tile-6-3" as TileId]: { id: "tile-6-3" as TileId, sideA: 6, sideB: 3 },
    ["tile-6-1" as TileId]: { id: "tile-6-1" as TileId, sideA: 6, sideB: 1 },
    ["tile-5-4" as TileId]: { id: "tile-5-4" as TileId, sideA: 5, sideB: 4 },
    ["tile-5-0" as TileId]: { id: "tile-5-0" as TileId, sideA: 5, sideB: 0 },
    ["tile-4-4" as TileId]: { id: "tile-4-4" as TileId, sideA: 4, sideB: 4 },
    ["tile-1-1" as TileId]: { id: "tile-1-1" as TileId, sideA: 1, sideB: 1 },
    ["tile-0-0" as TileId]: { id: "tile-0-0" as TileId, sideA: 0, sideB: 0 },
    ["tile-1-0" as TileId]: { id: "tile-1-0" as TileId, sideA: 1, sideB: 0 },
  };

  const createMockReconstruction = (
    board: BoardState,
    handTileIds: TileId[],
    boneyardRemaining: number = 0,
    roundNumber: number = 1,
  ): ReconstructionState => ({
    game: {
      gameId: "test-game" as any,
      status: "active",
      metadata: { variant: "fives" } as any,
      players: [] as any,
      playerStateById: {
        [computer]: {
          hand: {
            tileIds: handTileIds,
            hasPlayableTile: true,
          },
        },
      } as any,
      currentRound: {
        roundNumber,
        status: "active",
        board,
        boneyard: { remainingCount: boneyardRemaining },
        handsByPlayerId: {
          [computer]: {
            tileIds: handTileIds,
          },
        },
      } as any,
      turn: { activePlayerId: computer },
    } as any,
    tileCatalog,
    tileInstances: {} as any,
    eventCount: 0,
  });

  const emptyBoard: BoardState = {
    layoutDirection: "horizontal",
    spinnerTileId: null,
    openEnds: [],
    tiles: [],
  };

  test("Opening move: should pick the required opening double", () => {
    const hand = ["tile-6-5", "tile-5-5", "tile-1-1"] as TileId[];
    const recon = createMockReconstruction(emptyBoard, hand);
    const action = getComputerAction(recon, computer);

    expect(action).toEqual({
      kind: "play",
      move: expect.objectContaining({
        tileId: "tile-5-5",
      }),
    });
  });

  test("Later-round opening: should allow a non-double on an empty board", () => {
    const hand = ["tile-6-5"] as TileId[];
    const recon = createMockReconstruction(emptyBoard, hand, 0, 2);
    const action = getComputerAction(recon, computer);

    expect(action).toEqual({
      kind: "play",
      move: expect.objectContaining({
        tileId: "tile-6-5",
        side: "left",
        inwardTileSide: "sideA",
        openPipFacingOutward: 5,
      }),
    });
  });

  test("Scoring preference: should choose a move that scores (multiple of 5)", () => {
    // Board has [6-6] as spinner. Open ends: left: 6, right: 6.
    // Score helper counts it as 6+6=12.
    // Hand has [6-3] -> play on left -> ends are right: 6 (spinner), left: 3 (new).
    // Total = 12 (spinner) + 3 (new) = 15. SCORES 15.
    // Hand has [6-5] -> play on left -> ends are right: 6 (spinner), left: 5 (new).
    // Total = 12 (spinner) + 5 (new) = 17. No score.
    const board: BoardState = {
      ...emptyBoard,
      spinnerTileId: "tile-6-6" as TileId,
      openEnds: [
        { side: "left", pip: 6, tileId: "tile-6-6" as TileId },
        { side: "right", pip: 6, tileId: "tile-6-6" as TileId },
      ],
      tiles: [
        {
          tile: tileCatalog["tile-6-6" as TileId],
          playedBy: p1,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
      ],
    };

    const hand = ["tile-6-3", "tile-6-5"] as TileId[];
    const recon = createMockReconstruction(board, hand);
    const action = getComputerAction(recon, computer);

    expect(action).toEqual({
      kind: "play",
      move: expect.objectContaining({
        tileId: "tile-6-3",
      }),
    });
  });

  test("Highest score: should choose the highest scoring move", () => {
    // Simple one:
    // Ends: 5 (left), 5 (right). Total 10.
    // Hand: [5-5] scores 15 (5 + 10). [5-0] scores 5 (5 + 0).
    // Let's just use a very simple manual sum.
    // board.openEnds = [{pip: 5, ...}, {pip: 5, ...}]
    // calculateFivesBoardScore will sum them.
    // If the tiles are not doubles, it just sums the pips.
    const manualBoard: BoardState = {
      ...emptyBoard,
      openEnds: [
        { side: "left", pip: 5, tileId: "tile-5-4" as TileId },
        { side: "right", pip: 5, tileId: "tile-6-5" as TileId },
      ],
      tiles: [
        {
          tile: tileCatalog["tile-5-4" as TileId],
          playedBy: p1,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 5,
        },
        {
          tile: tileCatalog["tile-6-5" as TileId],
          playedBy: p1,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 5,
        },
      ],
    };
    // Total = 5 + 5 = 10.
    // Play [5-5] on left -> ends are left: 10, right: 5. Total 15.
    // Play [5-0] on left -> ends are left: 0, right: 5. Total 5.
    // Both score, but 15 > 5.

    const hand2 = ["tile-5-5", "tile-5-0"] as TileId[];
    const recon = createMockReconstruction(manualBoard, hand2);
    const action = getComputerAction(recon, computer);

    expect(action).toEqual({
      kind: "play",
      move: expect.objectContaining({
        tileId: "tile-5-5",
      }),
    });
  });

  test("Lowest pip fallback: should choose the move with lowest pip total if no move scores", () => {
    // Board ends: 6 and 6. Total 12.
    const board: BoardState = {
      ...emptyBoard,
      openEnds: [
        { side: "left", pip: 6, tileId: "tile-5-6" as any },
        { side: "right", pip: 6, tileId: "tile-4-6" as any },
      ],
      tiles: [
        {
          tile: { id: "tile-5-6", sideA: 5, sideB: 6 } as any,
          playedBy: p1,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
        {
          tile: { id: "tile-4-6", sideA: 4, sideB: 6 } as any,
          playedBy: p1,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 6,
        },
      ],
    };
    // Hand: [6-5] (total 11), [6-1] (total 7)
    // Plays: [6-5] on left -> ends are 5 and 6. Total 11. No score.
    // Plays: [6-1] on left -> ends are 1 and 6. Total 7. No score.
    // Should choose [6-1] because 7 < 11.
    const hand = ["tile-6-5", "tile-6-1"] as TileId[];
    const recon = createMockReconstruction(board, hand);
    const action = getComputerAction(recon, computer);

    expect(action).toEqual({
      kind: "play",
      move: expect.objectContaining({
        tileId: "tile-6-1",
      }),
    });
  });

  test("Draw behavior: should draw if no moves are possible and boneyard is not empty", () => {
    const board: BoardState = {
      ...emptyBoard,
      openEnds: [{ side: "left", pip: 6, tileId: "tile-6-6" as TileId }],
      tiles: [
        {
          tile: tileCatalog["tile-6-6" as TileId],
          playedBy: p1,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
      ],
    };
    const hand = ["tile-1-1"] as TileId[];
    const recon = createMockReconstruction(board, hand, 5);
    const action = getComputerAction(recon, computer);

    expect(action).toEqual({ kind: "draw" });
  });

  test("Pass behavior: should pass if no moves possible and boneyard is empty", () => {
    const board: BoardState = {
      ...emptyBoard,
      openEnds: [{ side: "left", pip: 6, tileId: "tile-6-6" as TileId }],
      tiles: [
        {
          tile: tileCatalog["tile-6-6" as TileId],
          playedBy: p1,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 6,
        },
      ],
    };
    const hand = ["tile-1-1"] as TileId[];
    const recon = createMockReconstruction(board, hand, 0);
    const action = getComputerAction(recon, computer);

    expect(action).toEqual({ kind: "pass" });
  });
});
