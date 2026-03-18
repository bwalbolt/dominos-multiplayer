import { TileId } from "@/src/game-domain/types";

import {
  findLayoutAnchorForSide,
  createSourceDragTileVisual,
  getDragTileVisualCenter,
  projectBoardPointToScreen,
  projectPlacedTileGeometryToDragVisual,
  resolveDraggedTileVisual,
} from "../hand-drag-visual";
import { LayoutAnchor } from "@/src/game-domain/layout/types";

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
    expect(visual?.top).toBeCloseTo(46.125);
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

  it("converts placed geometry into the shared drag visual contract", () => {
    expect(
      projectPlacedTileGeometryToDragVisual(
        {
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
        { scale: 0.75, translateX: 24, translateY: -8 },
        { x: 16, y: 32 },
      ),
    ).toEqual({
      left: 103,
      top: 46.125,
      scale: 0.75,
      orientation: "right",
    });
  });

  it("keeps doubles vertical in the projected overlay visual", () => {
    const visual = projectPlacedTileGeometryToDragVisual(
      {
        tileId: "tile-6-6" as TileId,
        value1: 6,
        value2: 6,
        center: { x: 100, y: 200 },
        rotationDeg: 0,
        width: 56,
        height: 112,
        placedAtSeq: Number.MAX_SAFE_INTEGER,
        logicalSide: "left",
        heading: "left",
      },
      { scale: 0.5, translateX: 10, translateY: 20 },
      { x: 5, y: 15 },
    );

    expect(visual).toEqual({
      left: 51,
      top: 105.75,
      scale: 0.5,
      orientation: "up",
    });
    expect(getDragTileVisualCenter(visual)).toEqual({ x: 65, y: 135 });
  });

  it("finds the current anchor for a move side", () => {
    const rightAnchor = {
      id: "right",
      ownerTileId: "tile-1-2" as TileId,
      attachmentPoint: { x: 200, y: 100 },
      direction: "right",
      openPip: 4,
    } satisfies LayoutAnchor;
    const upAnchor = {
      id: "up",
      ownerTileId: "tile-3-3" as TileId,
      attachmentPoint: { x: 120, y: 40 },
      direction: "up",
      openPip: 3,
    } satisfies LayoutAnchor;

    expect(findLayoutAnchorForSide([rightAnchor, upAnchor], "up")).toBe(upAnchor);
    expect(findLayoutAnchorForSide([rightAnchor, upAnchor], "left")).toBeNull();
  });
});
