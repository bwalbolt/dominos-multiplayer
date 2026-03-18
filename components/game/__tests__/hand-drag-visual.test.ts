import { TileId } from "@/src/game-domain/types";

import {
  createSourceDragTileVisual,
  projectBoardPointToScreen,
  resolveDraggedTileVisual,
} from "../hand-drag-visual";

describe("hand drag visual helpers", () => {
  it("projects board points into screen coordinates", () => {
    expect(
      projectBoardPointToScreen(
        { x: 100, y: 50 },
        { scale: 0.75, translateX: 24, translateY: -8 },
        { x: 16, y: 32 },
      ),
    ).toEqual({ x: 115, y: 61.5 });
  });

  it("uses board projection for snapped drag visuals", () => {
    const visual = resolveDraggedTileVisual({
      sourceRect: { x: 200, y: 300, width: 47.6, height: 99.45 },
      dragScreenPosition: { x: 260, y: 360 },
      fallbackVisual: null,
      previewGeometry: {
        tileId: "tile-6-5" as TileId,
        value1: 6,
        value2: 5,
        center: { x: 140, y: 60 },
        rotationDeg: 90,
        width: 112,
        height: 56,
        placedAtSeq: Number.MAX_SAFE_INTEGER,
        logicalSide: "right",
        heading: "right",
      },
      cameraTransform: { scale: 0.75, translateX: 24, translateY: -8 },
      containerOffset: { x: 16, y: 32 },
      isSnapped: true,
    });

    expect(visual).not.toBeNull();
    expect(visual?.left).toBeCloseTo(103);
    expect(visual?.top).toBeCloseTo(48);
    expect(visual?.scale).toBeCloseTo(0.75);
    expect(visual?.orientation).toBe("right");
  });

  it("falls back to the source tile metrics for free dragging", () => {
    const visual = resolveDraggedTileVisual({
      sourceRect: { x: 120, y: 200, width: 47.6, height: 99.45 },
      dragScreenPosition: { x: 180, y: 260 },
      fallbackVisual: null,
      previewGeometry: null,
      cameraTransform: { scale: 1, translateX: 0, translateY: 0 },
      containerOffset: { x: 0, y: 0 },
      isSnapped: false,
    });
    const sourceVisual = createSourceDragTileVisual({
      x: 120,
      y: 200,
      width: 47.6,
      height: 99.45,
    });

    expect(visual).not.toBeNull();
    expect(visual?.left).toBeCloseTo(156.2);
    expect(visual?.top).toBeCloseTo(210.275);
    expect(visual?.scale).toBeCloseTo(sourceVisual.scale);
    expect(visual?.orientation).toBe("up");
  });

  it("keeps following the finger when a projected target exists but a hard snap does not", () => {
    const visual = resolveDraggedTileVisual({
      sourceRect: { x: 120, y: 200, width: 47.6, height: 99.45 },
      dragScreenPosition: { x: 180, y: 260 },
      fallbackVisual: null,
      previewGeometry: {
        tileId: "tile-6-5" as TileId,
        value1: 6,
        value2: 5,
        center: { x: 140, y: 60 },
        rotationDeg: 90,
        width: 112,
        height: 56,
        placedAtSeq: Number.MAX_SAFE_INTEGER,
        logicalSide: "right",
        heading: "right",
      },
      cameraTransform: { scale: 0.75, translateX: 24, translateY: -8 },
      containerOffset: { x: 16, y: 32 },
      isSnapped: false,
    });

    expect(visual).not.toBeNull();
    expect(visual?.left).toBeCloseTo(156.2);
    expect(visual?.top).toBeCloseTo(210.275);
    expect(visual?.orientation).toBe("up");
  });

  it("uses the fallback visual before a free drag receives its first update", () => {
    const fallbackVisual = {
      left: 120,
      top: 200,
      scale: 0.85,
      orientation: "up" as const,
    };

    expect(
      resolveDraggedTileVisual({
        sourceRect: { x: 120, y: 200, width: 47.6, height: 99.45 },
        dragScreenPosition: null,
        fallbackVisual,
        previewGeometry: null,
        cameraTransform: { scale: 1, translateX: 0, translateY: 0 },
        containerOffset: { x: 0, y: 0 },
        isSnapped: false,
      }),
    ).toEqual(fallbackVisual);
  });
});
