import type { ForfeitEvent } from "../events/schema";
import type { GameState, PlayerId, RoundId } from "../types";

export const MATCH_POLICY_KINDS = [
  "casual_async",
  "ranked_realtime",
] as const;

export type MatchPolicyKind = (typeof MATCH_POLICY_KINDS)[number];

export const MATCH_POLICY_DEADLINE_KINDS = [
  "async_turn_expiration",
  "realtime_turn_timer",
] as const;

export type MatchPolicyDeadlineKind =
  (typeof MATCH_POLICY_DEADLINE_KINDS)[number];

export type MatchPolicyEvaluationContext = Readonly<{
  evaluatedAt: string;
  game: GameState;
}>;

export type MatchPolicyDeadline = Readonly<{
  kind: MatchPolicyDeadlineKind;
  activePlayerId: PlayerId;
  startedAt: string;
  deadlineAt: string;
}>;

type MatchPolicyMetadataBase<TPolicy extends MatchPolicyKind> = Readonly<{
  policy: TPolicy;
  deadline: MatchPolicyDeadline | null;
}>;

export type CasualAsyncPolicyMetadata = MatchPolicyMetadataBase<"casual_async"> &
  Readonly<{
    expirationWindowMs: number;
  }>;

export type RankedRealtimePolicyMetadata =
  MatchPolicyMetadataBase<"ranked_realtime"> &
    Readonly<{
      turnTimerMs: number;
      implementationStatus: "stub";
    }>;

export type MatchPolicyMetadata =
  | CasualAsyncPolicyMetadata
  | RankedRealtimePolicyMetadata;

// Policy outputs only the deterministic terminal effect; persistence fills ids/seq.
export type MatchPolicyForfeitEventDraft = Readonly<{
  type: "FORFEIT";
  occurredAt: string;
  forfeitingPlayerId: PlayerId;
  awardedToPlayerId: PlayerId;
  reason: Extract<ForfeitEvent["reason"], "expired">;
  roundId: RoundId | null;
}>;

export type MatchPolicyTimeoutResolution = Readonly<{
  kind: "forfeit";
  event: MatchPolicyForfeitEventDraft;
}>;

export type MatchPolicyTimeoutOutcome =
  | Readonly<{
      status: "not_applicable";
      metadata: MatchPolicyMetadata;
    }>
  | Readonly<{
      status: "pending";
      deadline: MatchPolicyDeadline;
      metadata: MatchPolicyMetadata;
    }>
  | Readonly<{
      status: "timed_out";
      deadline: MatchPolicyDeadline;
      metadata: MatchPolicyMetadata;
      resolution: MatchPolicyTimeoutResolution;
    }>;

export interface MatchPolicyLifecycleHooks<
  TMetadata extends MatchPolicyMetadata = MatchPolicyMetadata,
> {
  getMetadata(context: MatchPolicyEvaluationContext): TMetadata;
  getDeadline(context: MatchPolicyEvaluationContext): MatchPolicyDeadline | null;
  getTimeoutOutcome(
    context: MatchPolicyEvaluationContext,
  ): MatchPolicyTimeoutOutcome;
}

export interface MatchPolicy<
  TMetadata extends MatchPolicyMetadata = MatchPolicyMetadata,
> extends MatchPolicyLifecycleHooks<TMetadata> {
  readonly kind: TMetadata["policy"];
}
