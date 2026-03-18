import { calculateBoardGeometry, solveBoardLayout } from "../anchors";
import { computeFitTransform, computePlayableBounds } from "../viewport";
import { BoardState, DominoPip, PlayerId, Tile, TileId } from "../../types";

const player1 = "p1" as PlayerId;

const createTile = (id: string, sideA: DominoPip, sideB: DominoPip): Tile => ({
  id: id as TileId,
  sideA,
  sideB,
});

describe("wrapped board layout", () => {
  it("bends long portrait arms and keeps the layout fully fit", () => {
    const root = createTile("root", 6, 6);
    const left1 = createTile("l1", 6, 5);
    const left2 = createTile("l2", 5, 4);
    const left3 = createTile("l3", 4, 3);
    const left4 = createTile("l4", 3, 2);
    const right1 = createTile("r1", 6, 1);
    const right2 = createTile("r2", 1, 2);
    const right3 = createTile("r3", 2, 3);
    const right4 = createTile("r4", 3, 4);

    const board: BoardState = {
      layoutDirection: "horizontal",
      spinnerTileId: root.id,
      openEnds: [
        { side: "left", pip: 2, tileId: left4.id },
        { side: "right", pip: 4, tileId: right4.id },
        { side: "up", pip: 6, tileId: root.id },
        { side: "down", pip: 6, tileId: root.id },
      ],
      tiles: [
        { tile: root, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 6 },
        { tile: left1, playedBy: player1, placedAtSeq: 2, side: "left", openPipFacingOutward: 5 },
        { tile: right1, playedBy: player1, placedAtSeq: 3, side: "right", openPipFacingOutward: 1 },
        { tile: left2, playedBy: player1, placedAtSeq: 4, side: "left", openPipFacingOutward: 4 },
        { tile: right2, playedBy: player1, placedAtSeq: 5, side: "right", openPipFacingOutward: 2 },
        { tile: left3, playedBy: player1, placedAtSeq: 6, side: "left", openPipFacingOutward: 3 },
        { tile: right3, playedBy: player1, placedAtSeq: 7, side: "right", openPipFacingOutward: 3 },
        { tile: left4, playedBy: player1, placedAtSeq: 8, side: "left", openPipFacingOutward: 2 },
        { tile: right4, playedBy: player1, placedAtSeq: 9, side: "right", openPipFacingOutward: 4 },
      ],
    };

    const viewport = { width: 320, height: 700 };
    const wrappedGeometry = calculateBoardGeometry(board, { viewport, padding: 0 });
    const solution = solveBoardLayout(board, { viewport, padding: 56 });

    const wrappedScale = computeFitTransform(
      computePlayableBounds(wrappedGeometry.placedTiles, wrappedGeometry.anchors),
      viewport,
      0,
    ).scale;

    expect(wrappedScale).toBeLessThanOrEqual(1);
    expect(wrappedGeometry.anchors).toHaveLength(4);
    expect(wrappedGeometry.placedTiles).toHaveLength(9);
    expect(solution.openSlots).toHaveLength(4);
  });
});
