import { RankedRealtimePolicy, RANKED_TURN_TIMER_MS } from "../ranked-realtime-policy";
import type { GameState, PlayerId } from "../../types";

describe("RankedRealtimePolicy (scaffold)", () => {
  const policy = new RankedRealtimePolicy();
  const mockGame: Partial<GameState> = {
    status: "active",
    players: [
      { playerId: "p1" as PlayerId, position: "player_1", displayName: "Alice" },
      { playerId: "p2" as PlayerId, position: "player_2", displayName: "Bob" },
    ],
  };

  it("should return stub metadata with 60s timer", () => {
    const context = {
      evaluatedAt: new Date().toISOString(),
      game: mockGame as GameState,
    };

    const metadata = policy.getMetadata(context);
    expect(metadata.policy).toBe("ranked_realtime");
    expect(metadata.turnTimerMs).toBe(RANKED_TURN_TIMER_MS);
    expect(metadata.implementationStatus).toBe("stub");
  });

  it("should return null deadline as a stub", () => {
    const context = {
      evaluatedAt: new Date().toISOString(),
      game: mockGame as GameState,
    };

    expect(policy.getDeadline(context)).toBeNull();
  });

  it("should return not_applicable outcome as a stub", () => {
    const context = {
      evaluatedAt: new Date().toISOString(),
      game: mockGame as GameState,
    };

    const outcome = policy.getTimeoutOutcome(context);
    expect(outcome.status).toBe("not_applicable");
    expect(outcome.metadata.policy).toBe("ranked_realtime");
  });
});
