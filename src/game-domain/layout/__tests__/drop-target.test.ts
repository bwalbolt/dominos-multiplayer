import { TileId } from "../../types";
import {
  HAND_ESCAPE_THRESHOLD,
  hasDraggedTileClearedHandThreshold,
  resolveDragDropTarget,
} from "../drop-target";
import { LayoutAnchor } from "../types";

describe("drop-target", () => {
  const ownerTileId = "tile-6-6" as TileId;
  const sourceRect = {
    x: 200,
    y: 400,
    width: 47.6,
    height: 99.45,
  };
  const anchors: readonly LayoutAnchor[] = [
    {
      id: "left",
      ownerTileId,
      attachmentPoint: { x: -200, y: 0 },
      direction: "left",
      openPip: 6,
    },
    {
      id: "right",
      ownerTileId,
      attachmentPoint: { x: 200, y: 0 },
      direction: "right",
      openPip: 6,
    },
    {
      id: "up",
      ownerTileId,
      attachmentPoint: { x: 0, y: -200 },
      direction: "up",
      openPip: 6,
    },
  ];

  it("keeps hard snap precedence when a legal anchor is within snap range", () => {
    const result = resolveDragDropTarget({
      dragPoint: { x: 190, y: 10 },
      dragScreenPosition: { x: 220, y: 260 },
      relevantAnchors: anchors,
      sourceRect,
    });

    expect(result).toEqual({
      snapAnchor: anchors[1],
      dropTargetAnchor: anchors[1],
      hasClearedHandThreshold: true,
      isProjectedDropTarget: false,
    });
  });

  it("returns no drop target before the hand-escape threshold is cleared", () => {
    const result = resolveDragDropTarget({
      dragPoint: { x: 20, y: 0 },
      dragScreenPosition: {
        x: 220,
        y: sourceRect.y + sourceRect.height / 2 - (HAND_ESCAPE_THRESHOLD - 1),
      },
      relevantAnchors: anchors,
      sourceRect,
    });

    expect(result).toEqual({
      snapAnchor: null,
      dropTargetAnchor: null,
      hasClearedHandThreshold: false,
      isProjectedDropTarget: false,
    });
  });

  it("projects to the nearest legal anchor after the hand-escape threshold", () => {
    const result = resolveDragDropTarget({
      dragPoint: { x: 20, y: 0 },
      dragScreenPosition: { x: 220, y: 260 },
      relevantAnchors: anchors,
      sourceRect,
    });

    expect(result).toEqual({
      snapAnchor: null,
      dropTargetAnchor: anchors[1],
      hasClearedHandThreshold: true,
      isProjectedDropTarget: true,
    });
  });

  it("uses the same deterministic tie-break as snap resolution", () => {
    const result = resolveDragDropTarget({
      dragPoint: { x: 0, y: 0 },
      dragScreenPosition: { x: 220, y: 260 },
      relevantAnchors: [anchors[1], anchors[0]],
      sourceRect,
    });

    expect(result.dropTargetAnchor?.id).toBe("left");
    expect(result.isProjectedDropTarget).toBe(true);
  });

  it("clears the projected target again when the tile moves back into the hand area", () => {
    expect(
      hasDraggedTileClearedHandThreshold(sourceRect, { x: 220, y: 260 }),
    ).toBe(true);
    expect(
      hasDraggedTileClearedHandThreshold(sourceRect, {
        x: 220,
        y: sourceRect.y + sourceRect.height / 2,
      }),
    ).toBe(false);
  });
});
