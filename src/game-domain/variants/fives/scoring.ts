import type { BoardState, TileId } from "../../types";

/**
 * Calculates the score for a given board state in Fives.
 * Scoring occurs when the sum of all open ends is a multiple of 5.
 *
 * @param board The current state of the board
 * @returns The score awarded (multiple of 5, or 0)
 */
export const calculateFivesBoardScore = (board: BoardState): number => {
  if (board.tiles.length === 0) {
    return 0;
  }

  const spinnerTileId = board.spinnerTileId;
  const numSpinnerBranches = spinnerTileId
    ? new Set(
        board.tiles
          .filter((t) => t.tile.id !== spinnerTileId)
          .map((t) => t.side),
      ).size
    : 0;

  let totalPips = 0;
  const processedTiles = new Set<TileId>();

  for (const oe of board.openEnds) {
    if (oe.tileId === null) continue;
    if (processedTiles.has(oe.tileId)) continue;

    const playedTile = board.tiles.find((t) => t.tile.id === oe.tileId);
    if (!playedTile) continue;

    const tile = playedTile.tile;
    const isDouble = tile.sideA === tile.sideB;

    if (oe.tileId === spinnerTileId) {
      if (numSpinnerBranches < 2) {
        totalPips += tile.sideA * 2;
      }
      processedTiles.add(oe.tileId);
    } else if (isDouble) {
      // Non-spinner double at an end always has exactly 1 branch
      totalPips += tile.sideA * 2;
      processedTiles.add(oe.tileId);
    } else {
      totalPips += oe.pip;
    }
  }

  if (totalPips > 0 && totalPips % 5 === 0) {
    return totalPips;
  }

  return 0;
};
