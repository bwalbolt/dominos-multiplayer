import { reconstructGameState, type RoundEndedEvent } from "../../../index";
import { BLOCKED_ROUND_EVENT_LOG } from "../../../__tests__/fixtures/event-logs";
import { validateFivesRoundEndedEvent } from "../validate-round-ended";

describe("validateFivesRoundEndedEvent", () => {
  it("accepts a blocked-round event that matches the deterministic resolution", () => {
    const state = reconstructGameState(BLOCKED_ROUND_EVENT_LOG.slice(0, 6));
    const game = state.game;
    const event = BLOCKED_ROUND_EVENT_LOG[6] as RoundEndedEvent;

    if (game === null) {
      throw new Error("Expected reconstructed game state.");
    }

    expect(
      validateFivesRoundEndedEvent({
        game,
        event,
        tileCatalog: state.tileCatalog,
      }),
    ).toEqual({
      ok: true,
      value: event,
    });
  });

  it("rejects a blocked-round event with a mismatched score award", () => {
    const state = reconstructGameState(BLOCKED_ROUND_EVENT_LOG.slice(0, 6));
    const game = state.game;
    const event = {
      ...BLOCKED_ROUND_EVENT_LOG[6],
      scoreAwarded: 5,
      scoreByPlayerId: {
        ...BLOCKED_ROUND_EVENT_LOG[6].scoreByPlayerId,
        "player-fixture-001": 5,
      },
    } as RoundEndedEvent;

    if (game === null) {
      throw new Error("Expected reconstructed game state.");
    }

    expect(
      validateFivesRoundEndedEvent({
        game,
        event,
        tileCatalog: state.tileCatalog,
      }),
    ).toEqual({
      ok: false,
      code: "round_result_mismatch",
      message: "ROUND_ENDED does not match the deterministic round resolution.",
    });
  });
});
