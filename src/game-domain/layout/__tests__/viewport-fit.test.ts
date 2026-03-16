import {
  computeBoardBounds,
  computeFitTransform,
  computePlayableBounds,
} from "../viewport";
import { LayoutAnchor, PlacedTileGeometry, Rect, Size } from "../types";

describe("viewport-fit", () => {
  describe("computeBoardBounds", () => {
    it("should return zero bounds for empty tiles", () => {
      expect(computeBoardBounds([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it("should compute correct bounds for a single tile", () => {
      const tiles: PlacedTileGeometry[] = [
        {
          tileId: "1" as any,
          value1: 1,
          value2: 1,
          center: { x: 0, y: 0 },
          rotationDeg: 0,
          width: 56,
          height: 112,
          placedAtSeq: 1,
          logicalSide: "left",
          heading: "up",
        },
      ];
      expect(computeBoardBounds(tiles)).toEqual({
        x: -28,
        y: -56,
        width: 56,
        height: 112,
      });
    });

    it("should compute correct bounds for multiple tiles", () => {
      const tiles: PlacedTileGeometry[] = [
        {
          tileId: "1" as any,
          value1: 1,
          value2: 1,
          center: { x: 0, y: 0 },
          rotationDeg: 0,
          width: 56,
          height: 112,
          placedAtSeq: 1,
          logicalSide: "left",
          heading: "up",
        },
        {
          tileId: "2" as any,
          value1: 1,
          value2: 2,
          center: { x: 84, y: 0 },
          rotationDeg: 90,
          width: 112,
          height: 56,
          placedAtSeq: 2,
          logicalSide: "right",
          heading: "right",
        },
      ];
      expect(computeBoardBounds(tiles)).toEqual({
        x: -28,
        y: -56,
        width: 168,
        height: 112,
      });
    });
  });

  describe("computePlayableBounds", () => {
    it("reserves space for a full next play at open anchors", () => {
      const tiles: PlacedTileGeometry[] = [
        {
          tileId: "1" as any,
          value1: 6,
          value2: 6,
          center: { x: 0, y: 0 },
          rotationDeg: 0,
          width: 56,
          height: 112,
          placedAtSeq: 1,
          logicalSide: "left",
          heading: "up",
        },
      ];
      const anchors: LayoutAnchor[] = [
        {
          id: "1-right",
          ownerTileId: "1" as any,
          attachmentPoint: { x: 28, y: 0 },
          direction: "right",
          openPip: 6,
        },
      ];

      expect(computePlayableBounds(tiles, anchors)).toEqual({
        x: -28,
        y: -56,
        width: 168,
        height: 112,
      });
    });
  });

  describe("computeFitTransform", () => {
    const viewport: Size = { width: 400, height: 800 };
    const padding = 20;

    it("should center empty board in viewport at capped scale", () => {
      const bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      expect(transform.scale).toBe(1);
      expect(transform.translateX).toBe(200);
      expect(transform.translateY).toBe(400);
    });

    it("should fit a large board by zooming out", () => {
      const bounds: Rect = { x: 0, y: 0, width: 1000, height: 2000 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      expect(transform.scale).toBeCloseTo(400 / 1040, 4);
      expect(transform.translateX).toBeCloseTo(200 - (500 * transform.scale), 1);
      expect(transform.translateY).toBeCloseTo(400 - (1000 * transform.scale), 1);
    });

    it("should clamp a small board to the max scale ceiling", () => {
      const bounds: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      expect(transform.scale).toBe(1);
      expect(transform.translateX).toBe(150);
      expect(transform.translateY).toBe(350);
    });

    it("should handle board not centered at (0,0)", () => {
      const bounds: Rect = { x: 100, y: 200, width: 100, height: 100 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      expect(transform.scale).toBe(1);
      expect(transform.translateX).toBe(50);
      expect(transform.translateY).toBe(150);
    });

    it("fits directly to the playable snap-slot bounds", () => {
      const narrowViewport: Size = { width: 200, height: 800 };
      const playableBounds: Rect = { x: -28, y: -56, width: 168, height: 112 };
      const transform = computeFitTransform(playableBounds, narrowViewport, padding);

      expect(transform.scale).toBeCloseTo(200 / 208, 4);
      expect(transform.translateX).toBeCloseTo(46.15, 1);
      expect(transform.translateY).toBe(400);
    });
  });
});
