import type { SnapResolution } from "../../layout/types";
import type {
  BoardState,
  GameId,
  MoveIntentIdempotencyKey,
  PlayerId,
  RoundId,
  Tile,
  TileId,
} from "../../types";
import { resolveMoveIntent } from "../resolve-intent";

describe("resolve-intent", () => {
  const gameId = "game-001" as GameId;
  const roundId = "round-001" as RoundId;
  const playerId = "player-001" as PlayerId;
  const idempotencyKey = "intent-001" as MoveIntentIdempotencyKey;

  const tileCatalog: Record<TileId, Tile> = {
    ["tile-6-6" as TileId]: { id: "tile-6-6" as TileId, sideA: 6, sideB: 6 },
    ["tile-6-5" as TileId]: { id: "tile-6-5" as TileId, sideA: 6, sideB: 5 },
    ["tile-5-4" as TileId]: { id: "tile-5-4" as TileId, sideA: 5, sideB: 4 },
    ["tile-3-2" as TileId]: { id: "tile-3-2" as TileId, sideA: 3, sideB: 2 },
  };

  const emptyBoard: BoardState = {
    layoutDirection: "horizontal",
    spinnerTileId: null,
    openEnds: [],
    tiles: [],
  };

  const boardWithOpenSixes: BoardState = {
    layoutDirection: "horizontal",
    spinnerTileId: "tile-6-6" as TileId,
    openEnds: [
      { side: "left", pip: 6, tileId: "tile-6-6" as TileId },
      { side: "right", pip: 6, tileId: "tile-6-6" as TileId },
    ],
    tiles: [
      {
        tile: tileCatalog["tile-6-6" as TileId],
        playedBy: playerId,
        placedAtSeq: 1,
        side: "left",
        openPipFacingOutward: 6,
      },
    ],
  };

  const createSnapResolution = (
    override: Partial<SnapResolution> = {},
  ): SnapResolution => ({
    anchor: null,
    distance: Infinity,
    highlightTileId: null,
    ...override,
  });

  it("returns the dragged tile to hand when no legal snap target resolves", () => {
    const result = resolveMoveIntent({
      gameId,
      roundId,
      playerId,
      requiresOpeningDouble: false,
      expectedEventSeq: 3,
      idempotencyKey,
      board: boardWithOpenSixes,
      handTileIds: ["tile-6-5" as TileId],
      tileCatalog,
      draggedTileId: "tile-6-5" as TileId,
      snapResolution: createSnapResolution(),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        action: "return_to_hand",
        code: "no_snap_target",
      }),
    );
  });

  it("builds a validated move intent for a snapped legal move", () => {
    const result = resolveMoveIntent({
      gameId,
      roundId,
      playerId,
      requiresOpeningDouble: false,
      expectedEventSeq: 3,
      idempotencyKey,
      board: boardWithOpenSixes,
      handTileIds: ["tile-6-5" as TileId],
      tileCatalog,
      draggedTileId: "tile-6-5" as TileId,
      snapResolution: createSnapResolution({
        anchor: {
          id: "tile-6-6-right",
          ownerTileId: "tile-6-6" as TileId,
          attachmentPoint: { x: 28, y: 0 },
          direction: "right",
          openPip: 6,
        },
        distance: 4,
        highlightTileId: "tile-6-6" as TileId,
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        action: "submit",
        intent: expect.objectContaining({
          kind: "play_tile",
          tileId: "tile-6-5",
          side: "right",
          openPipFacingOutward: 5,
          anchorId: "tile-6-6-right",
        }),
        legalMove: expect.objectContaining({
          tileId: "tile-6-5",
          side: "right",
          openPipFacingOutward: 5,
        }),
      }),
    );
  });

  it("returns the tile to hand when the snapped anchor does not match the dragged tile", () => {
    const result = resolveMoveIntent({
      gameId,
      roundId,
      playerId,
      requiresOpeningDouble: false,
      expectedEventSeq: 3,
      idempotencyKey,
      board: boardWithOpenSixes,
      handTileIds: ["tile-5-4" as TileId],
      tileCatalog,
      draggedTileId: "tile-5-4" as TileId,
      snapResolution: createSnapResolution({
        anchor: {
          id: "tile-6-6-left",
          ownerTileId: "tile-6-6" as TileId,
          attachmentPoint: { x: -28, y: 0 },
          direction: "left",
          openPip: 6,
        },
        distance: 6,
        highlightTileId: "tile-6-6" as TileId,
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        action: "return_to_hand",
        code: "illegal_orientation",
      }),
    );
  });

  it("creates an opening move intent from the initial anchor without persisting anchor geometry", () => {
    const result = resolveMoveIntent({
      gameId,
      roundId,
      playerId,
      requiresOpeningDouble: true,
      expectedEventSeq: 1,
      idempotencyKey,
      board: emptyBoard,
      handTileIds: ["tile-6-6" as TileId, "tile-6-5" as TileId],
      tileCatalog,
      draggedTileId: "tile-6-6" as TileId,
      snapResolution: createSnapResolution({
        anchor: {
          id: "initial",
          ownerTileId: null,
          attachmentPoint: { x: 0, y: 0 },
          direction: "right",
          openPip: 0,
        },
        distance: 0,
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        action: "submit",
        intent: expect.objectContaining({
          tileId: "tile-6-6",
          side: "left",
          openPipFacingOutward: 6,
          anchorId: null,
        }),
      }),
    );
  });

  it("rejects opening drops that do not use the required highest double", () => {
    const result = resolveMoveIntent({
      gameId,
      roundId,
      playerId,
      requiresOpeningDouble: true,
      expectedEventSeq: 1,
      idempotencyKey,
      board: emptyBoard,
      handTileIds: ["tile-6-6" as TileId, "tile-6-5" as TileId],
      tileCatalog,
      draggedTileId: "tile-6-5" as TileId,
      snapResolution: createSnapResolution({
        anchor: {
          id: "initial",
          ownerTileId: null,
          attachmentPoint: { x: 0, y: 0 },
          direction: "right",
          openPip: 0,
        },
        distance: 0,
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        action: "return_to_hand",
        code: "opening_double_required",
      }),
    );
  });

  it("creates a later-round opening intent for a non-double on an empty board", () => {
    const result = resolveMoveIntent({
      gameId,
      roundId,
      playerId,
      requiresOpeningDouble: false,
      expectedEventSeq: 1,
      idempotencyKey,
      board: emptyBoard,
      handTileIds: ["tile-6-5" as TileId],
      tileCatalog,
      draggedTileId: "tile-6-5" as TileId,
      snapResolution: createSnapResolution({
        anchor: {
          id: "initial",
          ownerTileId: null,
          attachmentPoint: { x: 0, y: 0 },
          direction: "right",
          openPip: 0,
        },
        distance: 0,
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        action: "submit",
        intent: expect.objectContaining({
          tileId: "tile-6-5",
          side: "left",
          openPipFacingOutward: 6,
          anchorId: null,
        }),
      }),
    );
  });
});
