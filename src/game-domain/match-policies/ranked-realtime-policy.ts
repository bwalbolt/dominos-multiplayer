import type {
  MatchPolicy,
  MatchPolicyDeadline,
  MatchPolicyEvaluationContext,
  MatchPolicyTimeoutOutcome,
  RankedRealtimePolicyMetadata,
} from "./types";

/**
 * RANKED_TURN_TIMER_MS
 * In ranked mode, turns have a strict realtime deadline.
 * Currently set to 60 seconds as a target value.
 * TODO(ranked): Finalize timer duration based on playtesting.
 */
export const RANKED_TURN_TIMER_MS = 60 * 1000;

/**
 * RankedRealtimePolicy
 *
 * Current implementation is a non-functional scaffold.
 * Realtime enforcement requires active clock synchronization and
 * heartbeat mechanisms which are out of scope for the casual MVP.
 *
 * TODO(ranked): Implement realtime deadline enforcement and
 * automated forfeit/kick logic for timed-out players.
 */
export class RankedRealtimePolicy
  implements MatchPolicy<RankedRealtimePolicyMetadata>
{
  readonly kind = "ranked_realtime";

  getMetadata(
    context: MatchPolicyEvaluationContext,
  ): RankedRealtimePolicyMetadata {
    return {
      policy: "ranked_realtime",
      turnTimerMs: RANKED_TURN_TIMER_MS,
      implementationStatus: "stub",
      deadline: this.getDeadline(context),
    };
  }

  getDeadline(
    _context: MatchPolicyEvaluationContext,
  ): MatchPolicyDeadline | null {
    // TODO(ranked): Actually compute realtime deadlines from game state timestamps.
    // Realtime policies may require more precise server-synced time than ISO strings.
    return null;
  }

  getTimeoutOutcome(
    context: MatchPolicyEvaluationContext,
  ): MatchPolicyTimeoutOutcome {
    // Since this is a stub, we return not_applicable.
    // Future implementation will transition to 'pending' or 'timed_out'
    // based on comparing context.evaluatedAt with the computed deadline.
    return {
      status: "not_applicable",
      metadata: this.getMetadata(context),
    };
  }
}
