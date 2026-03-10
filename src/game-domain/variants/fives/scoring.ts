import type { BoardState, ChainSide, DominoPip } from "../../types";
import { getFivesSpinnerBranchStatus } from "./legal-moves";

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

  const branchStatus = getFivesSpinnerBranchStatus(board);
  const openEndsBySide = Object.fromEntries(
    board.openEnds.map((oe) => [oe.side, oe.pip]),
  ) as Partial<Record<ChainSide, DominoPip>>;

  let totalPips = 0;

  // We only sum pips for sides that are currently "open" for play.
  // This correctly handles the spinner behavior:
  // - If it's the first tile (spinner), only left/right are open.
  // - Once both arms exist, up/down also become open.
  if (branchStatus.left === "open" && openEndsBySide.left !== undefined) {
    totalPips += openEndsBySide.left;
  }
  if (branchStatus.right === "open" && openEndsBySide.right !== undefined) {
    totalPips += openEndsBySide.right;
  }
  if (branchStatus.up === "open" && openEndsBySide.up !== undefined) {
    totalPips += openEndsBySide.up;
  }
  if (branchStatus.down === "open" && openEndsBySide.down !== undefined) {
    totalPips += openEndsBySide.down;
  }

  // Special case: if there's only one tile and it's a double, totalPips will be pip*2.
  // However, reconstruction.ts creates 4 open ends for a double.
  // getFivesSpinnerBranchStatus handles this by only marking left/right as open.
  // So for a 5-5 opening move: left=5, right=5, total=10. Scores 10.
  // For a 6-6 opening move: left=6, right=6, total=12. Scores 0.

  if (totalPips > 0 && totalPips % 5 === 0) {
    return totalPips;
  }

  return 0;
};
