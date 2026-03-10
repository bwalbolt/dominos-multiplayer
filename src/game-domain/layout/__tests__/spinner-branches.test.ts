import { calculateBoardGeometry } from "../anchors";
import { BoardState, TileId, PlayerId, Tile, DominoPip } from "../../types";

describe("spinner-branches", () => {
  const player1 = "p1" as PlayerId;
  
  const tile1: Tile = { id: "t1" as TileId, sideA: 3 as DominoPip, sideB: 3 as DominoPip }; // Spinner
  const tile2: Tile = { id: "t2" as TileId, sideA: 3 as DominoPip, sideB: 5 as DominoPip };
  const tile3: Tile = { id: "t3" as TileId, sideA: 3 as DominoPip, sideB: 4 as DominoPip };

  it("should hide up/down anchors if main axis arms are missing", () => {
    // Only spinner played
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
    // Should only have left/right anchors
    expect(geometry.anchors).toHaveLength(2);
    expect(geometry.anchors.some(a => a.direction === "left")).toBe(true);
    expect(geometry.anchors.some(a => a.direction === "right")).toBe(true);
    expect(geometry.anchors.some(a => a.direction === "up")).toBe(false);
    expect(geometry.anchors.some(a => a.direction === "down")).toBe(false);
  });

  it("should show up/down anchors once both left and right arms are played", () => {
    // Spinner + Left arm + Right arm
    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: tile1.id,
      openEnds: [
        { side: "left", pip: 4, tileId: tile3.id },
        { side: "right", pip: 5, tileId: tile2.id },
        { side: "up", pip: 3, tileId: tile1.id },
        { side: "down", pip: 3, tileId: tile1.id }
      ],
      tiles: [
        { tile: tile1, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 3 },
        { tile: tile2, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 5 },
        { tile: tile3, playedBy: player1, placedAtSeq: 3, side: "left", openPipFacingOutward: 4 }
      ]
    };

    const geometry = calculateBoardGeometry(board);
    // Should have all 4 branches
    expect(geometry.anchors).toHaveLength(4);
    expect(geometry.anchors.some(a => a.direction === "up")).toBe(true);
    expect(geometry.anchors.some(a => a.direction === "down")).toBe(true);
  });

  it("should correctly attach up/down branches to the spinner even if it's not the first tile", () => {
    // This tests the branch root logic.
    // In our current reconstruct it's always the first tile, but we should be robust.
    // 5-4 (root) -> 4-4 (spinner, played on right) -> 4-6 (played on up of spinner)
    
    const rootTile: Tile = { id: "root" as TileId, sideA: 5 as DominoPip, sideB: 4 as DominoPip };
    const spinnerTile: Tile = { id: "spin" as TileId, sideA: 4 as DominoPip, sideB: 4 as DominoPip };
    const upTile: Tile = { id: "upT" as TileId, sideA: 4 as DominoPip, sideB: 6 as DominoPip };

    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: spinnerTile.id,
      openEnds: [
        { side: "left", pip: 5, tileId: rootTile.id },
        { side: "right", pip: 4, tileId: spinnerTile.id },
        { side: "up", pip: 6, tileId: upTile.id },
        { side: "down", pip: 4, tileId: spinnerTile.id }
      ],
      tiles: [
        { tile: rootTile, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 5 },
        { tile: spinnerTile, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 4 },
        { tile: upTile, playedBy: player1, placedAtSeq: 3, side: "up", openPipFacingOutward: 6 }
      ]
    };

    const geometry = calculateBoardGeometry(board);
    
    const rootGeom = geometry.placedTiles.find(t => t.tileId === "root")!;
    const spinGeom = geometry.placedTiles.find(t => t.tileId === "spin")!;
    const upGeom = geometry.placedTiles.find(t => t.tileId === "upT")!;

    // root is 5|4 horizontal at 0,0. sideB (4) is on right.
    // width 112. edge at 56.
    expect(rootGeom.center.x).toBe(0);
    
    // spin is 4|4 vertical on the right of root.
    // root right edge is at 56. spin center is 56 + 28 = 84.
    expect(spinGeom.center.x).toBe(84);
    expect(spinGeom.center.y).toBe(0);

    // up branch starts FROM spin (the spinner), not from root.
    // spin top edge is at y = -56. upT center is -56 - 56 = -112.
    expect(upGeom.center.x).toBe(84); // Same X as spinner
    expect(upGeom.center.y).toBe(-112);
  });
});
