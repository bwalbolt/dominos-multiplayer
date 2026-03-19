import {
  resolveOpponentLaunchTileIndex,
  shouldHideOpponentLaunchTile,
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
});
