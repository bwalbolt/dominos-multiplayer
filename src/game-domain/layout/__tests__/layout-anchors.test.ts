import { calculateBoardGeometry, solveBoardLayout } from "../anchors";
import { BoardState, TileId, PlayerId, Tile, DominoPip } from "../../types";

describe("layout-anchors", () => {
  const player1 = "p1" as PlayerId;
  
  const tile1: Tile = { id: "t1" as TileId, sideA: 3 as DominoPip, sideB: 3 as DominoPip }; // Spinner
  const tile2: Tile = { id: "t2" as TileId, sideA: 3 as DominoPip, sideB: 5 as DominoPip };
  const tile3: Tile = { id: "t3" as TileId, sideA: 3 as DominoPip, sideB: 4 as DominoPip };
  const tile4: Tile = { id: "t4" as TileId, sideA: 1 as DominoPip, sideB: 4 as DominoPip };
  const tile5: Tile = { id: "t5" as TileId, sideA: 1 as DominoPip, sideB: 0 as DominoPip };

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

  it("keeps a later-round non-spinner root aligned to its open left and right pips", () => {
    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: null,
      openEnds: [
        { side: "left", pip: 1, tileId: tile4.id },
        { side: "right", pip: 4, tileId: tile4.id },
      ],
      tiles: [
        { tile: tile4, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 1 },
      ],
    };

    const solution = solveBoardLayout(board, {
      viewport: { width: 640, height: 240 },
      padding: 56,
    });
    const root = solution.geometry.placedTiles.find((tile) => tile.tileId === tile4.id);

    expect(root?.rotationDeg).toBe(270);
  });

  it("keeps the mirrored line root stable after the matching side is covered", () => {
    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: null,
      openEnds: [
        { side: "left", pip: 0, tileId: tile5.id },
        { side: "right", pip: 4, tileId: tile4.id },
      ],
      tiles: [
        { tile: tile4, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 1 },
        { tile: tile5, playedBy: player1, placedAtSeq: 2, side: "left", openPipFacingOutward: 0 },
      ],
    };

    const solution = solveBoardLayout(board, {
      viewport: { width: 640, height: 240 },
      padding: 56,
    });
    const root = solution.geometry.placedTiles.find((tile) => tile.tileId === tile4.id);
    const leftArm = solution.geometry.placedTiles.find((tile) => tile.tileId === tile5.id);

    expect(root?.rotationDeg).toBe(270);
    expect(leftArm?.center.x).toBeLessThan(root?.center.x ?? 0);
  });

  it("keeps a later spinner on the played end instead of inserting it into the middle", () => {
    const openingTile: Tile = {
      id: "opening" as TileId,
      sideA: 3 as DominoPip,
      sideB: 5 as DominoPip,
    };
    const bridgeTile: Tile = {
      id: "bridge" as TileId,
      sideA: 2 as DominoPip,
      sideB: 5 as DominoPip,
    };
    const spinnerTile: Tile = {
      id: "spinner" as TileId,
      sideA: 2 as DominoPip,
      sideB: 2 as DominoPip,
    };

    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: spinnerTile.id,
      openEnds: [
        { side: "left", pip: 3, tileId: openingTile.id },
        { side: "right", pip: 2, tileId: spinnerTile.id },
        { side: "up", pip: 2, tileId: spinnerTile.id },
        { side: "down", pip: 2, tileId: spinnerTile.id },
      ],
      tiles: [
        {
          tile: openingTile,
          playedBy: player1,
          placedAtSeq: 1,
          side: "left",
          openPipFacingOutward: 3,
        },
        {
          tile: bridgeTile,
          playedBy: player1,
          placedAtSeq: 2,
          side: "right",
          openPipFacingOutward: 2,
        },
        {
          tile: spinnerTile,
          playedBy: player1,
          placedAtSeq: 3,
          side: "right",
          openPipFacingOutward: 2,
        },
      ],
    };

    const solution = solveBoardLayout(board, {
      viewport: { width: 640, height: 240 },
      padding: 56,
    });
    const opening = solution.geometry.placedTiles.find((tile) => tile.tileId === openingTile.id);
    const bridge = solution.geometry.placedTiles.find((tile) => tile.tileId === bridgeTile.id);
    const spinner = solution.geometry.placedTiles.find((tile) => tile.tileId === spinnerTile.id);

    expect(bridge?.rotationDeg).toBe(90);
    expect(opening?.rotationDeg).toBe(270);
    expect(spinner?.center.x).toBeGreaterThan(bridge?.center.x ?? 0);
    expect(bridge?.center.x).toBeGreaterThan(opening?.center.x ?? 0);
    expect((spinner?.center.x ?? 0) - (bridge?.center.x ?? 0)).toBe(84);
    expect((bridge?.center.x ?? 0) - (opening?.center.x ?? 0)).toBe(112);
  });
});
