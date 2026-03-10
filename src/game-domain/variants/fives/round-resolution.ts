import type {
  PlayerHandState,
  PlayerId,
  RoundResult,
  RoundState,
  Tile,
  TileId,
} from "../../types";
import { evaluateFivesLegalMoves } from "./legal-moves";

/**
 * Calculates the total pip count of tiles in a player's hand.
 */
export const calculateHandPipTotal = (
  hand: PlayerHandState,
  tileCatalog: Readonly<Record<TileId, Tile>>,
): number => {
  return hand.tileIds.reduce((sum, tileId) => {
    const tile = tileCatalog[tileId];
    return sum + (tile ? tile.sideA + tile.sideB : 0);
  }, 0);
};

/**
 * Rounds a score to the nearest multiple of 5, which is standard in Fives.
 */
export const roundToNearestFive = (value: number): number => {
  return Math.round(value / 5) * 5;
};

/**
 * Evaluates if the current round has ended and determines the result.
 */
export const evaluateRoundResolution = (
  round: RoundState,
  tileCatalog: Readonly<Record<TileId, Tile>>,
): RoundResult | null => {
  const players = Object.keys(round.handsByPlayerId) as PlayerId[];

  // 1. Check for "Domino" (someone emptied their hand)
  const winnerById = players.find(
    (playerId) => round.handsByPlayerId[playerId].tileIds.length === 0,
  );

  if (winnerById) {
    const loserId = players.find((id) => id !== winnerById)!;
    const loserPips = calculateHandPipTotal(
      round.handsByPlayerId[loserId],
      tileCatalog,
    );

    return {
      winnerPlayerId: winnerById,
      reason: "domino",
      scoreAwarded: roundToNearestFive(loserPips),
    };
  }

  // 2. Check for "Blocked"
  // A round is blocked if the boneyard is empty AND no player can make a move.
  if (round.boneyard.remainingCount === 0) {
    const playerMoves = players.map((playerId) =>
      evaluateFivesLegalMoves({
        board: round.board,
        handTileIds: round.handsByPlayerId[playerId].tileIds,
        tileCatalog,
        isOpeningMove: false, // If it's blocked, it's definitely not the opening move
      }),
    );

    const hasNoLegalMoves = playerMoves.every(
      (evalResult) => evalResult.moves.length === 0,
    );

    if (hasNoLegalMoves) {
      // Find the player who played the last tile to use as a tie-breaker
      const lastPlayedTile = [...round.board.tiles].sort(
        (a, b) => b.placedAtSeq - a.placedAtSeq,
      )[0];
      const lastPlayerId = lastPlayedTile?.playedBy ?? null;

      // Round is blocked. Winner is the player with fewer pips.
      const playerPips = players.map((playerId) => ({
        playerId,
        pips: calculateHandPipTotal(
          round.handsByPlayerId[playerId],
          tileCatalog,
        ),
      }));

      // Sort by pips ascending
      playerPips.sort((a, b) => a.pips - b.pips);

      const winner = playerPips[0];
      const loser = playerPips[1];

      // If it's a tie, the player who played the last domino wins (with 0 score)
      // to determine who goes first next round.
      if (winner.pips === loser.pips) {
        return {
          winnerPlayerId: lastPlayerId,
          reason: "blocked",
          scoreAwarded: 0,
        };
      }

      // According to spec: "use standard pip-difference scoring"
      return {
        winnerPlayerId: winner.playerId,
        reason: "blocked",
        scoreAwarded: roundToNearestFive(loser.pips - winner.pips),
      };
    }
  }

  return null;
};

/**
 * Checks if a player has reached the target win score (100).
 */
export const checkGameWinner = (
  playerScores: Readonly<Record<PlayerId, number>>,
  targetScore: number = 100,
): PlayerId | null => {
  for (const [playerId, score] of Object.entries(playerScores)) {
    if (score >= targetScore) {
      return playerId as PlayerId;
    }
  }
  return null;
};
