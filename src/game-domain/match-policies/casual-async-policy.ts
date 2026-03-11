import type {
  CasualAsyncPolicyMetadata,
  MatchPolicy,
  MatchPolicyDeadline,
  MatchPolicyEvaluationContext,
  MatchPolicyTimeoutOutcome,
} from "./types";

export const CASUAL_EXPIRATION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export class CasualAsyncPolicy
  implements MatchPolicy<CasualAsyncPolicyMetadata>
{
  readonly kind = "casual_async";

  getMetadata(context: MatchPolicyEvaluationContext): CasualAsyncPolicyMetadata {
    return {
      policy: "casual_async",
      expirationWindowMs: CASUAL_EXPIRATION_WINDOW_MS,
      deadline: this.getDeadline(context),
    };
  }

  getDeadline(
    context: MatchPolicyEvaluationContext,
  ): MatchPolicyDeadline | null {
    const { game } = context;

    if (game.status !== "active" || !game.turn) {
      return null;
    }

    const { activePlayerId, lastActionAt } = game.turn;
    const startedAt = lastActionAt;
    const startedAtMs = new Date(startedAt).getTime();
    const deadlineAtMs = startedAtMs + CASUAL_EXPIRATION_WINDOW_MS;
    const deadlineAt = new Date(deadlineAtMs).toISOString();

    return {
      kind: "async_turn_expiration",
      activePlayerId,
      startedAt,
      deadlineAt,
    };
  }

  getTimeoutOutcome(
    context: MatchPolicyEvaluationContext,
  ): MatchPolicyTimeoutOutcome {
    const deadline = this.getDeadline(context);
    const metadata = this.getMetadata(context);

    if (!deadline) {
      return {
        status: "not_applicable",
        metadata,
      };
    }

    const evaluatedAtMs = new Date(context.evaluatedAt).getTime();
    const deadlineAtMs = new Date(deadline.deadlineAt).getTime();

    if (evaluatedAtMs < deadlineAtMs) {
      return {
        status: "pending",
        deadline,
        metadata,
      };
    }

    // Timed out -> Forfeit
    const { game } = context;
    const forfeitingPlayerId = deadline.activePlayerId;
    const awardedToPlayerId = game.players.find(
      (p) => p.playerId !== forfeitingPlayerId,
    )?.playerId;

    if (!awardedToPlayerId) {
      // Should not happen in 2-player game
      return {
        status: "not_applicable",
        metadata,
      };
    }

    return {
      status: "timed_out",
      deadline,
      metadata,
      resolution: {
        kind: "forfeit",
        event: {
          type: "FORFEIT",
          occurredAt: deadline.deadlineAt, // Outcome is deterministic at the deadline
          forfeitingPlayerId,
          awardedToPlayerId,
          reason: "expired",
          roundId: game.currentRound?.roundId ?? null,
        },
      },
    };
  }
}
