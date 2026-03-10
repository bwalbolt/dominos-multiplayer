import { deriveViewportState } from "../viewport-policy";
import { PlacedTileGeometry, Size } from "../types";
import { TileId } from "../../types";

describe("viewport-focus", () => {
  const viewport: Size = { width: 400, height: 800 };
  const padding = 20;
  
  const tiles: PlacedTileGeometry[] = [
    {
      tileId: "tile-1" as TileId,
      value1: 1,
      value2: 1,
      center: { x: 100, y: 100 },
      rotationDeg: 0,
      width: 56,
      height: 112,
    },
    {
      tileId: "tile-2" as TileId,
      value1: 1,
      value2: 2,
      center: { x: 200, y: 200 },
      rotationDeg: 90,
      width: 112,
      height: 56,
    },
  ];

  it("should return default focus target (board center) if no last move provided", () => {
    const state = deriveViewportState(tiles, viewport, padding);
    expect(state.focusTarget).not.toBeNull();
    expect(state.focusTarget?.type).toBe("default");
    // Combined range: X [72, 256], Y [44, 228]
    // Center: (164, 136)
    expect(state.focusTarget?.center.x).toBeCloseTo(164, 0);
    expect(state.focusTarget?.center.y).toBeCloseTo(136, 0);
  });

  it("should return focus target for the last move tile", () => {
    const state = deriveViewportState(tiles, viewport, padding, {
      lastMoveTileId: "tile-2" as TileId,
    });

    expect(state.focusTarget).not.toBeNull();
    expect(state.focusTarget?.tileId).toBe("tile-2");
    expect(state.focusTarget?.center).toEqual({ x: 200, y: 200 });
    expect(state.focusTarget?.type).toBe("last-move");
  });

  it("should return focus target with turn-change type if flag is set", () => {
    const state = deriveViewportState(tiles, viewport, padding, {
      lastMoveTileId: "tile-1" as TileId,
      isTurnChange: true,
    });

    expect(state.focusTarget?.type).toBe("turn-change");
  });

  it("should return default focus target if tileId not found", () => {
    const state = deriveViewportState(tiles, viewport, padding, {
      lastMoveTileId: "non-existent" as TileId,
    });
    expect(state.focusTarget?.type).toBe("default");
  });
});
