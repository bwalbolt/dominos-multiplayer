import {
  resolveOpponentLaunchTileIndex,
  resolveOpponentPendingDrawTileIndex,
  shouldHideOpponentLaunchTile,
  shouldHideOpponentTile,
} from "../opponent-hand.utils";

describe("opponent hand utils", () => {
  it("uses the center tile as the launch source, with even hands choosing the left-middle tile", () => {
    expect(resolveOpponentLaunchTileIndex(1)).toBe(0);
    expect(resolveOpponentLaunchTileIndex(4)).toBe(1);
    expect(resolveOpponentLaunchTileIndex(5)).toBe(2);
  });

  it("hides only the representative launch tile while preserving the rest of the row", () => {
    expect(
      [0, 1, 2, 3].filter((index) =>
        shouldHideOpponentLaunchTile(index, 4, true),
      ),
    ).toEqual([1]);
    expect(
      [0, 1, 2, 3].filter((index) =>
        shouldHideOpponentLaunchTile(index, 4, false),
      ),
    ).toEqual([]);
  });

  it("uses the rightmost slot as the reserved draw target", () => {
    expect(resolveOpponentPendingDrawTileIndex(1)).toBe(0);
    expect(resolveOpponentPendingDrawTileIndex(4)).toBe(3);
    expect(resolveOpponentPendingDrawTileIndex(7)).toBe(6);
  });

  it("hides the reserved draw slot independently from the launch source", () => {
    expect(
      [0, 1, 2, 3].filter((index) =>
        shouldHideOpponentTile(index, 4, {
          isLaunchingTile: false,
          pendingDrawTileIndex: 3,
        }),
      ),
    ).toEqual([3]);
  });

  it("supports launch-source hiding and pending-draw hiding without collisions", () => {
    expect(
      [0, 1, 2, 3].filter((index) =>
        shouldHideOpponentTile(index, 4, {
          isLaunchingTile: true,
          pendingDrawTileIndex: 3,
        }),
      ),
    ).toEqual([1, 3]);
  });
});
