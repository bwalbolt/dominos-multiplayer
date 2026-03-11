import type { RoundEndedEvent } from "../../events/schema";
import type {
  GameState,
  PlayerId,
  Tile,
  TileId,
  ValidationResult,
} from "../../types";
import { evaluateRoundResolution } from "./round-resolution";

export type FivesRoundEndedValidationErrorCode =
  | "round_not_active"
  | "round_result_mismatch"
  | "score_sync_mismatch";

type ValidateFivesRoundEndedEventInput = Readonly<{
  game: GameState;
  event: RoundEndedEvent;
  tileCatalog: Readonly<Record<TileId, Tile>>;
}>;

export type ValidateFivesRoundEndedEventResult = ValidationResult<
  RoundEndedEvent,
  FivesRoundEndedValidationErrorCode
>;

const createFailure = (
  code: FivesRoundEndedValidationErrorCode,
  message: string,
): ValidateFivesRoundEndedEventResult => ({
  ok: false,
  code,
  message,
});

const createSuccess = (
  event: RoundEndedEvent,
): ValidateFivesRoundEndedEventResult => ({
  ok: true,
  value: event,
});

const createExpectedScoreByPlayerId = (
  game: GameState,
  winnerPlayerId: PlayerId | null,
  scoreAwarded: number,
): Readonly<Record<PlayerId, number>> =>
  Object.fromEntries(
    game.players.map((player) => [
      player.playerId,
      game.playerStateById[player.playerId].score +
        (player.playerId === winnerPlayerId ? scoreAwarded : 0),
    ]),
  ) as Readonly<Record<PlayerId, number>>;

export const validateFivesRoundEndedEvent = (
  input: ValidateFivesRoundEndedEventInput,
): ValidateFivesRoundEndedEventResult => {
  const currentRound = input.game.currentRound;

  if (currentRound === null || currentRound.endedAt !== null) {
    return createFailure(
      "round_not_active",
      "ROUND_ENDED requires an active round.",
    );
  }

  if (input.event.reason !== "forfeit") {
    const expectedResult = evaluateRoundResolution(currentRound, input.tileCatalog);

    if (
      expectedResult === null ||
      expectedResult.winnerPlayerId !== input.event.winnerPlayerId ||
      expectedResult.reason !== input.event.reason ||
      expectedResult.scoreAwarded !== input.event.scoreAwarded
    ) {
      return createFailure(
        "round_result_mismatch",
        "ROUND_ENDED does not match the deterministic round resolution.",
      );
    }
  }

  const expectedScoreByPlayerId = createExpectedScoreByPlayerId(
    input.game,
    input.event.winnerPlayerId,
    input.event.scoreAwarded,
  );

  for (const player of input.game.players) {
    if (
      input.event.scoreByPlayerId[player.playerId] !==
      expectedScoreByPlayerId[player.playerId]
    ) {
      return createFailure(
        "score_sync_mismatch",
        "ROUND_ENDED scoreByPlayerId does not match the pre-round scores plus scoreAwarded.",
      );
    }
  }

  return createSuccess(input.event);
};
