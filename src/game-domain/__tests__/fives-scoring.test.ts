import {
  calculateFivesBoardScore,
  evaluateRoundResolution,
  reconstructGameState,
  type GameState,
} from "../index";
import { FIXTURE_IDS, FIXTURE_TILE_CATALOG_BY_ID } from "./fixtures/builders";
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

  it("scores zero once both spinner arms unlock but before up/down tiles are played", () => {
    const state = reconstructGameState(SPINNER_EXPANSION_EVENT_LOG.slice(0, 5));
    const board = requireGame(state.game).currentRound?.board;

    expect(board).toBeDefined();
    expect(board?.openEnds).toEqual([
      { side: "left", pip: 2, tileId: "tile-2-6" },
      { side: "right", pip: 1, tileId: "tile-1-6" },
      { side: "up", pip: 6, tileId: "tile-6-6" },
      { side: "down", pip: 6, tileId: "tile-6-6" },
    ]);
    // Spinner (6-6) has 2 branches, so it counts as 0. 
    // Ends are left: 2 and right: 1. Total = 3.
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
