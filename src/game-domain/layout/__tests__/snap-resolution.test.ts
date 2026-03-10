import { TileId } from "../../types";
import { resolveSnapTarget } from "../snap";
import { LayoutAnchor, Point } from "../types";

describe("snap-resolution", () => {
  const t1 = "t1" as TileId;
  const t2 = "t2" as TileId;

  const anchors: LayoutAnchor[] = [
    {
      id: "left",
      ownerTileId: t1,
      attachmentPoint: { x: -28, y: 0 },
      direction: "left",
      openPip: 3,
    },
    {
      id: "right",
      ownerTileId: t1,
      attachmentPoint: { x: 28, y: 0 },
      direction: "right",
      openPip: 3,
    },
    {
      id: "up",
      ownerTileId: t2,
      attachmentPoint: { x: 0, y: -56 },
      direction: "up",
      openPip: 3,
    },
  ];

  it("should snap to the nearest anchor within threshold", () => {
    const dragPoint: Point = { x: 30, y: 2 };
    const result = resolveSnapTarget(dragPoint, anchors, 20);
    
    expect(result.anchor).not.toBeNull();
    expect(result.anchor?.id).toBe("right");
    expect(result.distance).toBeCloseTo(Math.sqrt((30-28)**2 + (2-0)**2));
    expect(result.highlightTileId).toBe(t1);
  });

  it("should return null if no anchor is within threshold", () => {
    const dragPoint: Point = { x: 100, y: 100 };
    const result = resolveSnapTarget(dragPoint, anchors, 20);
    
    expect(result.anchor).toBeNull();
    expect(result.distance).toBe(Infinity);
    expect(result.highlightTileId).toBeNull();
  });

  it("should pick the closest anchor among multiple valid ones", () => {
    const dragPoint: Point = { x: 5, y: -50 };
    const result = resolveSnapTarget(dragPoint, anchors, 50);
    
    expect(result.anchor?.id).toBe("up");
    expect(result.highlightTileId).toBe(t2);
  });

  it("should tie-break deterministically using anchor ID", () => {
    const dragPoint: Point = { x: 0, y: 0 };
    const result = resolveSnapTarget(dragPoint, anchors, 50);
    
    expect(result.anchor?.id).toBe("left");
    expect(result.highlightTileId).toBe(t1);
  });
});
