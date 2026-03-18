import {
  handPanIntentThresholds,
  resolveHandPanIntent,
} from "../hand-pan-intent";

describe("resolveHandPanIntent", () => {
  it("activates drag for a clear upward pull", () => {
    expect(
      resolveHandPanIntent({
        translationX: handPanIntentThresholds.directionBias,
        translationY: -(
          handPanIntentThresholds.verticalActivationDistance +
          handPanIntentThresholds.directionBias
        ),
      }),
    ).toBe("activate_drag");
  });

  it("yields to hand scrolling for a clear horizontal swipe", () => {
    expect(
      resolveHandPanIntent({
        translationX:
          handPanIntentThresholds.horizontalYieldDistance +
          handPanIntentThresholds.directionBias,
        translationY: -handPanIntentThresholds.directionBias,
      }),
    ).toBe("yield_to_scroll");
  });

  it("waits while movement is still ambiguous", () => {
    expect(
      resolveHandPanIntent({
        translationX: handPanIntentThresholds.directionBias,
        translationY: -handPanIntentThresholds.directionBias,
      }),
    ).toBe("wait");
  });
});
