import { computeBoardBounds, computeFitTransform } from "../viewport";
import { PlacedTileGeometry, Rect, Size } from "../types";

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
        },
        {
          tileId: "2" as any,
          value1: 1,
          value2: 2,
          center: { x: 84, y: 0 },
          rotationDeg: 90,
          width: 112,
          height: 56,
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

  describe("computeFitTransform", () => {
    const viewport: Size = { width: 400, height: 800 };
    const padding = 20;

    it("should center empty board in viewport at capped scale", () => {
      const bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      const expectedScale = 117 / 112; // MAX_DOMINO_RENDER_HEIGHT / domino.height
      // Rounded in implementation to 4 places
      expect(transform.scale).toBeCloseTo(expectedScale, 4);
      expect(transform.translateX).toBe(200);
      expect(transform.translateY).toBe(400);
    });

    it("should fit a large board by zooming out", () => {
      const bounds: Rect = { x: 0, y: 0, width: 1000, height: 2000 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      expect(transform.scale).toBe(0.36);
      expect(transform.translateX).toBe(200 - (500 * 0.36));
      expect(transform.translateY).toBe(400 - (1000 * 0.36));
    });

    it("should clamp a small board to the max scale ceiling", () => {
      const bounds: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      const expectedScale = 117 / 112; 
      expect(transform.scale).toBeCloseTo(expectedScale, 4);
      expect(transform.translateX).toBeCloseTo(200 - 50 * expectedScale, 1);
      expect(transform.translateY).toBeCloseTo(400 - 50 * expectedScale, 1);
    });

    it("should handle board not centered at (0,0)", () => {
      const bounds: Rect = { x: 100, y: 200, width: 100, height: 100 };
      const transform = computeFitTransform(bounds, viewport, padding);
      
      const expectedScale = 117 / 112; 
      expect(transform.scale).toBeCloseTo(expectedScale, 4);
      expect(transform.translateX).toBeCloseTo(200 - 150 * expectedScale, 1);
      expect(transform.translateY).toBeCloseTo(400 - 250 * expectedScale, 1);
    });
  });
});
