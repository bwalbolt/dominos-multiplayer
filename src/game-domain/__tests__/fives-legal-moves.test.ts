import {
  reconstructGameState,
  validateFivesMove,
  type GameState,
} from "../index";
import {
  FIXTURE_IDS,
  FIXTURE_TILE_CATALOG_BY_ID,
  getFixtureTileId,
} from "./fixtures/builders";
import { OPENING_EVENT_LOG, SPINNER_EXPANSION_EVENT_LOG } from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

describe("Fives legality fixtures", () => {
  it("requires the highest double on the opening turn", () => {
    const state = reconstructGameState(OPENING_EVENT_LOG.slice(0, 2));
    const game = requireGame(state.game);
    const openingHand = game.currentRound?.handsByPlayerId[FIXTURE_IDS.playerOneId];

    expect(openingHand).toBeDefined();

    const result = validateFivesMove({
      board: game.currentRound?.board ?? {
        layoutDirection: "horizontal",
        spinnerTileId: null,
        openEnds: [],
        tiles: [],
      },
      handTileIds: openingHand?.tileIds ?? [],
      tileCatalog: FIXTURE_TILE_CATALOG_BY_ID,
      intent: {
        tileId: getFixtureTileId(2, 5),
        side: "left",
        openPipFacingOutward: 5,
      },
      requiresOpeningDouble: true,
    });

    expect(result.legalMoveEvaluation.requiredOpeningTileId).toBe(
      getFixtureTileId(6, 6),
    );
    expect(result.validation).toEqual({
      ok: false,
      code: "opening_double_required",
      message: "Opening move must play the highest double in hand.",
    });
  });

  it("enumerates only unlocked spinner branches and rejects illegal orientations", () => {
    const state = reconstructGameState(SPINNER_EXPANSION_EVENT_LOG.slice(0, 5));
    const game = requireGame(state.game);
    const activePlayerId = game.turn?.activePlayerId;

    expect(activePlayerId).toBe(FIXTURE_IDS.playerTwoId);

    const activeHand =
      activePlayerId === null || activePlayerId === undefined
        ? undefined
        : game.currentRound?.handsByPlayerId[activePlayerId];

    expect(activeHand?.tileIds).toEqual([
      getFixtureTileId(3, 6),
      getFixtureTileId(5, 6),
      getFixtureTileId(0, 5),
      getFixtureTileId(1, 4),
      getFixtureTileId(2, 5),
      getFixtureTileId(4, 5),
    ]);

    const success = validateFivesMove({
      board: game.currentRound?.board ?? {
        layoutDirection: "horizontal",
        spinnerTileId: null,
        openEnds: [],
        tiles: [],
      },
      handTileIds: activeHand?.tileIds ?? [],
      tileCatalog: FIXTURE_TILE_CATALOG_BY_ID,
      intent: {
        tileId: getFixtureTileId(3, 6),
        side: "up",
        openPipFacingOutward: 3,
      },
      requiresOpeningDouble: false,
    });

    expect(success.legalMoveEvaluation.spinnerBranches).toEqual({
      left: "open",
      right: "open",
      up: "open",
      down: "open",
    });
    expect(success.legalMoveEvaluation.moves).toEqual([
      {
        tileId: getFixtureTileId(3, 6),
        side: "up",
        inwardTileSide: "sideB",
        openPipFacingOutward: 3,
      },
      {
        tileId: getFixtureTileId(3, 6),
        side: "down",
        inwardTileSide: "sideB",
        openPipFacingOutward: 3,
      },
      {
        tileId: getFixtureTileId(5, 6),
        side: "up",
        inwardTileSide: "sideB",
        openPipFacingOutward: 5,
      },
      {
        tileId: getFixtureTileId(5, 6),
        side: "down",
        inwardTileSide: "sideB",
        openPipFacingOutward: 5,
      },
      {
        tileId: getFixtureTileId(1, 4),
        side: "right",
        inwardTileSide: "sideA",
        openPipFacingOutward: 4,
      },
      {
        tileId: getFixtureTileId(2, 5),
        side: "left",
        inwardTileSide: "sideA",
        openPipFacingOutward: 5,
      },
    ]);
    expect(success.validation).toEqual({
      ok: true,
      value: {
        tileId: getFixtureTileId(3, 6),
        side: "up",
        inwardTileSide: "sideB",
        openPipFacingOutward: 3,
      },
    });

    const wrongOrientation = validateFivesMove({
      board: game.currentRound?.board ?? {
        layoutDirection: "horizontal",
        spinnerTileId: null,
        openEnds: [],
        tiles: [],
      },
      handTileIds: activeHand?.tileIds ?? [],
      tileCatalog: FIXTURE_TILE_CATALOG_BY_ID,
      intent: {
        tileId: getFixtureTileId(3, 6),
        side: "up",
        openPipFacingOutward: 6,
      },
      requiresOpeningDouble: false,
    });

    expect(wrongOrientation.validation).toEqual({
      ok: false,
      code: "illegal_orientation",
      message: "Tile orientation does not satisfy the open-end pip constraint.",
    });
  });

  it("allows a later round to open with a non-double on an empty board", () => {
    const result = validateFivesMove({
      board: {
        layoutDirection: "horizontal",
        spinnerTileId: null,
        openEnds: [],
        tiles: [],
      },
      handTileIds: [getFixtureTileId(2, 5)],
      tileCatalog: FIXTURE_TILE_CATALOG_BY_ID,
      intent: {
        tileId: getFixtureTileId(2, 5),
        side: "left",
        openPipFacingOutward: 5,
      },
      requiresOpeningDouble: false,
    });

    expect(result.legalMoveEvaluation.requiredOpeningTileId).toBeNull();
    expect(result.validation).toEqual({
      ok: true,
      value: {
        tileId: getFixtureTileId(2, 5),
        side: "left",
        inwardTileSide: "sideB",
        openPipFacingOutward: 5,
      },
    });
  });
});
