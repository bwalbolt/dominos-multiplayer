import { LayoutAnchor, Point, SnapResolution } from "./types";

/**
 * Calculates Euclidean distance between two points.
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Resolves the nearest valid snap target for a given drag point.
 * 
 * @param dragPoint The current position of the dragged tile (usually its center or anchor-relative point)
 * @param anchors List of legal anchors to check against
 * @param threshold Maximum distance (in board space) to allow snapping
 * @returns The nearest anchor and its distance, or null if outside threshold
 */
export function resolveSnapTarget(
  dragPoint: Point,
  anchors: readonly LayoutAnchor[],
  threshold: number
): SnapResolution {
  let nearestAnchor: LayoutAnchor | null = null;
  let minDistance = Infinity;

  for (const anchor of anchors) {
    const dist = getDistance(dragPoint, anchor.attachmentPoint);
    
    if (dist <= threshold && dist < minDistance) {
      minDistance = dist;
      nearestAnchor = anchor;
    } else if (dist === minDistance && nearestAnchor) {
      // Tie-break: use alphabetical ID comparison for deterministic results
      if (anchor.id < nearestAnchor.id) {
        nearestAnchor = anchor;
      }
    }
  }

  return {
    anchor: nearestAnchor,
    distance: nearestAnchor ? minDistance : Infinity,
    highlightTileId: nearestAnchor?.ownerTileId ?? null,
  };
}
