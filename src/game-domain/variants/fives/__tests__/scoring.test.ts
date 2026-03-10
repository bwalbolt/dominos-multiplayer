import type {
  BoardState,
  DominoPip,
  PlayerId,
  RoundState,
  Tile,
  TileId,
} from "../../../types";
import { evaluateRoundResolution } from "../round-resolution";
import { calculateFivesBoardScore } from "../scoring";

describe("Fives Scoring & Resolution", () => {
  const tileCatalog: Record<TileId, Tile> = {
    ["tile-6-6" as TileId]: { id: "tile-6-6" as TileId, sideA: 6, sideB: 6 },
    ["tile-5-5" as TileId]: { id: "tile-5-5" as TileId, sideA: 5, sideB: 5 },
    ["tile-6-4" as TileId]: { id: "tile-6-4" as TileId, sideA: 6, sideB: 4 },
    ["tile-5-0" as TileId]: { id: "tile-5-0" as TileId, sideA: 5, sideB: 0 },
    ["tile-1-1" as TileId]: { id: "tile-1-1" as TileId, sideA: 1, sideB: 1 },
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
          { side: "left", pip: 5 as DominoPip, tileId: "tile-5-x" as TileId },
          { side: "right", pip: 5 as DominoPip, tileId: "tile-5-y" as TileId },
          { side: "up", pip: 5 as DominoPip, tileId: "tile-5-z" as TileId },
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
            tile: { id: "t1", sideA: 5, sideB: 5 } as any,
            playedBy: "p1" as any,
            placedAtSeq: 2,
            side: "left",
            openPipFacingOutward: 5,
          },
          {
            tile: { id: "t2", sideA: 5, sideB: 5 } as any,
            playedBy: "p2" as any,
            placedAtSeq: 3,
            side: "right",
            openPipFacingOutward: 5,
          },
          {
            tile: { id: "t3", sideA: 5, sideB: 5 } as any,
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
});
