import { TileId } from "../types";
import { CameraFocusTarget, CameraTransform, PlacedTileGeometry, Size, ViewportState } from "./types";
import { computeBoardBounds, computeFitTransform } from "./viewport";

/**
 * Hysteresis thresholds for camera stability.
 * Magic numbers acceptable per spec e5.
 */
const SCALE_THRESHOLD = 0.05; // 5% change required to update zoom
const TRANSLATION_THRESHOLD = 5; // 5px change required to update pan

/**
 * Determines if the change between the proposed next transform and the current stable transform
 * is significant enough to warrant a state change. This prevents micro-adjustments and jitter.
 * 
 * @param next The proposed new transform from the fit algorithm
 * @param current The current stable transform being used by the UI
 * @returns true if the change is significant
 */
export function shouldUpdateTransform(
  next: CameraTransform,
  current: CameraTransform
): boolean {
  // Scale change check
  const scaleDiff = Math.abs(next.scale - current.scale);
  const scaleChangeRatio = scaleDiff / current.scale;

  if (scaleChangeRatio > SCALE_THRESHOLD) {
    return true;
  }

  // Translation change check
  const dx = Math.abs(next.translateX - current.translateX);
  const dy = Math.abs(next.translateY - current.translateY);

  if (dx > TRANSLATION_THRESHOLD || dy > TRANSLATION_THRESHOLD) {
    return true;
  }

  return false;
}

/**
 * Returns either the target transform or the previous one based on hysteresis.
 */
export function getStableTransform(
  target: CameraTransform,
  previous: CameraTransform
): CameraTransform {
  return shouldUpdateTransform(target, previous) ? target : previous;
}

/**
 * Computes the full viewport state including the fit transform and semantic focus hints.
 */
export function deriveViewportState(
  placedTiles: readonly PlacedTileGeometry[],
  viewport: Size,
  padding: number,
  options?: {
    lastMoveTileId?: TileId;
    isTurnChange?: boolean;
  }
): ViewportState {
  const bounds = computeBoardBounds(placedTiles);
  const transform = computeFitTransform(bounds, viewport, padding);

  let focusTarget: CameraFocusTarget | null = null;

  if (options?.lastMoveTileId) {
    const tile = placedTiles.find((t) => t.tileId === options.lastMoveTileId);
    if (tile) {
      focusTarget = {
        center: tile.center,
        tileId: tile.tileId,
        type: options.isTurnChange ? "turn-change" : "last-move",
      };
    }
  }

  // If no specific focus found, default to board center
  if (!focusTarget && placedTiles.length > 0) {
    focusTarget = {
      center: {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      },
      type: "default",
    };
  }

  return {
    transform,
    focusTarget,
  };
}
