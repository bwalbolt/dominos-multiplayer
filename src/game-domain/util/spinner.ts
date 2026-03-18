import type { BoardOpenEnd, BoardState } from "../types";

const getSpinnerPlayedTile = (board: BoardState) => {
  const spinnerId = board.spinnerTileId;
  if (!spinnerId) {
    return null;
  }

  return board.tiles.find((tile) => tile.tile.id === spinnerId) ?? null;
};

const getSpinnerSideConnections = (
  board: BoardState,
): {
  readonly hasLeft: boolean;
  readonly hasRight: boolean;
} => {
  const spinnerTile = getSpinnerPlayedTile(board);
  if (!spinnerTile) {
    return { hasLeft: false, hasRight: false };
  }

  const nonSpinnerTiles = board.tiles.filter(
    (tile) => tile.tile.id !== spinnerTile.tile.id,
  );
  const spinnerWasPlayedLater = nonSpinnerTiles.some(
    (tile) => tile.placedAtSeq < spinnerTile.placedAtSeq,
  );
  let hasLeft = false;
  let hasRight = false;

  if (spinnerWasPlayedLater) {
    if (spinnerTile.side === "left") {
      hasRight = true;
    } else if (spinnerTile.side === "right") {
      hasLeft = true;
    }
  }

  for (const tile of nonSpinnerTiles) {
    if (spinnerWasPlayedLater && tile.placedAtSeq < spinnerTile.placedAtSeq) {
      continue;
    }

    if (tile.side === "left") {
      hasLeft = true;
    } else if (tile.side === "right") {
      hasRight = true;
    }
  }

  return { hasLeft, hasRight };
};

export function getSpinnerBranchUnlocks(board: BoardState): {
  readonly up: boolean;
  readonly down: boolean;
} {
  const { hasLeft, hasRight } = getSpinnerSideConnections(board);

  return {
    up: hasLeft && hasRight,
    down: hasLeft && hasRight,
  };
}

export function getSpinnerConnectedSideCount(board: BoardState): number {
  const { hasLeft, hasRight } = getSpinnerSideConnections(board);

  return Number(hasLeft) + Number(hasRight);
}

/**
 * Returns the board branches that are legal play targets right now.
 * This is intentionally broader than the set of branches that contribute to
 * the Fives scoring total: unlocked spinner up/down branches are playable, but
 * the spinner faces on those branches do not add score by themselves.
 */
export function getPlayableBoardOpenEnds(
  board: BoardState,
): readonly BoardOpenEnd[] {
  const { up, down } = getSpinnerBranchUnlocks(board);

  return board.openEnds.filter((openEnd) => {
    if (openEnd.side === "up") {
      return up;
    }

    if (openEnd.side === "down") {
      return down;
    }

    return true;
  });
}

/**
 * @deprecated Use getPlayableBoardOpenEnds to make the move-generation intent explicit.
 */
export const getActiveBoardOpenEnds = getPlayableBoardOpenEnds;
