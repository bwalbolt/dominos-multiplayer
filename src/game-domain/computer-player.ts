import type {
  BoardState,
  FivesLegalMove,
  PlayerId,
  ReconstructionState,
  Tile,
} from "./types";
import {
  evaluateFivesLegalMoves,
  calculateFivesBoardScore,
} from "./variants/fives";
import { getInitialOpenEndsForTile, upsertOpenEnd } from "./util/board";

export type ComputerAction =
  | { kind: "play"; move: FivesLegalMove }
  | { kind: "draw" }
  | { kind: "pass" };

const getTilePipTotal = (tile: Tile): number => tile.sideA + tile.sideB;

const getNextPlacedAtSeq = (board: BoardState): number =>
  board.tiles.reduce(
    (maxPlacedAtSeq, playedTile) =>
      Math.max(maxPlacedAtSeq, playedTile.placedAtSeq),
    0,
  ) + 1;

/**
 * PROJECTS a move on the board to calculate what the board will look like.
 */
const projectMoveOnBoard = (
  board: BoardState,
  move: FivesLegalMove,
  tile: Tile,
  playerId: PlayerId,
): BoardState => {
  const playedTile = {
    tile,
    playedBy: playerId,
    // Preserve later-spinner behavior during scoring by projecting the move
    // with the same relative sequence ordering reconstruct() would assign.
    placedAtSeq: getNextPlacedAtSeq(board),
    side: move.side,
    openPipFacingOutward: move.openPipFacingOutward,
  };

  const boardTiles =
    move.side === "left"
      ? [playedTile, ...board.tiles]
      : [...board.tiles, playedTile];
  const isFirstDouble =
    board.spinnerTileId === null && tile.sideA === tile.sideB;
  const nextSpinnerTileId = isFirstDouble ? tile.id : board.spinnerTileId;

  if (boardTiles.length === 1) {
    return {
      ...board,
      spinnerTileId: nextSpinnerTileId,
      openEnds: getInitialOpenEndsForTile(
        tile,
        move.side,
        move.openPipFacingOutward,
      ),
      tiles: boardTiles,
    };
  }

  return {
    ...board,
    spinnerTileId: nextSpinnerTileId,
    openEnds: isFirstDouble
      ? [
          ...upsertOpenEnd(board.openEnds, {
            side: move.side,
            pip: move.openPipFacingOutward,
            tileId: tile.id,
          }),
          {
            side: "up",
            pip: tile.sideA,
            tileId: tile.id,
          },
          {
            side: "down",
            pip: tile.sideA,
            tileId: tile.id,
          },
        ]
      : upsertOpenEnd(board.openEnds, {
          side: move.side,
          pip: move.openPipFacingOutward,
          tileId: tile.id,
        }),
    tiles: boardTiles,
  };
};

/**
 * Evaluates the next action for a computer player in a deterministic way.
 * Follows Fives rules:
 * 1. If any playable move scores, choose the move that yields the highest immediate score.
 * 2. If multiple moves have the same highest score, choose the one with the lowest total pip value (tie-breaker).
 * 3. If no playable move scores, choose the playable move whose tile has the lowest total pip value.
 * 4. If no playable move exists:
 *    - If boneyard is not empty, draw a tile.
 *    - If boneyard is empty, pass the turn.
 */
export const getComputerAction = (
  reconstruction: ReconstructionState,
  playerId: PlayerId,
): ComputerAction => {
  const { game, tileCatalog } = reconstruction;

  if (
    !game ||
    !game.currentRound ||
    game.status !== "active" ||
    game.currentRound.status !== "active"
  ) {
    throw new Error("Cannot get computer action: Game or round is not active");
  }

  const round = game.currentRound;
  const hand = round.handsByPlayerId[playerId];
  if (!hand) {
    throw new Error(
      `Cannot get computer action: Hand for player ${playerId} not found`,
    );
  }

  const evaluation = evaluateFivesLegalMoves({
    board: round.board,
    handTileIds: hand.tileIds,
    tileCatalog,
    requiresOpeningDouble: round.roundNumber === 1 && round.board.tiles.length === 0,
  });

  if (evaluation.moves.length > 0) {
    let bestMoves: FivesLegalMove[] = [];
    let maxScore = -1;

    for (const move of evaluation.moves) {
      const tile = tileCatalog[move.tileId];
      if (!tile) continue;

      const projectedBoard = projectMoveOnBoard(
        round.board,
        move,
        tile,
        playerId,
      );
      const score = calculateFivesBoardScore(projectedBoard);

      if (score > maxScore) {
        maxScore = score;
        bestMoves = [move];
      } else if (score === maxScore) {
        bestMoves.push(move);
      }
    }

    // Sort best moves by pip total (lower is better as a tie-breaker)
    bestMoves.sort((a, b) => {
      const tileA = tileCatalog[a.tileId]!;
      const tileB = tileCatalog[b.tileId]!;
      const pipsA = getTilePipTotal(tileA);
      const pipsB = getTilePipTotal(tileB);
      if (pipsA !== pipsB) {
        return pipsA - pipsB;
      }
      // Stable sort by tileId and side if still tied
      if (a.tileId !== b.tileId) {
        return a.tileId.localeCompare(b.tileId);
      }
      return a.side.localeCompare(b.side);
    });

    return { kind: "play", move: bestMoves[0] };
  }

  // 2. No legal moves, draw if boneyard is not empty
  if (round.boneyard.remainingCount > 0) {
    return { kind: "draw" };
  }

  // 3. No legal moves and empty boneyard, pass
  return { kind: "pass" };
};
