import type { GameEvent } from "@/src/game-domain/events/schema";
import type {
  GameMetadata,
  GameStatus,
  PlayerId,
  PlayerMatchState,
  TurnState,
} from "@/src/game-domain/types";

type VisualTurnGameState = Readonly<{
  status: GameStatus;
  turn: Pick<TurnState, "activePlayerId"> | null;
  metadata: Pick<GameMetadata, "targetScore">;
  playerStateById: Readonly<Record<PlayerId, Pick<PlayerMatchState, "score">>>;
}>;

type ResolveVisualTurnPlayerIdInput = Readonly<{
  game: VisualTurnGameState;
  events: readonly GameEvent[];
  hasPendingRoundResolution: boolean;
}>;

type VisualTurnActionEvent = Extract<
  GameEvent,
  { type: "TILE_PLAYED" | "TURN_PASSED" }
>;

const isVisualTurnActionEvent = (
  event: GameEvent,
): event is VisualTurnActionEvent =>
  event.type === "TILE_PLAYED" || event.type === "TURN_PASSED";

const findLastActionablePlayerId = (
  events: readonly GameEvent[],
): PlayerId | null => {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (isVisualTurnActionEvent(event)) {
      return event.playerId;
    }
  }

  return null;
};

const hasPendingTargetScoreResolution = (
  game: VisualTurnGameState,
): boolean => {
  if (game.status !== "active") {
    return false;
  }

  return Object.values(game.playerStateById).some(
    (playerState) => playerState.score >= game.metadata.targetScore,
  );
};

export const resolveVisualTurnPlayerId = ({
  game,
  events,
  hasPendingRoundResolution,
}: ResolveVisualTurnPlayerIdInput): PlayerId | null => {
  const activePlayerId = game.turn?.activePlayerId ?? null;
  const shouldFreezeVisualTurn =
    hasPendingRoundResolution ||
    hasPendingTargetScoreResolution(game) ||
    game.status === "completed";

  if (!shouldFreezeVisualTurn) {
    return activePlayerId;
  }

  return findLastActionablePlayerId(events) ?? activePlayerId;
};
