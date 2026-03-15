import type { BoardOpenEnd, BoardState } from "../types";

const getSpinnerPlayedTile = (board: BoardState) => {
  const spinnerId = board.spinnerTileId;
  if (!spinnerId) {
    return null;
  }

  return board.tiles.find((tile) => tile.tile.id === spinnerId) ?? null;
};

export function getSpinnerBranchUnlocks(board: BoardState): {
  readonly up: boolean;
  readonly down: boolean;
} {
  const spinnerTile = getSpinnerPlayedTile(board);
  if (!spinnerTile) {
    return { up: false, down: false };
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

  return {
    up: hasLeft && hasRight,
    down: hasLeft && hasRight,
  };
}

export function getSpinnerConnectedSideCount(board: BoardState): number {
  const spinnerTile = getSpinnerPlayedTile(board);
  if (!spinnerTile) {
    return 0;
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

  return Number(hasLeft) + Number(hasRight);
}

export function getActiveBoardOpenEnds(
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
