import { domino } from "@/theme/tokens";

import {
  buildDominoTileDepthFillPath,
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

  it("cuts the faux depth fill out of the tile body silhouette", () => {
    const path = buildDominoTileDepthFillPath(
      0,
      0,
      domino.width,
      domino.height,
      domino.depthOffset,
      domino.borderRadius,
    ).replace(/\s+/g, " ");

    expect(path).toContain(`V ${domino.height + domino.depthOffset - domino.borderRadius}`);
    expect(path).toContain(`H ${domino.width - domino.borderRadius}`);
    expect(path).toContain(`M 0,${domino.height - domino.borderRadius}`);
    expect(path).toContain(`Q 0,${domino.height} ${domino.borderRadius},${domino.height}`);
    expect(path).toContain(`Q ${domino.width},${domino.height} ${domino.width},${domino.height - domino.borderRadius}`);
  });
});
