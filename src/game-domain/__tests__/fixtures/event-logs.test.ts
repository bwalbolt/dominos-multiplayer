import { describe, expect, it } from "@jest/globals";

import { getReconstructionHashFromEvents, reconstructGameState } from "../../index";
import { FIXTURE_IDS } from "./builders";
import {
  BLOCKED_ROUND_EVENT_LOG,
  EXPIRATION_FORFEIT_EVENT_LOG,
  FIXTURE_EVENT_LOGS,
  OPENING_EVENT_LOG,
  SPINNER_EXPANSION_EVENT_LOG,
} from "./event-logs";

describe("fixture event logs", () => {
  it("reconstructs the opening log deterministically", () => {
    const state = reconstructGameState(OPENING_EVENT_LOG);
    const firstHash = getReconstructionHashFromEvents(OPENING_EVENT_LOG);
    const secondHash = getReconstructionHashFromEvents(OPENING_EVENT_LOG);

    expect(state.eventCount).toBe(3);
    expect(state.game?.currentRound?.board.tiles).toHaveLength(1);
    expect(state.game?.currentRound?.board.spinnerTileId).toBe("tile-6-6");
    expect(state.game?.turn?.activePlayerId).toBe("player-fixture-002");
    expect(firstHash).toBe(secondHash);
  });

  it("captures unlocked spinner branches in the spinner expansion log", () => {
    const state = reconstructGameState(SPINNER_EXPANSION_EVENT_LOG);
    const openEnds = state.game?.currentRound?.board.openEnds ?? [];

    expect(state.eventCount).toBe(7);
    expect(state.game?.currentRound?.board.tiles).toHaveLength(5);
    expect(openEnds.map((openEnd) => openEnd.side)).toEqual([
      "left",
      "right",
      "up",
      "down",
    ]);
  });

  it("encodes a blocked-round terminal state", () => {
    const state = reconstructGameState(BLOCKED_ROUND_EVENT_LOG);

    expect(state.game?.currentRound?.status).toBe("blocked");
    expect(state.game?.currentRound?.result).toEqual({
      winnerPlayerId: "player-fixture-001",
      reason: "blocked",
      scoreAwarded: 5,
    });
    expect(state.game?.playerStateById[FIXTURE_IDS.playerOneId]?.score).toBe(5);
    expect(state.game?.turn).toBeNull();
  });

  it("encodes an expiration forfeit with a multi-day timestamp gap", () => {
    const state = reconstructGameState(EXPIRATION_FORFEIT_EVENT_LOG);

    expect(EXPIRATION_FORFEIT_EVENT_LOG[3]?.occurredAt).toBe(
      "2026-01-04T00:03:00.000Z",
    );
    expect(state.game?.status).toBe("forfeited");
    expect(state.game?.winnerPlayerId).toBe("player-fixture-001");
    expect(state.game?.currentRound?.result).toEqual({
      winnerPlayerId: "player-fixture-001",
      reason: "forfeit",
      scoreAwarded: 0,
    });
  });

  it("exports the named log collection for reuse across suites", () => {
    expect(FIXTURE_EVENT_LOGS.opening).toBe(OPENING_EVENT_LOG);
    expect(FIXTURE_EVENT_LOGS.spinnerExpansion).toBe(SPINNER_EXPANSION_EVENT_LOG);
    expect(FIXTURE_EVENT_LOGS.blockedRound).toBe(BLOCKED_ROUND_EVENT_LOG);
    expect(FIXTURE_EVENT_LOGS.expirationForfeit).toBe(EXPIRATION_FORFEIT_EVENT_LOG);
  });
});
