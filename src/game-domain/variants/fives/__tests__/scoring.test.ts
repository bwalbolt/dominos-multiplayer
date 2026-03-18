import type {
  BoardState,
  DominoPip,
  EventId,
  GameId,
  PlayerId,
  RoundId,
  RoundState,
  Tile,
  TileId,
} from "../../../types";
import {
  createTargetScoreGameEndedEvent,
  evaluateRoundResolution,
} from "../round-resolution";
import {
  calculateFivesBoardScore,
  calculateFivesScoringTotal,
  getFivesScoringPipContributions,
} from "../scoring";

describe("Fives Scoring & Resolution", () => {
  const tileCatalog: Record<TileId, Tile> = {
    ["tile-6-6" as TileId]: { id: "tile-6-6" as TileId, sideA: 6, sideB: 6 },
    ["tile-5-5" as TileId]: { id: "tile-5-5" as TileId, sideA: 5, sideB: 5 },
    ["tile-6-4" as TileId]: { id: "tile-6-4" as TileId, sideA: 6, sideB: 4 },
    ["tile-5-0" as TileId]: { id: "tile-5-0" as TileId, sideA: 5, sideB: 0 },
    ["tile-1-1" as TileId]: { id: "tile-1-1" as TileId, sideA: 1, sideB: 1 },
    ["tile-3-6" as TileId]: { id: "tile-3-6" as TileId, sideA: 3, sideB: 6 },
  };

  describe("Board Scoring", () => {
    it("should score 10 for a 5-5 opening move", () => {
      const board: BoardState = {
        layoutDirection: "horizontal",
        spinnerTileId: "tile-5-5" as TileId,
        openEnds: [
          { side: "left", pip: 5 as DominoPip, tileId: "tile-5-5" as TileId },
          { side: "right", pip: 5 as DominoPip, tileId: "tile-5-5" as TileId },
        ],
        tiles: [
          {
            tile: tileCatalog["tile-5-5" as TileId],
            playedBy: "p1" as any,
            placedAtSeq: 1,
            side: "left",
            openPipFacingOutward: 5,
          },
        ],
      };
      expect(calculateFivesBoardScore(board)).toBe(10);
    });

    it("should score 15 if open ends sum to 15", () => {
      const board: BoardState = {
        layoutDirection: "horizontal",
        spinnerTileId: "tile-5-5" as TileId,
        openEnds: [
          { side: "left", pip: 5 as DominoPip, tileId: "t1" as TileId },
          { side: "right", pip: 5 as DominoPip, tileId: "t2" as TileId },
          { side: "up", pip: 5 as DominoPip, tileId: "t3" as TileId },
        ],
        tiles: [
          {
            tile: tileCatalog["tile-5-5" as TileId],
            playedBy: "p1" as any,
            placedAtSeq: 1,
            side: "left",
            openPipFacingOutward: 5,
          },
          {
            tile: { id: "t1", sideA: 5, sideB: 0 } as any,
            playedBy: "p1" as any,
            placedAtSeq: 2,
            side: "left",
            openPipFacingOutward: 5,
          },
          {
            tile: { id: "t2", sideA: 5, sideB: 0 } as any,
            playedBy: "p2" as any,
            placedAtSeq: 3,
            side: "right",
            openPipFacingOutward: 5,
          },
          {
            tile: { id: "t3", sideA: 5, sideB: 0 } as any,
            playedBy: "p1" as any,
            placedAtSeq: 4,
            side: "up",
            openPipFacingOutward: 5,
          },
        ],
      };
      // Note: scoring logic uses getFivesSpinnerBranchStatus to decide which ends are open.
      // If up is open, it means left and right must have been played.
      expect(calculateFivesBoardScore(board)).toBe(15);
    });

    it("should score 0 if sum is not a multiple of 5", () => {
      const board: BoardState = {
        layoutDirection: "horizontal",
        spinnerTileId: null,
        openEnds: [
          { side: "left", pip: 6 as DominoPip, tileId: "t1" as any },
          { side: "right", pip: 6 as DominoPip, tileId: "t2" as any },
        ],
        tiles: [
          {
            tile: tileCatalog["tile-6-6" as TileId],
            playedBy: "p1" as any,
            placedAtSeq: 1,
            side: "left",
            openPipFacingOutward: 6,
          },
        ],
      };
      expect(calculateFivesBoardScore(board)).toBe(0);
    });

    it("keeps counting a 6-6 spinner as 12 until it has connections on two sides", () => {
      const board: BoardState = {
        layoutDirection: "horizontal",
        spinnerTileId: "tile-6-6" as TileId,
        openEnds: [
          { side: "left", pip: 3 as DominoPip, tileId: "tile-3-6" as TileId },
          { side: "right", pip: 6 as DominoPip, tileId: "tile-6-6" as TileId },
          { side: "up", pip: 6 as DominoPip, tileId: "tile-6-6" as TileId },
          { side: "down", pip: 6 as DominoPip, tileId: "tile-6-6" as TileId },
        ],
        tiles: [
          {
            tile: tileCatalog["tile-3-6" as TileId],
            playedBy: "p1" as any,
            placedAtSeq: 1,
            side: "left",
            openPipFacingOutward: 3,
          },
          {
            tile: tileCatalog["tile-6-6" as TileId],
            playedBy: "p2" as any,
            placedAtSeq: 2,
            side: "right",
            openPipFacingOutward: 6,
          },
        ],
      };

      expect(getFivesScoringPipContributions(board)).toEqual([3, 12]);
      expect(calculateFivesScoringTotal(board)).toBe(15);
      expect(calculateFivesBoardScore(board)).toBe(15);
    });

    it("keeps unlocked spinner up/down branches playable without counting them for score", () => {
      const board: BoardState = {
        layoutDirection: "horizontal",
        spinnerTileId: "tile-6-6" as TileId,
        openEnds: [
          { side: "left", pip: 2 as DominoPip, tileId: "tile-2-6" as TileId },
          { side: "right", pip: 1 as DominoPip, tileId: "tile-1-6" as TileId },
          { side: "up", pip: 6 as DominoPip, tileId: "tile-6-6" as TileId },
          { side: "down", pip: 6 as DominoPip, tileId: "tile-6-6" as TileId },
        ],
        tiles: [
          {
            tile: { id: "tile-2-6" as TileId, sideA: 2, sideB: 6 },
            playedBy: "p1" as any,
            placedAtSeq: 1,
            side: "left",
            openPipFacingOutward: 2,
          },
          {
            tile: tileCatalog["tile-6-6" as TileId],
            playedBy: "p2" as any,
            placedAtSeq: 2,
            side: "right",
            openPipFacingOutward: 6,
          },
          {
            tile: { id: "tile-1-6" as TileId, sideA: 1, sideB: 6 },
            playedBy: "p1" as any,
            placedAtSeq: 3,
            side: "right",
            openPipFacingOutward: 1,
          },
        ],
      };

      expect(getFivesScoringPipContributions(board)).toEqual([2, 1]);
      expect(calculateFivesScoringTotal(board)).toBe(3);
      expect(calculateFivesBoardScore(board)).toBe(0);
    });
  });

  describe("Round Resolution", () => {
    const baseRound: RoundState = {
      roundId: "r1" as any,
      roundNumber: 1,
      status: "active",
      board: {
        layoutDirection: "horizontal",
        spinnerTileId: null,
        openEnds: [],
        tiles: [],
      },
      boneyard: { remainingTileIds: [], remainingCount: 0 },
      handsByPlayerId: {
        ["p1" as PlayerId]: {
          playerId: "p1" as PlayerId,
          tileIds: [],
          handCount: 0,
          pipTotal: 0,
          hasPlayableTile: false,
        },
        ["p2" as PlayerId]: {
          playerId: "p2" as PlayerId,
          tileIds: ["tile-6-4" as TileId],
          handCount: 1,
          pipTotal: 10,
          hasPlayableTile: false,
        },
      } as Record<PlayerId, any>,
      result: null,
      startedAt: "",
      endedAt: null,
    };

    it("should detect Domino winner", () => {
      const result = evaluateRoundResolution(baseRound, tileCatalog);
      expect(result?.winnerPlayerId).toBe("p1");
      expect(result?.reason).toBe("domino");
      expect(result?.scoreAwarded).toBe(10); // p2 has 6+4=10
    });

    it("should detect Blocked winner and use pip-difference", () => {
      const blockedRound: RoundState = {
        ...baseRound,
        handsByPlayerId: {
          ["p1" as PlayerId]: {
            playerId: "p1" as PlayerId,
            tileIds: ["tile-1-1" as TileId],
            handCount: 1,
            pipTotal: 2,
            hasPlayableTile: false,
          },
          ["p2" as PlayerId]: {
            playerId: "p2" as PlayerId,
            tileIds: ["tile-6-6" as TileId],
            handCount: 1,
            pipTotal: 12,
            hasPlayableTile: false,
          },
        } as Record<PlayerId, any>,
        board: {
          layoutDirection: "horizontal",
          spinnerTileId: null,
          openEnds: [
            { side: "left", pip: 3 as DominoPip, tileId: "any" as any },
            { side: "right", pip: 3 as DominoPip, tileId: "any" as any },
          ],
          tiles: [
            {
              tile: { id: "last", sideA: 3, sideB: 3 } as any,
              playedBy: "p1" as any,
              placedAtSeq: 5,
              side: "left",
              openPipFacingOutward: 3,
            },
          ],
        },
      };

      const result = evaluateRoundResolution(blockedRound, tileCatalog);
      expect(result?.winnerPlayerId).toBe("p1");
      expect(result?.reason).toBe("blocked");
      expect(result?.scoreAwarded).toBe(10); // nearest 5 to (12 - 2)
    });

    it("should apply tie-breaker rule for blocked rounds with equal pips", () => {
      const tiedRound: RoundState = {
        ...baseRound,
        handsByPlayerId: {
          ["p1" as PlayerId]: {
            playerId: "p1" as PlayerId,
            tileIds: ["tile-5-5" as TileId],
            handCount: 1,
            pipTotal: 10,
            hasPlayableTile: false,
          },
          ["p2" as PlayerId]: {
            playerId: "p2" as PlayerId,
            tileIds: ["tile-5-5" as TileId],
            handCount: 1,
            pipTotal: 10,
            hasPlayableTile: false,
          },
        } as Record<PlayerId, any>,
        board: {
          layoutDirection: "horizontal",
          spinnerTileId: null,
          openEnds: [
            { side: "left", pip: 1 as DominoPip, tileId: "any" as any },
            { side: "right", pip: 1 as DominoPip, tileId: "any" as any },
          ],
          tiles: [
            {
              tile: { id: "t1", sideA: 1, sideB: 1 } as any,
              playedBy: "p2" as any,
              placedAtSeq: 10,
              side: "left",
              openPipFacingOutward: 1,
            },
          ],
        },
      };

      const result = evaluateRoundResolution(tiedRound, tileCatalog);
      expect(result?.winnerPlayerId).toBe("p2"); // p2 made the last move
      expect(result?.reason).toBe("blocked");
      expect(result?.scoreAwarded).toBe(0);
    });
  });

  describe("Target Score Completion", () => {
    it("creates a GAME_ENDED event as soon as a score snapshot reaches the target", () => {
      const result = createTargetScoreGameEndedEvent({
        eventId: "ev-9" as EventId,
        gameId: "game-1" as GameId,
        eventSeq: 9,
        occurredAt: "2026-03-16T12:00:00.000Z",
        roundId: "round-2" as RoundId,
        playerScores: {
          ["p1" as PlayerId]: 100,
          ["p2" as PlayerId]: 85,
        },
      });

      expect(result).toEqual({
        eventId: "ev-9",
        gameId: "game-1",
        eventSeq: 9,
        type: "GAME_ENDED",
        version: 1,
        occurredAt: "2026-03-16T12:00:00.000Z",
        roundId: "round-2",
        winnerPlayerId: "p1",
        reason: "target_score_reached",
        finalScoreByPlayerId: {
          p1: 100,
          p2: 85,
        },
      });
    });

    it("does not create a GAME_ENDED event before the target is reached", () => {
      const result = createTargetScoreGameEndedEvent({
        eventId: "ev-10" as EventId,
        gameId: "game-1" as GameId,
        eventSeq: 10,
        occurredAt: "2026-03-16T12:00:01.000Z",
        roundId: "round-2" as RoundId,
        playerScores: {
          ["p1" as PlayerId]: 95,
          ["p2" as PlayerId]: 90,
        },
      });

      expect(result).toBeNull();
    });
  });
});
