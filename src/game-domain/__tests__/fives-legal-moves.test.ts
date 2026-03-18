import {
  reconstructGameState,
  validateFivesMove,
  type GameState,
} from "../index";
import { calculateBoardGeometry } from "../layout/anchors";
import {
  buildFixtureEventLog,
  createGameStartedStep,
  createRoundStartedStep,
  createTilePlayedStep,
  FIXTURE_IDS,
  FIXTURE_TILE_CATALOG_BY_ID,
  getFixtureTileId,
} from "./fixtures/builders";
import {
  OPENING_EVENT_LOG,
  SPINNER_EXPANSION_EVENT_LOG,
} from "./fixtures/event-logs";

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
    const openingHand =
      game.currentRound?.handsByPlayerId[FIXTURE_IDS.playerOneId];

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
        inwardTileSide: "sideA",
        openPipFacingOutward: 5,
      },
    });
  });

  it("identifies the first double as a spinner even if it is not the first tile in the round", () => {
    const tile16 = getFixtureTileId(1, 6);
    const tile66 = getFixtureTileId(6, 6);
    const tile26 = getFixtureTileId(2, 6);

    const eventLog = buildFixtureEventLog([
      createGameStartedStep(),
      createRoundStartedStep({
        handsByPlayerId: {
          [FIXTURE_IDS.playerOneId]: [tile16, tile26],
          [FIXTURE_IDS.playerTwoId]: [tile66],
        },
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerOneId,
        tileId: tile16,
        side: "left",
        openPipFacingOutward: 1,
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerTwoId,
        tileId: tile66,
        side: "right",
        openPipFacingOutward: 6,
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerOneId,
        tileId: tile26,
        side: "right",
        openPipFacingOutward: 2,
      }),
    ]);

    const state = reconstructGameState(eventLog);
    const game = requireGame(state.game);
    const board = game.currentRound!.board;

    expect(board.spinnerTileId).toBe(tile66);

    // The untouched up/down spinner faces are tracked on the board.
    expect(board.openEnds.some((oe) => oe.side === "up")).toBe(true);
    expect(board.openEnds.some((oe) => oe.side === "down")).toBe(true);

    // Once both the left and right spinner sides are connected, up/down unlock for play.
    const geometry = calculateBoardGeometry(board);
    const openingTileGeometry = geometry.placedTiles.find((tile) => tile.tileId === tile16);
    const spinnerGeometry = geometry.placedTiles.find((tile) => tile.tileId === tile66);

    expect(openingTileGeometry?.rotationDeg).toBe(270);
    expect(openingTileGeometry?.center.x).toBeLessThan(spinnerGeometry?.center.x ?? 0);
    expect(
      (openingTileGeometry?.center.x ?? 0) + (openingTileGeometry?.width ?? 0) / 2,
    ).toBe((spinnerGeometry?.center.x ?? 0) - (spinnerGeometry?.width ?? 0) / 2);
    expect(geometry.anchors.some((a) => a.direction === "up")).toBe(true);
    expect(geometry.anchors.some((a) => a.direction === "down")).toBe(true);
  });
});
