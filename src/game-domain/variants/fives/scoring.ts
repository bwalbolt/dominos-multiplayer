import type { BoardState, TileId } from "../../types";
import { getSpinnerConnectedSideCount } from "../../util/spinner";

/**
 * Returns the pip contributions that count toward the Fives board total.
 * `board.openEnds` tracks structural/playable branches, so an unlocked spinner
 * may expose playable up/down branches that still contribute 0 by themselves.
 * Until the spinner has connections on both its left and right sides, the
 * untouched spinner counts once as a doubled value instead.
 *
 * @param board The current state of the board
 * @returns The individual pip contributions used to determine Fives scoring
 */
export const getFivesScoringPipContributions = (
  board: BoardState,
): readonly number[] => {
  if (board.tiles.length === 0) {
    return [];
  }

  const spinnerTileId = board.spinnerTileId;
  const spinnerConnectedSideCount = getSpinnerConnectedSideCount(board);
  const pipContributions: number[] = [];
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

      pipContributions.push(tile.sideA * 2);
      processedNonSpinnerDoubles.add(oe.tileId);
    } else {
      pipContributions.push(oe.pip);
    }
  }

  if (spinnerTileId !== null && spinnerConnectedSideCount < 2) {
    const spinnerTile = board.tiles.find((tile) => tile.tile.id === spinnerTileId);

    if (spinnerTile) {
      pipContributions.push(spinnerTile.tile.sideA * 2);
    }
  }

  return pipContributions;
};

/**
 * Calculates the total pips that count toward the Fives board total.
 * This is the sum used to determine whether the board scores.
 *
 * @param board The current state of the board
 * @returns The total sum of scoring pips
 */
export const calculateFivesScoringTotal = (board: BoardState): number =>
  getFivesScoringPipContributions(board).reduce((total, pipCount) => total + pipCount, 0);

/**
 * @deprecated Use calculateFivesScoringTotal to make the rule-specific semantics explicit.
 */
export const calculateOpenEndsTotal = calculateFivesScoringTotal;

/**
 * Calculates the score awarded for the current board state in Fives.
 * Scoring occurs when the board total is a multiple of 5.
 *
 * @param board The current state of the board
 * @returns The score awarded (multiple of 5, or 0)
 */
export const calculateFivesBoardScore = (board: BoardState): number => {
  const totalPips = calculateFivesScoringTotal(board);

  if (totalPips > 0 && totalPips % 5 === 0) {
    return totalPips;
  }

  return 0;
};
