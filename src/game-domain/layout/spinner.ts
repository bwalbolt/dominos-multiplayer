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
  const spinnerId = board.spinnerTileId;
  if (!spinnerId) {
    return { up: false, down: false };
  }

  // Find tiles played off the primary axis (left/right)
  // Note: We check if ANY tile has been played in that direction.
  // In our reconstruction, the first tile's side is 'right' or 'left' 
  // depending on move intent, but usually it grows from center.
  
  const hasLeft = board.tiles.some(t => t.side === "left");
  const hasRight = board.tiles.some(t => t.side === "right");

  return {
    up: hasLeft && hasRight,
    down: hasLeft && hasRight,
  };
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
