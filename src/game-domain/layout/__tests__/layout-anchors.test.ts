import { calculateBoardGeometry } from "../anchors";
import { BoardState, TileId, PlayerId, Tile, DominoPip } from "../../types";

describe("layout-anchors", () => {
  const player1 = "p1" as PlayerId;
  
  const tile1: Tile = { id: "t1" as TileId, sideA: 3 as DominoPip, sideB: 3 as DominoPip }; // Spinner
  const tile2: Tile = { id: "t2" as TileId, sideA: 3 as DominoPip, sideB: 5 as DominoPip };
  const tile3: Tile = { id: "t3" as TileId, sideA: 3 as DominoPip, sideB: 4 as DominoPip };

  it("should place the first tile at (0,0)", () => {
    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: tile1.id,
      openEnds: [
        { side: "left", pip: 3, tileId: tile1.id },
        { side: "right", pip: 3, tileId: tile1.id },
        { side: "up", pip: 3, tileId: tile1.id },
        { side: "down", pip: 3, tileId: tile1.id }
      ],
      tiles: [
        { tile: tile1, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 3 }
      ]
    };

    const geometry = calculateBoardGeometry(board);
    expect(geometry.placedTiles).toHaveLength(1);
    expect(geometry.placedTiles[0].center).toEqual({ x: 0, y: 0 });
    expect(geometry.placedTiles[0].rotationDeg).toBe(0); // Double is vertical
    expect(geometry.placedTiles[0].width).toBe(56);
    expect(geometry.placedTiles[0].height).toBe(112);
  });

  it("should place subsequent tiles correctly", () => {
      // Setup: 3|3 at root, 3|5 played on right
      const board: BoardState = {
        layoutDirection: "horizontal",
        spinnerTileId: tile1.id,
        openEnds: [
          { side: "left", pip: 3, tileId: tile1.id },
          { side: "right", pip: 5, tileId: tile2.id },
          { side: "up", pip: 3, tileId: tile1.id },
          { side: "down", pip: 3, tileId: tile1.id }
        ],
        tiles: [
          { tile: tile1, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 3 },
          { tile: tile2, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 5 }
        ]
      };

      const geometry = calculateBoardGeometry(board);
      expect(geometry.placedTiles).toHaveLength(2);
      
      const g2 = geometry.placedTiles.find(t => t.tileId === "t2");
      expect(g2).toBeDefined();
      // t1 is vertical (width 56). its right edge is at x=28.
      // t2 is horizontal (width 112). center is 28 + 56 = 84.
      expect(g2?.center.x).toBe(84);
      expect(g2?.center.y).toBe(0);
      expect(g2?.rotationDeg).toBe(270); // sideA (3) inward -> sideA on left
  });

  it("should place vertical branch tiles correctly", () => {
    // Setup: 3|3 at root, 3|4 played on up
    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: tile1.id,
      openEnds: [
        { side: "left", pip: 3, tileId: tile1.id },
        { side: "right", pip: 3, tileId: tile1.id },
        { side: "up", pip: 4, tileId: tile3.id },
        { side: "down", pip: 3, tileId: tile1.id }
      ],
      tiles: [
        { tile: tile1, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 3 },
        { tile: tile3, playedBy: player1, placedAtSeq: 2, side: "up", openPipFacingOutward: 4 }
      ]
    };

    const geometry = calculateBoardGeometry(board);
    expect(geometry.placedTiles).toHaveLength(2);
    
    const g3 = geometry.placedTiles.find(t => t.tileId === "t3");
    expect(g3).toBeDefined();
    // t1 is vertical (height 112). its top edge is at y=-56.
    // t3 is vertical (height 112). center is -56 - 56 = -112.
    expect(g3?.center.x).toBe(0);
    expect(g3?.center.y).toBe(-112);
    // direction 'up', inward sideA (3) -> sideA on bottom -> orientation 'down' (180)
    expect(g3?.rotationDeg).toBe(180);
  });
});
