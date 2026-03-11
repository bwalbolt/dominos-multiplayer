import type { TilePlayedEvent } from "../../events/schema";
import type { MoveIntentIdempotencyKey } from "../../move-intent";
import { getReconstructionHashFromEvents } from "../../reconstruct";
import type { EventId } from "../../types";
import { FIXTURE_EVENT_LOGS } from "../../__tests__/fixtures/event-logs";
import {
  FIXTURE_IDS,
  getFixtureTileId,
} from "../../__tests__/fixtures/builders";
import { reconcileMoveSubmission } from "../reconcile";
import type {
  SubmitMoveAcceptedResponse,
  SubmitMoveRejectedResponse,
} from "../submit-move-contract";

describe("reconcileMoveSubmission", () => {
  const idempotencyKey = "intent-fixture-001" as MoveIntentIdempotencyKey;

  it("appends the authoritative accepted event and reconstructs the new board state", () => {
    const baselineEvents = FIXTURE_EVENT_LOGS.opening;
    const authoritativeEvent: TilePlayedEvent = {
      eventId: "evt-004-tile_played" as EventId,
      gameId: FIXTURE_IDS.gameId,
      eventSeq: 4,
      type: "TILE_PLAYED",
      version: 1,
      occurredAt: "2026-01-01T00:03:00.000Z",
      playerId: FIXTURE_IDS.playerTwoId,
      roundId: FIXTURE_IDS.roundId,
      tileId: getFixtureTileId(5, 6),
      side: "right",
      openPipFacingOutward: 5,
    };
    const response: SubmitMoveAcceptedResponse = {
      ok: true,
      status: "accepted",
      source: "applied",
      idempotencyKey,
      event: authoritativeEvent,
      authoritativeEventSeq: authoritativeEvent.eventSeq,
      authoritativeReconstructionHash: getReconstructionHashFromEvents([
        ...baselineEvents,
        authoritativeEvent,
      ]),
    };

    const result = reconcileMoveSubmission({ baselineEvents }, response);

    expect(result.status).toBe("accepted");
    expect(result.rollbackRequired).toBe(false);
    expect(result.events).toHaveLength(baselineEvents.length + 1);
    expect(result.events.at(-1)).toEqual(authoritativeEvent);
    expect(result.reconstruction.game?.turn?.activePlayerId).toBe(
      FIXTURE_IDS.playerOneId,
    );
    expect(result.reconstruction.game?.currentRound?.board.openEnds).toEqual([
      {
        side: "left",
        pip: 6,
        tileId: getFixtureTileId(6, 6),
      },
      {
        side: "right",
        pip: 5,
        tileId: getFixtureTileId(5, 6),
      },
      {
        side: "up",
        pip: 6,
        tileId: getFixtureTileId(6, 6),
      },
      {
        side: "down",
        pip: 6,
        tileId: getFixtureTileId(6, 6),
      },
    ]);
  });

  it("rolls back to the baseline event log when the server rejects the move", () => {
    const baselineEvents = FIXTURE_EVENT_LOGS.opening;
    const response: SubmitMoveRejectedResponse = {
      ok: false,
      status: "rejected",
      code: "illegal_side",
      message: "Tile no longer matches the requested side.",
      idempotencyKey,
      expectedEventSeq: 3,
      authoritativeEventSeq: 3,
      retryable: false,
      authoritativeReconstructionHash: getReconstructionHashFromEvents(
        baselineEvents,
      ),
      rollbackToEventSeq: baselineEvents.at(-1)?.eventSeq ?? 0,
      authoritativeEvents: [],
    };

    const result = reconcileMoveSubmission({ baselineEvents }, response);

    expect(result.status).toBe("rejected");
    expect(result.rollbackRequired).toBe(true);

    if (result.status === "rejected") {
      expect(result.shouldRefetchAuthoritativeLog).toBe(false);
    }

    expect(result.events).toEqual(baselineEvents);
    expect(result.reconstruction.game?.turn?.activePlayerId).toBe(
      FIXTURE_IDS.playerTwoId,
    );
    expect(result.reconstruction.game?.currentRound?.board.tiles).toHaveLength(
      1,
    );
  });

  it("prefers authoritative events returned on rejection when the client is stale", () => {
    const baselineEvents = FIXTURE_EVENT_LOGS.opening;
    const authoritativeEvents = FIXTURE_EVENT_LOGS.spinnerExpansion.slice(0, 4);
    const response: SubmitMoveRejectedResponse = {
      ok: false,
      status: "rejected",
      code: "event_seq_mismatch",
      message: "Client event sequence is stale.",
      idempotencyKey,
      expectedEventSeq: 3,
      authoritativeEventSeq: 4,
      retryable: true,
      authoritativeReconstructionHash: getReconstructionHashFromEvents(
        authoritativeEvents,
      ),
      rollbackToEventSeq: baselineEvents.at(-1)?.eventSeq ?? 0,
      authoritativeEvents,
    };

    const result = reconcileMoveSubmission({ baselineEvents }, response);

    expect(result.status).toBe("rejected");
    expect(result.rollbackRequired).toBe(true);

    if (result.status === "rejected") {
      expect(result.shouldRefetchAuthoritativeLog).toBe(true);
    }

    expect(result.events).toEqual(authoritativeEvents);
    expect(result.reconstruction.game?.turn?.activePlayerId).toBe(
      FIXTURE_IDS.playerOneId,
    );
    expect(result.reconstruction.game?.currentRound?.board.tiles).toHaveLength(
      2,
    );
  });
});
