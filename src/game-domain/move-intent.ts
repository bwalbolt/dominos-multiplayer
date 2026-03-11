import type { TilePlayedEvent } from "./events/schema";
import type {
  ChainSide,
  DominoPip,
  FivesMoveValidationErrorCode,
  GameId,
  MoveIntentAnchorId,
  MoveIntentIdempotencyKey,
  PlayerId,
  RoundId,
  TileId,
} from "./types";

export type {
  ChainSide,
  DominoPip,
  FivesMoveValidationErrorCode,
  GameId,
  MoveIntentAnchorId,
  MoveIntentIdempotencyKey,
  PlayerId,
  RoundId,
  TileId,
};

export const MOVE_INTENT_KINDS = ["play_tile"] as const;

export type MoveIntentKind = (typeof MOVE_INTENT_KINDS)[number];

export const MOVE_INTENT_FAILURE_CODES = [
  "game_not_found",
  "game_not_active",
  "not_game_participant",
  "not_players_turn",
  "event_seq_mismatch",
  "idempotency_conflict",
  "round_not_active",
  "tile_not_in_hand",
  "tile_not_found",
  "opening_double_required",
  "no_legal_moves",
  "illegal_side",
  "illegal_orientation",
] as const;

export type MoveIntentFailureCode = (typeof MOVE_INTENT_FAILURE_CODES)[number];

export type MoveIntentBase<
  TKind extends MoveIntentKind,
  TPayload extends Record<string, unknown>,
> = Readonly<{
  kind: TKind;
  gameId: GameId;
  roundId: RoundId;
  playerId: PlayerId;
  variant: "fives";
  expectedEventSeq: number;
  idempotencyKey: MoveIntentIdempotencyKey;
}> &
  TPayload;

export type FivesMoveIntent = MoveIntentBase<
  "play_tile",
  Readonly<{
    tileId: TileId;
    side: ChainSide;
    openPipFacingOutward: DominoPip;
    anchorId: MoveIntentAnchorId | null;
  }>
>;

export type MoveIntent = FivesMoveIntent;

export type MoveIntentRequest = Readonly<{
  intent: MoveIntent;
}>;

export type MoveIntentAcceptanceSource = "applied" | "idempotent_replay";

export type MoveIntentAcceptedResult = Readonly<{
  ok: true;
  status: "accepted";
  source: MoveIntentAcceptanceSource;
  idempotencyKey: MoveIntentIdempotencyKey;
  event: TilePlayedEvent;
}>;

export type MoveIntentRejectedResult = Readonly<{
  ok: false;
  status: "rejected";
  code: MoveIntentFailureCode;
  message: string;
  idempotencyKey: MoveIntentIdempotencyKey;
  expectedEventSeq: number;
  authoritativeEventSeq: number | null;
  retryable: boolean;
}>;

export type MoveIntentResult =
  | MoveIntentAcceptedResult
  | MoveIntentRejectedResult;

export const isMoveIntentFailureCode = (
  code: string,
): code is MoveIntentFailureCode =>
  MOVE_INTENT_FAILURE_CODES.includes(code as MoveIntentFailureCode);

const FIVES_MOVE_VALIDATION_FAILURE_CODE_SET = new Set<MoveIntentFailureCode>([
  "round_not_active",
  "tile_not_in_hand",
  "tile_not_found",
  "opening_double_required",
  "no_legal_moves",
  "illegal_side",
  "illegal_orientation",
]);

export const isFivesMoveValidationFailureCode = (
  code: MoveIntentFailureCode,
): code is FivesMoveValidationErrorCode =>
  FIVES_MOVE_VALIDATION_FAILURE_CODE_SET.has(code);
