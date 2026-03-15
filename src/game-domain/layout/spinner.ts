import { getSpinnerBranchUnlocks as getSharedSpinnerBranchUnlocks } from "../util/spinner";
import { BoardState, ChainSide, TileId } from "../types";

/**
 * Determines which branches of a spinner are unlocked for playing.
 * In Fives, the up/down branches of the spinner are only available 
 * after both ends of the main (left/right) axis have been played off.
 */
export function getSpinnerBranchUnlocks(board: BoardState): {
  readonly up: boolean;
  readonly down: boolean;
} {
  return getSharedSpinnerBranchUnlocks(board);
}

/**
 * Returns the tile ID that serves as the root for a given chain side.
 * For left/right, it's always the first tile.
 * For up/down, it's the spinner tile.
 */
export function getBranchRootId(board: BoardState, side: ChainSide): TileId | null {
  if (board.tiles.length === 0) return null;

  if (side === "up" || side === "down") {
    return board.spinnerTileId;
  }

  const rootTile = board.tiles.reduce((earliestTile, tile) =>
    tile.placedAtSeq < earliestTile.placedAtSeq ? tile : earliestTile,
  );

  return rootTile.tile.id;
}
