import type {
  BoardState,
  ChainSide,
  DominoPip,
  FivesLegalMove,
  FivesSpinnerBranchStatus,
  Tile,
  TileId,
} from "../../types";

const CHAIN_SIDES: readonly ChainSide[] = ["left", "right", "up", "down"];

type EvaluateFivesLegalMovesInput = Readonly<{
  board: BoardState;
  handTileIds: readonly TileId[];
  tileCatalog: Readonly<Record<TileId, Tile>>;
  requiresOpeningDouble: boolean;
}>;

export type FivesLegalMoveEvaluation = Readonly<{
  moves: readonly FivesLegalMove[];
  requiredOpeningTileId: TileId | null;
  spinnerBranches: FivesSpinnerBranchStatus;
}>;

const byDescendingDoubleValue = (left: Tile, right: Tile): number => {
  if (left.sideA !== right.sideA) {
    return right.sideA - left.sideA;
  }

  return left.id.localeCompare(right.id);
};

const getHighestDoubleInHand = (
  handTileIds: readonly TileId[],
  tileCatalog: Readonly<Record<TileId, Tile>>,
): Tile | null => {
  const doubles = handTileIds
    .map((tileId) => tileCatalog[tileId])
    .filter((tile): tile is Tile => Boolean(tile) && tile.sideA === tile.sideB)
    .sort(byDescendingDoubleValue);

  return doubles[0] ?? null;
};

const getOpenEndsBySide = (board: BoardState): Partial<Record<ChainSide, DominoPip>> =>
  Object.fromEntries(board.openEnds.map((openEnd) => [openEnd.side, openEnd.pip])) as Partial<
    Record<ChainSide, DominoPip>
  >;

const createClosedBranchStatus = (): FivesSpinnerBranchStatus => ({
  left: "closed",
  right: "closed",
  up: "closed",
  down: "closed",
});

export const getFivesSpinnerBranchStatus = (
  board: BoardState,
): FivesSpinnerBranchStatus => {
  const openEndsBySide = getOpenEndsBySide(board);
  const hasSpinner = board.spinnerTileId !== null;

  if (!hasSpinner) {
    return {
      left: openEndsBySide.left === undefined ? "closed" : "open",
      right: openEndsBySide.right === undefined ? "closed" : "open",
      up: "closed",
      down: "closed",
    };
  }

  const nonSpinnerTiles = board.tiles.filter(
    (playedTile) => playedTile.tile.id !== board.spinnerTileId,
  );
  const hasLeftArm = nonSpinnerTiles.some((playedTile) => playedTile.side === "left");
  const hasRightArm = nonSpinnerTiles.some((playedTile) => playedTile.side === "right");
  const spinnerCrossUnlocked = hasLeftArm && hasRightArm;

  return {
    left: openEndsBySide.left === undefined ? "closed" : "open",
    right: openEndsBySide.right === undefined ? "closed" : "open",
    up:
      spinnerCrossUnlocked && openEndsBySide.up !== undefined ? "open" : "closed",
    down:
      spinnerCrossUnlocked && openEndsBySide.down !== undefined ? "open" : "closed",
  };
};

const getPlayableSides = (
  spinnerBranches: FivesSpinnerBranchStatus,
): readonly ChainSide[] =>
  CHAIN_SIDES.filter((side) => spinnerBranches[side] === "open");

const getMovesForOpeningTurn = (
  handTileIds: readonly TileId[],
  tileCatalog: Readonly<Record<TileId, Tile>>,
): FivesLegalMoveEvaluation => {
  const highestDouble = getHighestDoubleInHand(handTileIds, tileCatalog);

  if (!highestDouble) {
    return {
      moves: [],
      requiredOpeningTileId: null,
      spinnerBranches: createClosedBranchStatus(),
    };
  }

  return {
    moves: [
      {
        tileId: highestDouble.id,
        side: "left",
        inwardTileSide: "sideA",
        openPipFacingOutward: highestDouble.sideA,
      },
    ],
    requiredOpeningTileId: highestDouble.id,
    spinnerBranches: createClosedBranchStatus(),
  };
};

const getMovesForEmptyBoard = (
  handTileIds: readonly TileId[],
  tileCatalog: Readonly<Record<TileId, Tile>>,
): FivesLegalMoveEvaluation => {
  const moves: FivesLegalMove[] = [];

  for (const tileId of handTileIds) {
    const tile = tileCatalog[tileId];

    if (!tile) {
      continue;
    }

    moves.push({
      tileId,
      side: "left",
      inwardTileSide: "sideA",
      openPipFacingOutward: tile.sideB,
    });

    if (tile.sideA !== tile.sideB) {
      moves.push({
        tileId,
        side: "left",
        inwardTileSide: "sideB",
        openPipFacingOutward: tile.sideA,
      });
    }
  }

  return {
    moves,
    requiredOpeningTileId: null,
    spinnerBranches: createClosedBranchStatus(),
  };
};

const getMovesForBoardState = (
  board: BoardState,
  handTileIds: readonly TileId[],
  tileCatalog: Readonly<Record<TileId, Tile>>,
): FivesLegalMoveEvaluation => {
  const spinnerBranches = getFivesSpinnerBranchStatus(board);
  const playableSides = getPlayableSides(spinnerBranches);
  const openEndsBySide = getOpenEndsBySide(board);
  const moves: FivesLegalMove[] = [];

  for (const tileId of handTileIds) {
    const tile = tileCatalog[tileId];

    if (!tile) {
      continue;
    }

    for (const side of playableSides) {
      const openPip = openEndsBySide[side];

      if (openPip === undefined) {
        continue;
      }

      if (tile.sideA === openPip) {
        moves.push({
          tileId,
          side,
          inwardTileSide: "sideA",
          openPipFacingOutward: tile.sideB,
        });
      }

      if (tile.sideB === openPip && tile.sideA !== tile.sideB) {
        moves.push({
          tileId,
          side,
          inwardTileSide: "sideB",
          openPipFacingOutward: tile.sideA,
        });
      }
    }
  }

  return {
    moves,
    requiredOpeningTileId: null,
    spinnerBranches,
  };
};

export const evaluateFivesLegalMoves = (
  input: EvaluateFivesLegalMovesInput,
): FivesLegalMoveEvaluation => {
  if (input.requiresOpeningDouble) {
    return getMovesForOpeningTurn(input.handTileIds, input.tileCatalog);
  }

  if (input.board.tiles.length === 0) {
    return getMovesForEmptyBoard(input.handTileIds, input.tileCatalog);
  }

  return getMovesForBoardState(input.board, input.handTileIds, input.tileCatalog);
};
