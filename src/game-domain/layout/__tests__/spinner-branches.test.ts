import { calculateBoardGeometry } from "../anchors";
import { BoardState, TileId, PlayerId, Tile, DominoPip } from "../../types";

describe("spinner-branches", () => {
  const player1 = "p1" as PlayerId;
  
  const tile1: Tile = { id: "t1" as TileId, sideA: 3 as DominoPip, sideB: 3 as DominoPip }; // Spinner
  const tile2: Tile = { id: "t2" as TileId, sideA: 3 as DominoPip, sideB: 5 as DominoPip };
  const tile3: Tile = { id: "t3" as TileId, sideA: 3 as DominoPip, sideB: 4 as DominoPip };
  const tile4: Tile = { id: "t4" as TileId, sideA: 1 as DominoPip, sideB: 6 as DominoPip };
  const tile5: Tile = { id: "t5" as TileId, sideA: 6 as DominoPip, sideB: 6 as DominoPip };

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

  it("keeps later doubles on a line board as regular arm tiles", () => {
    const rootTile: Tile = { id: "root" as TileId, sideA: 5 as DominoPip, sideB: 4 as DominoPip };
    const laterDouble: Tile = { id: "double" as TileId, sideA: 4 as DominoPip, sideB: 4 as DominoPip };

    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: null,
      openEnds: [
        { side: "left", pip: 5, tileId: rootTile.id },
        { side: "right", pip: 4, tileId: laterDouble.id },
      ],
      tiles: [
        { tile: rootTile, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 5 },
        { tile: laterDouble, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 4 },
      ],
    };

    const geometry = calculateBoardGeometry(board);

    expect(geometry.anchors).toHaveLength(2);
    expect(geometry.anchors.some((anchor) => anchor.direction === "up")).toBe(false);
    expect(geometry.anchors.some((anchor) => anchor.direction === "down")).toBe(false);
  });

  it("keeps up/down anchors hidden until a later spinner has both left and right connections", () => {
    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: tile5.id,
      openEnds: [
        { side: "left", pip: 1, tileId: tile4.id },
        { side: "right", pip: 6, tileId: tile5.id },
        { side: "up", pip: 6, tileId: tile5.id },
        { side: "down", pip: 6, tileId: tile5.id },
      ],
      tiles: [
        { tile: tile4, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 1 },
        { tile: tile5, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 6 },
      ],
    };

    const geometry = calculateBoardGeometry(board);

    expect(geometry.anchors.some((anchor) => anchor.direction === "left")).toBe(true);
    expect(geometry.anchors.some((anchor) => anchor.direction === "right")).toBe(true);
    expect(geometry.anchors.some((anchor) => anchor.direction === "up")).toBe(false);
    expect(geometry.anchors.some((anchor) => anchor.direction === "down")).toBe(false);
  });

  it("shows up/down anchors once a later spinner has left and right connections", () => {
    const branchTile: Tile = { id: "t6" as TileId, sideA: 2 as DominoPip, sideB: 6 as DominoPip };
    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: tile5.id,
      openEnds: [
        { side: "left", pip: 1, tileId: tile4.id },
        { side: "right", pip: 2, tileId: branchTile.id },
        { side: "up", pip: 6, tileId: tile5.id },
        { side: "down", pip: 6, tileId: tile5.id },
      ],
      tiles: [
        { tile: tile4, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 1 },
        { tile: tile5, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 6 },
        { tile: branchTile, playedBy: player1, placedAtSeq: 3, side: "right", openPipFacingOutward: 2 },
      ],
    };

    const geometry = calculateBoardGeometry(board);

    expect(geometry.anchors.some((anchor) => anchor.direction === "up")).toBe(true);
    expect(geometry.anchors.some((anchor) => anchor.direction === "down")).toBe(true);
  });
});
