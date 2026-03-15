import type { LayoutAnchor, SnapResolution } from "../layout/types";
import type { FivesMoveIntent } from "../move-intent";
import type {
  BoardState,
  FivesLegalMove,
  FivesMoveValidationErrorCode,
  GameId,
  MoveIntentAnchorId,
  MoveIntentIdempotencyKey,
  PlayerId,
  RoundId,
  Tile,
  TileId,
} from "../types";
import { validateFivesMove } from "../variants/fives/validate-move";

export type ResolveMoveIntentInput = Readonly<{
  gameId: GameId;
  roundId: RoundId;
  playerId: PlayerId;
  requiresOpeningDouble: boolean;
  expectedEventSeq: number;
  idempotencyKey: MoveIntentIdempotencyKey;
  board: BoardState;
  handTileIds: readonly TileId[];
  tileCatalog: Readonly<Record<TileId, Tile>>;
  draggedTileId: TileId;
  snapResolution: SnapResolution;
}>;

export type ResolveMoveIntentFailureCode =
  | "no_snap_target"
  | FivesMoveValidationErrorCode;

type ResolveMoveIntentBase<TCode extends ResolveMoveIntentFailureCode> = Readonly<{
  ok: false;
  action: "return_to_hand";
  code: TCode;
  message: string;
  snapResolution: SnapResolution;
}>;

export type ResolveMoveIntentSuccess = Readonly<{
  ok: true;
  action: "submit";
  intent: FivesMoveIntent;
  legalMove: FivesLegalMove;
  snapResolution: SnapResolution;
}>;

export type ResolveMoveIntentFailure = ResolveMoveIntentBase<ResolveMoveIntentFailureCode>;

export type ResolveMoveIntentResult =
  | ResolveMoveIntentSuccess
  | ResolveMoveIntentFailure;

const createFailure = <TCode extends ResolveMoveIntentFailureCode>(
  code: TCode,
  message: string,
  snapResolution: SnapResolution,
): ResolveMoveIntentBase<TCode> => ({
  ok: false,
  action: "return_to_hand",
  code,
  message,
  snapResolution,
});

const toMoveIntentAnchorId = (anchor: LayoutAnchor | null): MoveIntentAnchorId | null => {
  if (anchor === null || anchor.ownerTileId === null) {
    return null;
  }

  return anchor.id as MoveIntentAnchorId;
};

const resolveOpeningMoveIntent = (
  input: ResolveMoveIntentInput,
): ResolveMoveIntentResult => {
  const tile = input.tileCatalog[input.draggedTileId];

  if (!tile) {
    return createFailure(
      "tile_not_found",
      "Tile is not present in the tile catalog.",
      input.snapResolution,
    );
  }

  const candidateOutwardPips =
    tile.sideA === tile.sideB ? [tile.sideA] : [tile.sideA, tile.sideB];

  let lastFailure:
    | {
        code: FivesMoveValidationErrorCode;
        message: string;
      }
    | null = null;

  for (const openPipFacingOutward of candidateOutwardPips) {
    const validationResult = validateFivesMove({
      board: input.board,
      handTileIds: input.handTileIds,
      tileCatalog: input.tileCatalog,
      intent: {
        tileId: input.draggedTileId,
        side: "left",
        openPipFacingOutward,
      },
      requiresOpeningDouble: input.requiresOpeningDouble,
    });

    const validation = validationResult.validation;

    if (validation.ok) {
      return {
        ok: true,
        action: "submit",
        intent: {
          kind: "play_tile",
          gameId: input.gameId,
          roundId: input.roundId,
          playerId: input.playerId,
          variant: "fives",
          expectedEventSeq: input.expectedEventSeq,
          idempotencyKey: input.idempotencyKey,
          tileId: validation.value.tileId,
          side: validation.value.side,
          openPipFacingOutward: validation.value.openPipFacingOutward,
          anchorId: null,
        },
        legalMove: validation.value,
        snapResolution: input.snapResolution,
      };
    }

    lastFailure = {
      code: validation.code,
      message: validation.message,
    };
  }

  return createFailure(
    lastFailure?.code ?? "illegal_orientation",
    lastFailure?.message ?? "Dragged tile resolved to an invalid opening orientation.",
    input.snapResolution,
  );
};

const getCandidateOutwardPips = (
  tile: Tile,
  anchor: LayoutAnchor,
): readonly Tile["sideA"][] => {
  const candidates: Tile["sideA"][] = [];

  if (tile.sideA === anchor.openPip) {
    candidates.push(tile.sideB);
  }

  if (tile.sideB === anchor.openPip) {
    candidates.push(tile.sideA);
  }

  return Array.from(new Set(candidates));
};

export const resolveMoveIntent = (
  input: ResolveMoveIntentInput,
): ResolveMoveIntentResult => {
  const anchor = input.snapResolution.anchor;

  if (anchor === null) {
    return createFailure(
      "no_snap_target",
      "Dragged tile did not resolve to a legal snap target.",
      input.snapResolution,
    );
  }

  if (input.board.tiles.length === 0 || anchor.ownerTileId === null) {
    return resolveOpeningMoveIntent(input);
  }

  const tile = input.tileCatalog[input.draggedTileId];

  if (!tile) {
    return createFailure(
      "tile_not_found",
      "Tile is not present in the tile catalog.",
      input.snapResolution,
    );
  }

  const candidateOutwardPips = getCandidateOutwardPips(tile, anchor);

  if (candidateOutwardPips.length === 0) {
    return createFailure(
      "illegal_orientation",
      "Dragged tile does not satisfy the snapped anchor's open pip.",
      input.snapResolution,
    );
  }

  for (const openPipFacingOutward of candidateOutwardPips) {
    const validationResult = validateFivesMove({
      board: input.board,
      handTileIds: input.handTileIds,
      tileCatalog: input.tileCatalog,
      intent: {
        tileId: input.draggedTileId,
        side: anchor.direction,
        openPipFacingOutward,
      },
      requiresOpeningDouble: false,
    });

    if (!validationResult.validation.ok) {
      continue;
    }

    return {
      ok: true,
      action: "submit",
      intent: {
        kind: "play_tile",
        gameId: input.gameId,
        roundId: input.roundId,
        playerId: input.playerId,
        variant: "fives",
        expectedEventSeq: input.expectedEventSeq,
        idempotencyKey: input.idempotencyKey,
        tileId: validationResult.validation.value.tileId,
        side: validationResult.validation.value.side,
        openPipFacingOutward: validationResult.validation.value.openPipFacingOutward,
        anchorId: toMoveIntentAnchorId(anchor),
      },
      legalMove: validationResult.validation.value,
      snapResolution: input.snapResolution,
    };
  }

  const validationResult = validateFivesMove({
    board: input.board,
    handTileIds: input.handTileIds,
    tileCatalog: input.tileCatalog,
    intent: {
      tileId: input.draggedTileId,
      side: anchor.direction,
      openPipFacingOutward: tile.sideA,
    },
    requiresOpeningDouble: false,
  });

  const validation = validationResult.validation;
  return createFailure(
    validation.ok === true
      ? "illegal_orientation"
      : validation.code,
    validation.ok === true
      ? "Dragged tile resolved to an invalid orientation."
      : validation.message,
    input.snapResolution,
  );
};
