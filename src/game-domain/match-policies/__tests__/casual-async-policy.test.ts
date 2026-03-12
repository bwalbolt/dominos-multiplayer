import {
  CasualAsyncPolicy,
  CASUAL_EXPIRATION_WINDOW_MS,
} from "../casual-async-policy";
import type { GameState, PlayerId, RoundId } from "../../types";

describe("CasualAsyncPolicy", () => {
  const policy = new CasualAsyncPolicy();
  const p1 = "p1" as PlayerId;
  const p2 = "p2" as PlayerId;
  const roundId = "r1" as RoundId;

  const mockGame: Partial<GameState> = {
    status: "active",
    players: [
      { playerId: p1, position: "player_1", displayName: "Alice" },
      { playerId: p2, position: "player_2", displayName: "Bob" },
    ],
    turn: {
      activePlayerId: p1,
      turnNumber: 1,
      consecutivePasses: 0,
      lastActionAt: "2024-01-01T00:00:00Z",
    },
    currentRound: {
      roundId,
      // other fields not used by policy but needed for type if we casted fully
    } as any,
  };

  it("should calculate deadline as 3 days after last action", () => {
    const context = {
      evaluatedAt: "2024-01-01T12:00:00Z",
      game: mockGame as GameState,
    };

    const deadline = policy.getDeadline(context);
    expect(deadline).not.toBeNull();
    expect(deadline?.activePlayerId).toBe(p1);
    expect(deadline?.startedAt).toBe("2024-01-01T00:00:00Z");

    const expectedDeadline = new Date(
      new Date("2024-01-01T00:00:00Z").getTime() + CASUAL_EXPIRATION_WINDOW_MS,
    ).toISOString();
    expect(deadline?.deadlineAt).toBe(expectedDeadline);
  });

  it("should return pending status if before deadline", () => {
    const context = {
      evaluatedAt: "2024-01-03T00:00:00Z", // 2 days later
      game: mockGame as GameState,
    };

    const outcome = policy.getTimeoutOutcome(context);
    expect(outcome.status).toBe("pending");
    if (outcome.status === "pending") {
      expect(outcome.deadline.activePlayerId).toBe(p1);
    }
  });

  it("should return timed_out status with forfeit event if after deadline", () => {
    const context = {
      evaluatedAt: "2024-01-05T00:00:00Z", // 4 days later
      game: mockGame as GameState,
    };

    const outcome = policy.getTimeoutOutcome(context);
    expect(outcome.status).toBe("timed_out");
    if (outcome.status === "timed_out") {
      expect(outcome.resolution.kind).toBe("forfeit");
      expect(outcome.resolution.event.type).toBe("FORFEIT");
      expect(outcome.resolution.event.forfeitingPlayerId).toBe(p1);
      expect(outcome.resolution.event.awardedToPlayerId).toBe(p2);
      expect(outcome.resolution.event.reason).toBe("expired");
      expect(outcome.resolution.event.roundId).toBe(roundId);
      
      // The event occurredAt should be exactly the deadline
      const expectedDeadline = new Date(
        new Date("2024-01-01T00:00:00Z").getTime() + CASUAL_EXPIRATION_WINDOW_MS,
      ).toISOString();
      expect(outcome.resolution.event.occurredAt).toBe(expectedDeadline);
    }
  });

  it("should return not_applicable if game is not active", () => {
    const inactiveGame = { ...mockGame, status: "completed" } as GameState;
    const context = {
      evaluatedAt: "2024-01-05T00:00:00Z",
      game: inactiveGame,
    };

    const deadline = policy.getDeadline(context);
    expect(deadline).toBeNull();

    const outcome = policy.getTimeoutOutcome(context);
    expect(outcome.status).toBe("not_applicable");
  });
});
