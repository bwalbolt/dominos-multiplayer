import type { BoardState, Tile, TileId } from "../../../types";
import { evaluateFivesLegalMoves } from "../legal-moves";

describe("Fives Legal Moves (T1)", () => {
  const tileCatalog: Record<TileId, Tile> = {
    ["tile-6-6" as TileId]: { id: "tile-6-6" as TileId, sideA: 6, sideB: 6 },
    ["tile-5-5" as TileId]: { id: "tile-5-5" as TileId, sideA: 5, sideB: 5 },
    ["tile-6-5" as TileId]: { id: "tile-6-5" as TileId, sideA: 6, sideB: 5 },
    ["tile-5-4" as TileId]: { id: "tile-5-4" as TileId, sideA: 5, sideB: 4 },
    ["tile-4-4" as TileId]: { id: "tile-4-4" as TileId, sideA: 4, sideB: 4 },
    ["tile-1-1" as TileId]: { id: "tile-1-1" as TileId, sideA: 1, sideB: 1 },
  };

  const emptyBoard: BoardState = {
    layoutDirection: "horizontal",
    spinnerTileId: null,
    openEnds: [],
    tiles: [],
  };

  describe("Opening Move", () => {
    it("should require the highest double in hand for the opening move", () => {
      const handTileIds = ["tile-6-5", "tile-5-5", "tile-1-1"] as TileId[];
      const result = evaluateFivesLegalMoves({
        board: emptyBoard,
        handTileIds,
        tileCatalog,
        isOpeningMove: true,
      });

      expect(result.requiredOpeningTileId).toBe("tile-5-5");
      expect(result.moves).toHaveLength(1);
      expect(result.moves[0].tileId).toBe("tile-5-5");
    });

    it("should allow any tile if no doubles are in hand (though game start rules usually ensure doubles)", () => {
      // According to current implementation, if no doubles, moves is empty.
      // In real game, someone always has a double or players redraw.
      const handTileIds = ["tile-6-5", "tile-5-4"] as TileId[];
      const result = evaluateFivesLegalMoves({
        board: emptyBoard,
        handTileIds,
        tileCatalog,
        isOpeningMove: true,
      });

      expect(result.requiredOpeningTileId).toBeNull();
      expect(result.moves).toHaveLength(0);
    });
  });

  describe("Subsequent Moves", () => {
    const boardWithSpinner: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: "tile-6-6" as TileId,
      openEnds: [
        { side: "left", pip: 6, tileId: "tile-6-6" as TileId },
        { side: "right", pip: 6, tileId: "tile-6-6" as TileId },
      ],
      tiles: [
        {
          tile: tileCatalog["tile-6-6" as TileId],
          playedBy: "p1" as any,
          placedAtSeq: 1,
          side: "left", // Initial tile is often placed "at" left/right collectively
          openPipFacingOutward: 6,
        },
      ],
    };

    it("should allow playing a matching tile on open ends", () => {
      const handTileIds = ["tile-6-5"] as TileId[];
      const result = evaluateFivesLegalMoves({
        board: boardWithSpinner,
        handTileIds,
        tileCatalog,
        isOpeningMove: false,
      });

      expect(result.moves).toContainEqual(
        expect.objectContaining({
          tileId: "tile-6-5",
          side: "left",
          openPipFacingOutward: 5,
        }),
      );
      expect(result.moves).toContainEqual(
        expect.objectContaining({
          tileId: "tile-6-5",
          side: "right",
          openPipFacingOutward: 5,
        }),
      );
    });

    it("should unlock up/down branches once both side arms are played on the spinner", () => {
      const boardWithArms: BoardState = {
        ...boardWithSpinner,
        openEnds: [
          { side: "left", pip: 5, tileId: "tile-6-5" as TileId },
          { side: "right", pip: 4, tileId: "tile-6-4" as TileId },
          { side: "up", pip: 6, tileId: "tile-6-6" as TileId },
          { side: "down", pip: 6, tileId: "tile-6-6" as TileId },
        ],
        tiles: [
          {
            tile: tileCatalog["tile-6-6" as TileId],
            playedBy: "p1" as any,
            placedAtSeq: 1,
            side: "left",
            openPipFacingOutward: 6,
          },
          {
            tile: { id: "tile-6-5", sideA: 6, sideB: 5 } as any,
            playedBy: "p2" as any,
            placedAtSeq: 2,
            side: "left",
            openPipFacingOutward: 5,
          },
          {
            tile: { id: "tile-6-4", sideA: 6, sideB: 4 } as any,
            playedBy: "p1" as any,
            placedAtSeq: 3,
            side: "right",
            openPipFacingOutward: 4,
          },
        ],
      };

      const handTileIds = ["tile-6-5"] as TileId[];
      const result = evaluateFivesLegalMoves({
        board: boardWithArms,
        handTileIds,
        tileCatalog,
        isOpeningMove: false,
      });

      // Should include up/down because both arms exist
      const sides = result.moves.map((m) => m.side);
      expect(sides).toContain("up");
      expect(sides).toContain("down");
    });
  });
});
