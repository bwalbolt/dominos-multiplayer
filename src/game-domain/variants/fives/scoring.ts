import type { BoardState, TileId } from "../../types";
import { getSpinnerConnectedSideCount } from "../../util/spinner";

/**
 * Calculates the score for a given board state in Fives.
 * Scoring occurs when the sum of all open ends is a multiple of 5.
 *
 * @param board The current state of the board
 * @returns The score awarded (multiple of 5, or 0)
 */
/**
 * Calculates the total pips on all open ends of the board.
 * This is the value used to determine if a score should be awarded in Fives.
 *
 * @param board The current state of the board
 * @returns The total sum of pips on open ends
 */
export const calculateOpenEndsTotal = (board: BoardState): number => {
  if (board.tiles.length === 0) {
    return 0;
  }

  const spinnerTileId = board.spinnerTileId;
  const spinnerConnectedSideCount = getSpinnerConnectedSideCount(board);
  let totalPips = 0;
  const processedNonSpinnerDoubles = new Set<TileId>();

  for (const oe of board.openEnds) {
    if (oe.tileId === null) continue;

    const playedTile = board.tiles.find((t) => t.tile.id === oe.tileId);
    if (!playedTile) continue;

    const tile = playedTile.tile;
    const isDouble = tile.sideA === tile.sideB;

    if (oe.tileId === spinnerTileId) {
      continue;
    }

    if (isDouble) {
      // Non-spinner double at an end always has exactly 1 branch
      if (processedNonSpinnerDoubles.has(oe.tileId)) {
        continue;
      }

      totalPips += tile.sideA * 2;
      processedNonSpinnerDoubles.add(oe.tileId);
    } else {
      totalPips += oe.pip;
    }
  }

  if (spinnerTileId !== null && spinnerConnectedSideCount < 2) {
    const spinnerTile = board.tiles.find((tile) => tile.tile.id === spinnerTileId);

    if (spinnerTile) {
      totalPips += spinnerTile.tile.sideA * 2;
    }
  }

  return totalPips;
};

/**
 * Calculates the score for a given board state in Fives.
 * Scoring occurs when the sum of all open ends is a multiple of 5.
 *
 * @param board The current state of the board
 * @returns The score awarded (multiple of 5, or 0)
 */
export const calculateFivesBoardScore = (board: BoardState): number => {
  const totalPips = calculateOpenEndsTotal(board);

  if (totalPips > 0 && totalPips % 5 === 0) {
    return totalPips;
  }

  return 0;
};

