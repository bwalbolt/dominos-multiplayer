import type {
  BoardState,
  FivesLegalMove,
  FivesMoveIntent,
  FivesMoveValidationErrorCode,
  Tile,
  TileId,
  ValidationResult,
} from "../../types";
import {
  evaluateFivesLegalMoves,
  type FivesLegalMoveEvaluation,
} from "./legal-moves";

type ValidateFivesMoveInput = Readonly<{
  board: BoardState;
  handTileIds: readonly TileId[];
  tileCatalog: Readonly<Record<TileId, Tile>>;
  intent: FivesMoveIntent;
  isOpeningMove: boolean;
}>;

export type ValidateFivesMoveResult = Readonly<{
  validation: ValidationResult<FivesLegalMove, FivesMoveValidationErrorCode>;
  legalMoveEvaluation: FivesLegalMoveEvaluation;
}>;

const createFailure = (
  code: FivesMoveValidationErrorCode,
  message: string,
): ValidationResult<FivesLegalMove, FivesMoveValidationErrorCode> => ({
  ok: false,
  code,
  message,
});

const createSuccess = (
  move: FivesLegalMove,
): ValidationResult<FivesLegalMove, FivesMoveValidationErrorCode> => ({
  ok: true,
  value: move,
});

export const validateFivesMove = (
  input: ValidateFivesMoveInput,
): ValidateFivesMoveResult => {
  const legalMoveEvaluation = evaluateFivesLegalMoves({
    board: input.board,
    handTileIds: input.handTileIds,
    tileCatalog: input.tileCatalog,
    isOpeningMove: input.isOpeningMove,
  });

  const tile = input.tileCatalog[input.intent.tileId];

  if (!tile) {
    return {
      legalMoveEvaluation,
      validation: createFailure(
        "tile_not_found",
        "Tile is not present in the tile catalog.",
      ),
    };
  }

  if (!input.handTileIds.includes(input.intent.tileId)) {
    return {
      legalMoveEvaluation,
      validation: createFailure("tile_not_in_hand", "Tile is not in the active hand."),
    };
  }

  if (legalMoveEvaluation.requiredOpeningTileId !== null) {
    if (input.intent.tileId !== legalMoveEvaluation.requiredOpeningTileId) {
      return {
        legalMoveEvaluation,
        validation: createFailure(
          "opening_double_required",
          "Opening move must play the highest double in hand.",
        ),
      };
    }
  }

  if (legalMoveEvaluation.moves.length === 0) {
    return {
      legalMoveEvaluation,
      validation: createFailure("no_legal_moves", "No legal move is currently available."),
    };
  }

  const sideMatches = legalMoveEvaluation.moves.filter(
    (move) => move.tileId === input.intent.tileId && move.side === input.intent.side,
  );

  if (sideMatches.length === 0) {
    return {
      legalMoveEvaluation,
      validation: createFailure(
        "illegal_side",
        "Tile cannot be placed on the selected board side.",
      ),
    };
  }

  const exactMatch = sideMatches.find(
    (move) => move.openPipFacingOutward === input.intent.openPipFacingOutward,
  );

  if (!exactMatch) {
    return {
      legalMoveEvaluation,
      validation: createFailure(
        "illegal_orientation",
        "Tile orientation does not satisfy the open-end pip constraint.",
      ),
    };
  }

  return {
    legalMoveEvaluation,
    validation: createSuccess(exactMatch),
  };
};
