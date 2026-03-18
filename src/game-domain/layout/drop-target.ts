import { spacing } from "../../../theme/tokens";

import { resolveSnapTarget } from "./snap";
import { LayoutAnchor, Point, Rect } from "./types";

export const BOARD_SNAP_THRESHOLD = 100;
export const HAND_ESCAPE_THRESHOLD = spacing[80];

type ResolveDropTargetInput = Readonly<{
  dragPoint: Point;
  dragScreenPosition: Point;
  relevantAnchors: readonly LayoutAnchor[];
  sourceRect: Rect;
}>;

export type DragDropTargetState = Readonly<{
  snapAnchor: LayoutAnchor | null;
  dropTargetAnchor: LayoutAnchor | null;
  hasClearedHandThreshold: boolean;
  isProjectedDropTarget: boolean;
}>;

export function hasDraggedTileClearedHandThreshold(
  sourceRect: Rect,
  dragScreenPosition: Point,
): boolean {
  const currentTileTop = dragScreenPosition.y - sourceRect.height / 2;
  return sourceRect.y - currentTileTop >= HAND_ESCAPE_THRESHOLD;
}

export function resolveDragDropTarget(
  input: ResolveDropTargetInput,
): DragDropTargetState {
  const snapResolution = resolveSnapTarget(
    input.dragPoint,
    input.relevantAnchors,
    BOARD_SNAP_THRESHOLD,
  );
  const hasClearedHandThreshold = hasDraggedTileClearedHandThreshold(
    input.sourceRect,
    input.dragScreenPosition,
  );
  const projectedResolution =
    snapResolution.anchor !== null || !hasClearedHandThreshold
      ? null
      : resolveSnapTarget(
          input.dragPoint,
          input.relevantAnchors,
          Number.POSITIVE_INFINITY,
        );
  const dropTargetAnchor = snapResolution.anchor ?? projectedResolution?.anchor ?? null;

  return {
    snapAnchor: snapResolution.anchor,
    dropTargetAnchor,
    hasClearedHandThreshold,
    isProjectedDropTarget:
      dropTargetAnchor !== null && snapResolution.anchor === null,
  };
}
