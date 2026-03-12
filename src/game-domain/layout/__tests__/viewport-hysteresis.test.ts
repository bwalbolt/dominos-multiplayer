import { CameraTransform } from "../types";
import { getStableTransform, shouldUpdateTransform } from "../viewport-policy";

describe("viewport-hysteresis", () => {
  const current: CameraTransform = {
    scale: 1.0,
    translateX: 100,
    translateY: 100,
  };

  it("should not update if change is below threshold", () => {
    const next: CameraTransform = {
      scale: 1.02, // 2% change, below 5% threshold
      translateX: 102, // 2px change, below 5px threshold
      translateY: 98, // 2px change, below 5px threshold
    };

    expect(shouldUpdateTransform(next, current)).toBe(false);
  });

  it("should update if scale change exceeds threshold", () => {
    const next: CameraTransform = {
      scale: 1.1, // 10% change
      translateX: 100,
      translateY: 100,
    };

    expect(shouldUpdateTransform(next, current)).toBe(true);
  });

  it("should update if translation change exceeds threshold", () => {
    const next: CameraTransform = {
      scale: 1.0,
      translateX: 110, // 10px change
      translateY: 100,
    };

    expect(shouldUpdateTransform(next, current)).toBe(true);
  });

  describe("getStableTransform", () => {
    it("should return target if significant", () => {
      const target: CameraTransform = {
        scale: 1.2,
        translateX: 100,
        translateY: 100,
      };
      expect(getStableTransform(target, current)).toBe(target);
    });

    it("should return previous if insignificant", () => {
      const target: CameraTransform = {
        scale: 1.01,
        translateX: 101,
        translateY: 101,
      };
      expect(getStableTransform(target, current)).toBe(current);
    });
  });
});
