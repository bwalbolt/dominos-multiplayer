import {
  CasualAsyncPolicy,
  CASUAL_EXPIRATION_WINDOW_MS,
  reconstructGameState,
  type GameState,
} from "../index";
import { FIXTURE_IDS } from "./fixtures/builders";
import { BLOCKED_ROUND_EVENT_LOG, OPENING_EVENT_LOG } from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

describe("Casual policy fixtures", () => {
  const policy = new CasualAsyncPolicy();

  it("computes a deterministic three-day deadline from the last action timestamp", () => {
    const game = requireGame(reconstructGameState(OPENING_EVENT_LOG).game);
    const metadata = policy.getMetadata({
      evaluatedAt: "2026-01-03T00:00:00.000Z",
      game,
    });

    expect(metadata.expirationWindowMs).toBe(CASUAL_EXPIRATION_WINDOW_MS);
    expect(metadata.deadline).toEqual({
      kind: "async_turn_expiration",
      activePlayerId: FIXTURE_IDS.playerTwoId,
      startedAt: "2026-01-01T00:02:00.000Z",
      deadlineAt: "2026-01-04T00:02:00.000Z",
    });
  });

  it("stays pending before the deadline and times out exactly at the deadline", () => {
    const game = requireGame(reconstructGameState(OPENING_EVENT_LOG).game);

    const pending = policy.getTimeoutOutcome({
      evaluatedAt: "2026-01-04T00:01:59.999Z",
      game,
    });
    expect(pending).toEqual({
      status: "pending",
      deadline: {
        kind: "async_turn_expiration",
        activePlayerId: FIXTURE_IDS.playerTwoId,
        startedAt: "2026-01-01T00:02:00.000Z",
        deadlineAt: "2026-01-04T00:02:00.000Z",
      },
      metadata: {
        policy: "casual_async",
        expirationWindowMs: CASUAL_EXPIRATION_WINDOW_MS,
        deadline: {
          kind: "async_turn_expiration",
          activePlayerId: FIXTURE_IDS.playerTwoId,
          startedAt: "2026-01-01T00:02:00.000Z",
          deadlineAt: "2026-01-04T00:02:00.000Z",
        },
      },
    });

    const timedOut = policy.getTimeoutOutcome({
      evaluatedAt: "2026-01-04T00:02:00.000Z",
      game,
    });
    expect(timedOut).toEqual({
      status: "timed_out",
      deadline: {
        kind: "async_turn_expiration",
        activePlayerId: FIXTURE_IDS.playerTwoId,
        startedAt: "2026-01-01T00:02:00.000Z",
        deadlineAt: "2026-01-04T00:02:00.000Z",
      },
      metadata: {
        policy: "casual_async",
        expirationWindowMs: CASUAL_EXPIRATION_WINDOW_MS,
        deadline: {
          kind: "async_turn_expiration",
          activePlayerId: FIXTURE_IDS.playerTwoId,
          startedAt: "2026-01-01T00:02:00.000Z",
          deadlineAt: "2026-01-04T00:02:00.000Z",
        },
      },
      resolution: {
        kind: "forfeit",
        event: {
          type: "FORFEIT",
          occurredAt: "2026-01-04T00:02:00.000Z",
          forfeitingPlayerId: FIXTURE_IDS.playerTwoId,
          awardedToPlayerId: FIXTURE_IDS.playerOneId,
          reason: "expired",
          roundId: FIXTURE_IDS.roundId,
        },
      },
    });
  });

  it("returns not_applicable when the reconstructed game no longer has an active turn", () => {
    const game = requireGame(reconstructGameState(BLOCKED_ROUND_EVENT_LOG).game);

    expect(
      policy.getTimeoutOutcome({
        evaluatedAt: "2026-01-02T00:00:00.000Z",
        game,
      }),
    ).toEqual({
      status: "not_applicable",
      metadata: {
        policy: "casual_async",
        expirationWindowMs: CASUAL_EXPIRATION_WINDOW_MS,
        deadline: null,
      },
    });
  });
});
