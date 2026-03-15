import {
  calculateFivesBoardScore,
  evaluateRoundResolution,
  reconstructGameState,
  type GameState,
} from "../index";
import {
  buildFixtureEventLog,
  createGameStartedStep,
  createHandsByPlayerId,
  createRoundStartedStep,
  createTilePlayedStep,
  FIXTURE_IDS,
  FIXTURE_TILE_CATALOG_BY_ID,
  getFixtureTileId,
} from "./fixtures/builders";
import {
  BLOCKED_ROUND_EVENT_LOG,
  OPENING_EVENT_LOG,
  SPINNER_EXPANSION_EVENT_LOG,
} from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

describe("Fives scoring fixtures", () => {
  it("scores zero for a 6-6 opening because the visible ends sum to 12", () => {
    const state = reconstructGameState(OPENING_EVENT_LOG);
    const board = requireGame(state.game).currentRound?.board;

    expect(board).toBeDefined();
    expect(calculateFivesBoardScore(board!)).toBe(0);
  });

  it("scores zero once both spinner arms unlock because the untouched spinner tile stops counting", () => {
    const state = reconstructGameState(SPINNER_EXPANSION_EVENT_LOG.slice(0, 5));
    const board = requireGame(state.game).currentRound?.board;

    expect(board).toBeDefined();
    expect(board?.openEnds).toEqual([
      { side: "left", pip: 2, tileId: "tile-2-6" },
      { side: "right", pip: 1, tileId: "tile-1-6" },
      { side: "up", pip: 6, tileId: "tile-6-6" },
      { side: "down", pip: 6, tileId: "tile-6-6" },
    ]);
    // Once the spinner is connected on its left and right sides, the untouched
    // spinner itself no longer contributes to the count.
    expect(calculateFivesBoardScore(board!)).toBe(0);
  });

  it("replays a later-round spinner introduction without counting untouched up/down spinner faces", () => {
    const tile16 = getFixtureTileId(1, 6);
    const tile66 = getFixtureTileId(6, 6);
    const tile26 = getFixtureTileId(2, 6);
    const tile02 = getFixtureTileId(0, 2);
    const tile04 = getFixtureTileId(0, 4);
    const tile24 = getFixtureTileId(2, 4);

    const eventLog = buildFixtureEventLog([
      createGameStartedStep(),
      createRoundStartedStep({
        roundNumber: 2,
        handsByPlayerId: createHandsByPlayerId(
          [tile16, tile26, tile04],
          [tile66, tile02, tile24],
        ),
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
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerTwoId,
        tileId: tile02,
        side: "right",
        openPipFacingOutward: 0,
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerOneId,
        tileId: tile04,
        side: "right",
        openPipFacingOutward: 4,
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerTwoId,
        tileId: tile24,
        side: "right",
        openPipFacingOutward: 2,
      }),
    ]);

    const state = reconstructGameState(eventLog);
    const board = requireGame(state.game).currentRound?.board;

    expect(board?.openEnds).toEqual([
      { side: "left", pip: 1, tileId: tile16 },
      { side: "right", pip: 2, tileId: tile24 },
      { side: "up", pip: 6, tileId: tile66 },
      { side: "down", pip: 6, tileId: tile66 },
    ]);
    expect(calculateFivesBoardScore(board!)).toBe(0);
  });

  it("resolves the blocked-round fixture deterministically before authoritative event sync", () => {
    const state = reconstructGameState(BLOCKED_ROUND_EVENT_LOG.slice(0, 6));
    const round = requireGame(state.game).currentRound;

    expect(round).not.toBeNull();
    expect(evaluateRoundResolution(round!, FIXTURE_TILE_CATALOG_BY_ID)).toEqual({
      winnerPlayerId: FIXTURE_IDS.playerOneId,
      reason: "blocked",
      scoreAwarded: 0,
    });
  });

  it("preserves the authoritative blocked-round score from the appended round-ended event", () => {
    const state = reconstructGameState(BLOCKED_ROUND_EVENT_LOG);
    const game = requireGame(state.game);

    expect(game.currentRound?.result).toEqual({
      winnerPlayerId: FIXTURE_IDS.playerOneId,
      reason: "blocked",
      scoreAwarded: 0,
    });
    expect(game.playerStateById[FIXTURE_IDS.playerOneId].score).toBe(0);
  });
});
