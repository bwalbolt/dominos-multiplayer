import { domino } from "@/theme/tokens";

import {
  clampDominoFlipProgress,
  getDominoTileBodySize,
  getDominoTileFrameSize,
} from "../domino-tile.utils";

describe("domino-tile.utils", () => {
  it("returns vertical body size for upright tiles", () => {
    expect(getDominoTileBodySize("up")).toEqual({
      width: domino.width,
      height: domino.height,
    });
  });

  it("returns horizontal frame size including faux depth", () => {
    expect(getDominoTileFrameSize("left", 0.85)).toEqual({
      width: domino.height * 0.85,
      height: (domino.width + domino.depthOffset) * 0.85,
    });
  });

  it("clamps flip progress into the supported range", () => {
    expect(clampDominoFlipProgress(-1)).toBe(0);
    expect(clampDominoFlipProgress(0.5)).toBe(0.5);
    expect(clampDominoFlipProgress(2)).toBe(1);
  });
});
