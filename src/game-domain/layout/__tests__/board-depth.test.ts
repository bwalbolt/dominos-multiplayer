import {
  compareBoardTileDepth,
  computeBoardTileStackOrder,
  getBoardTileBottomEdge,
} from "../board-depth";
import { PlacedTileGeometry } from "../types";
import { domino } from "../../../../theme/tokens";
import type { TileId } from "../../types";

const asTileId = (value: string): TileId => value as TileId;

const createPlacedTile = (
  tileId: TileId,
  center: { x: number; y: number },
  rotationDeg: number,
  placedAtSeq: number,
): PlacedTileGeometry => {
  const isVertical = rotationDeg === 0 || rotationDeg === 180;

  return {
    tileId,
    value1: 6,
    value2: 6,
    center,
    rotationDeg,
    width: isVertical ? domino.width : domino.height,
    height: isVertical ? domino.height : domino.width,
    placedAtSeq,
    logicalSide: "right",
    heading: isVertical ? "up" : "right",
  };
};

describe("board-depth", () => {
  it("sorts tiles from back to front using the tile bottom edge", () => {
    const higherTile = createPlacedTile(asTileId("higher"), { x: 0, y: -84 }, 0, 1);
    const lowerTile = createPlacedTile(asTileId("lower"), { x: 0, y: 84 }, 0, 2);

    expect(getBoardTileBottomEdge(higherTile)).toBeLessThan(
      getBoardTileBottomEdge(lowerTile),
    );
    expect(compareBoardTileDepth(higherTile, lowerTile)).toBeLessThan(0);
    expect(computeBoardTileStackOrder([lowerTile, higherTile])).toEqual([
      { tileId: "higher", zIndex: 1 },
      { tileId: "lower", zIndex: 2 },
    ]);
  });

  it("uses center.x and then placedAtSeq as stable tie-breakers", () => {
    const leftTile = createPlacedTile(asTileId("left"), { x: -56, y: 0 }, 90, 3);
    const rightTile = createPlacedTile(asTileId("right"), { x: 56, y: 0 }, 90, 2);
    const laterTile = createPlacedTile(asTileId("later"), { x: 56, y: 0 }, 90, 4);

    expect(compareBoardTileDepth(leftTile, rightTile)).toBeLessThan(0);
    expect(compareBoardTileDepth(rightTile, laterTile)).toBeLessThan(0);
    expect(computeBoardTileStackOrder([laterTile, rightTile, leftTile])).toEqual([
      { tileId: "left", zIndex: 1 },
      { tileId: "right", zIndex: 2 },
      { tileId: "later", zIndex: 3 },
    ]);
  });

  it("uses actual tile height so mixed orientations stack correctly", () => {
    const verticalTile = createPlacedTile(asTileId("vertical"), { x: 0, y: 0 }, 0, 1);
    const horizontalTile = createPlacedTile(
      asTileId("horizontal"),
      { x: 0, y: 10 },
      90,
      2,
    );

    expect(getBoardTileBottomEdge(verticalTile)).toBeGreaterThan(
      getBoardTileBottomEdge(horizontalTile),
    );
    expect(computeBoardTileStackOrder([horizontalTile, verticalTile])).toEqual([
      { tileId: "horizontal", zIndex: 1 },
      { tileId: "vertical", zIndex: 2 },
    ]);
  });

  it("updates stack order when a relayout bends a suffix into a lower row", () => {
    const root = createPlacedTile(asTileId("root"), { x: 0, y: 0 }, 90, 1);
    const rightOneBefore = createPlacedTile(asTileId("right-1"), { x: 84, y: 0 }, 90, 2);
    const rightTwoBefore = createPlacedTile(asTileId("right-2"), { x: 168, y: 0 }, 90, 3);
    const downOne = createPlacedTile(asTileId("down-1"), { x: 0, y: 84 }, 0, 4);

    const beforeOrder = computeBoardTileStackOrder([
      root,
      rightOneBefore,
      rightTwoBefore,
      downOne,
    ]).map((entry) => entry.tileId);

    const rightOneAfter = createPlacedTile(asTileId("right-1"), { x: 84, y: 0 }, 90, 2);
    const rightTwoAfter = createPlacedTile(asTileId("right-2"), { x: 84, y: 84 }, 0, 3);
    const afterOrder = computeBoardTileStackOrder([
      root,
      rightOneAfter,
      rightTwoAfter,
      downOne,
    ]).map((entry) => entry.tileId);

    expect(beforeOrder.indexOf(asTileId("right-2"))).toBeLessThan(
      beforeOrder.indexOf(asTileId("down-1")),
    );
    expect(afterOrder.indexOf(asTileId("right-2"))).toBeGreaterThan(
      afterOrder.indexOf(asTileId("down-1")),
    );
  });
});
