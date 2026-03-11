import type { GameEvent } from "../events/schema";
import { getReconstructionStateHash, reconstructGameState } from "../reconstruct";
import type { ReconstructionState } from "../types";
import type {
  SubmitMoveAcceptedResponse,
  SubmitMoveRejectedResponse,
  SubmitMoveResponse,
} from "./submit-move-contract";

export type PendingMoveSubmission = Readonly<{
  baselineEvents: readonly GameEvent[];
}>;

type ReconcileMoveSubmissionBase = Readonly<{
  events: readonly GameEvent[];
  reconstruction: ReconstructionState;
  reconstructionHash: string;
  rollbackRequired: boolean;
}>;

export type ReconcileMoveSubmissionAccepted = ReconcileMoveSubmissionBase &
  Readonly<{
    status: "accepted";
    response: SubmitMoveAcceptedResponse;
    appendedEvent: GameEvent;
  }>;

export type ReconcileMoveSubmissionRejected = ReconcileMoveSubmissionBase &
  Readonly<{
    status: "rejected";
    response: SubmitMoveRejectedResponse;
    shouldRefetchAuthoritativeLog: boolean;
  }>;

export type ReconcileMoveSubmissionResult =
  | ReconcileMoveSubmissionAccepted
  | ReconcileMoveSubmissionRejected;

const sortEventsBySeq = (events: readonly GameEvent[]): readonly GameEvent[] =>
  [...events].sort((left, right) => left.eventSeq - right.eventSeq);

const appendAcceptedEvent = (
  baselineEvents: readonly GameEvent[],
  response: SubmitMoveAcceptedResponse,
): readonly GameEvent[] => {
  const existingEvent = baselineEvents.find(
    (event) =>
      event.eventId === response.event.eventId ||
      event.eventSeq === response.event.eventSeq,
  );

  if (existingEvent) {
    return sortEventsBySeq(baselineEvents);
  }

  return sortEventsBySeq([...baselineEvents, response.event]);
};

const buildReconstruction = (
  events: readonly GameEvent[],
): Pick<
  ReconcileMoveSubmissionBase,
  "events" | "reconstruction" | "reconstructionHash"
> => {
  const reconstruction = reconstructGameState(events);

  return {
    events,
    reconstruction,
    reconstructionHash: getReconstructionStateHash(reconstruction),
  };
};

const shouldRefetchAfterRejection = (
  response: SubmitMoveRejectedResponse,
): boolean =>
  response.code === "event_seq_mismatch" ||
  response.authoritativeEvents.length > 0 ||
  (response.authoritativeEventSeq !== null &&
    response.authoritativeEventSeq > response.rollbackToEventSeq);

export const reconcileMoveSubmission = (
  pending: PendingMoveSubmission,
  response: SubmitMoveResponse,
): ReconcileMoveSubmissionResult => {
  if (response.status === "accepted") {
    const events = appendAcceptedEvent(pending.baselineEvents, response);
    const reconciliation = buildReconstruction(events);

    return {
      status: "accepted",
      response,
      appendedEvent: response.event,
      rollbackRequired: false,
      ...reconciliation,
    };
  }

  const events =
    response.authoritativeEvents.length > 0
      ? sortEventsBySeq(response.authoritativeEvents)
      : sortEventsBySeq(pending.baselineEvents);
  const reconciliation = buildReconstruction(events);

  return {
    status: "rejected",
    response,
    rollbackRequired: true,
    shouldRefetchAuthoritativeLog: shouldRefetchAfterRejection(response),
    ...reconciliation,
  };
};

