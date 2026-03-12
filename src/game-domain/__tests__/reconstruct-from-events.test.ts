import {
  reconstructGameState,
  type GameState,
  type RoundEndedEvent,
} from "../index";
import { FIXTURE_IDS, getFixtureTileId } from "./fixtures/builders";
import {
  BLOCKED_ROUND_EVENT_LOG,
  EXPIRATION_FORFEIT_EVENT_LOG,
  OPENING_EVENT_LOG,
} from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

describe("Reconstruction from fixture event logs", () => {
  it("replays the opening log into the expected active round state", () => {
    const state = reconstructGameState(OPENING_EVENT_LOG);
    const game = requireGame(state.game);

    expect(state.eventCount).toBe(OPENING_EVENT_LOG.length);
    expect(game.status).toBe("active");
    expect(game.turn).toEqual({
      activePlayerId: FIXTURE_IDS.playerTwoId,
      turnNumber: 2,
      consecutivePasses: 0,
      lastActionAt: "2026-01-01T00:02:00.000Z",
    });
    expect(game.currentRound?.board.spinnerTileId).toBe(getFixtureTileId(6, 6));
    expect(game.currentRound?.board.openEnds).toEqual([
      { side: "left", pip: 6, tileId: getFixtureTileId(6, 6) },
      { side: "right", pip: 6, tileId: getFixtureTileId(6, 6) },
      { side: "up", pip: 6, tileId: getFixtureTileId(6, 6) },
      { side: "down", pip: 6, tileId: getFixtureTileId(6, 6) },
    ]);
    expect(game.playerStateById[FIXTURE_IDS.playerOneId].hand.handCount).toBe(6);
    expect(game.playerStateById[FIXTURE_IDS.playerTwoId].hand.hasPlayableTile).toBe(
      true,
    );
    expect(state.tileInstances[getFixtureTileId(5, 6)].isPlayable).toBe(true);
    expect(state.tileInstances[getFixtureTileId(1, 6)].isPlayable).toBe(true);
  });

  it("replays the blocked-round log into a completed round with authoritative scores", () => {
    const state = reconstructGameState(BLOCKED_ROUND_EVENT_LOG);
    const game = requireGame(state.game);

    expect(state.eventCount).toBe(BLOCKED_ROUND_EVENT_LOG.length);
    expect(game.status).toBe("active");
    expect(game.turn).toBeNull();
    expect(game.currentRound?.status).toBe("blocked");
    expect(game.currentRound?.result).toEqual({
      winnerPlayerId: FIXTURE_IDS.playerOneId,
      reason: "blocked",
      scoreAwarded: 0,
    });
    expect(game.playerStateById[FIXTURE_IDS.playerOneId].score).toBe(0);
    expect(game.playerStateById[FIXTURE_IDS.playerTwoId].score).toBe(5);
  });

  it("replays the expiration-forfeit log into a forfeited game state", () => {
    const state = reconstructGameState(EXPIRATION_FORFEIT_EVENT_LOG);
    const game = requireGame(state.game);

    expect(state.eventCount).toBe(EXPIRATION_FORFEIT_EVENT_LOG.length);
    expect(game.status).toBe("forfeited");
    expect(game.winnerPlayerId).toBe(FIXTURE_IDS.playerOneId);
    expect(game.turn).toBeNull();
    expect(game.currentRound?.status).toBe("completed");
    expect(game.currentRound?.result).toEqual({
      winnerPlayerId: FIXTURE_IDS.playerOneId,
      reason: "forfeit",
      scoreAwarded: 0,
    });
    expect(game.currentRound?.endedAt).toBe("2026-01-04T00:03:00.000Z");
    expect(game.metadata.lastEventAt).toBe("2026-01-04T00:03:00.000Z");
  });

  it("rejects a round-ended event that contradicts deterministic blocked scoring", () => {
    const originalEndedEvent = BLOCKED_ROUND_EVENT_LOG[6] as RoundEndedEvent;
    const invalidBlockedLog = [
      ...BLOCKED_ROUND_EVENT_LOG.slice(0, 6),
      {
        ...originalEndedEvent,
        scoreAwarded: 5,
        scoreByPlayerId: {
          ...originalEndedEvent.scoreByPlayerId,
          [FIXTURE_IDS.playerOneId]: 5,
        },
      } as RoundEndedEvent,
    ];

    expect(() => reconstructGameState(invalidBlockedLog)).toThrow(
      "ROUND_ENDED does not match the deterministic round resolution.",
    );
  });
});
