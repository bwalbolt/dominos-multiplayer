import type { GameEvent, TilePlayedEvent } from "../events/schema";
import type {
  MoveIntent,
  MoveIntentAcceptedResult,
  MoveIntentIdempotencyKey,
  MoveIntentRejectedResult,
} from "../move-intent";

export type SubmitMoveRequest = Readonly<{
  intent: MoveIntent;
  clientReconstructionHash: string | null;
}>;

export type SubmitMoveAcceptedResponse = Readonly<
  Omit<MoveIntentAcceptedResult, "event"> & {
    event: TilePlayedEvent;
    authoritativeEventSeq: number;
    authoritativeReconstructionHash: string;
  }
>;

export type SubmitMoveRejectedResponse = Readonly<
  MoveIntentRejectedResult & {
    authoritativeReconstructionHash: string | null;
    rollbackToEventSeq: number;
    authoritativeEvents: readonly GameEvent[];
  }
>;

export type SubmitMoveResponse =
  | SubmitMoveAcceptedResponse
  | SubmitMoveRejectedResponse;

export const getSubmitMoveResponseIdempotencyKey = (
  response: SubmitMoveResponse,
): MoveIntentIdempotencyKey => response.idempotencyKey;

