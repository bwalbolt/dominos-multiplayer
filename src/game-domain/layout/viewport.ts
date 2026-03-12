import { domino } from "../../../theme/tokens";
import { CameraTransform, PlacedTileGeometry, Rect, Size } from "./types";

const MAX_DOMINO_RENDER_WIDTH = 56;
const MAX_DOMINO_RENDER_HEIGHT = 117;

/**
 * Computes the axis-aligned bounding box of all placed tiles.
 */
export function computeBoardBounds(placedTiles: readonly PlacedTileGeometry[]): Rect {
  if (placedTiles.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const tile of placedTiles) {
    const halfWidth = tile.width / 2;
    const halfHeight = tile.height / 2;
    
    minX = Math.min(minX, tile.center.x - halfWidth);
    minY = Math.min(minY, tile.center.y - halfHeight);
    maxX = Math.max(maxX, tile.center.x + halfWidth);
    maxY = Math.max(maxY, tile.center.y + halfHeight);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Computes a camera transform that fits the board bounds into the viewport with padding.
 * Ensures the scale doesn't exceed the ceiling that would make a domino larger than 56x117.
 * 
 * @param boardBounds The AABB of the board in world space.
 * @param viewport The dimensions of the available screen area.
 * @param padding The minimum margin to keep around the board.
 * @returns A transform object { scale, translateX, translateY }
 */
export function computeFitTransform(
  boardBounds: Rect,
  viewport: Size,
  padding: number
): CameraTransform {
  // If viewport is invalid or too small to fit padding, return identity-ish
  if (viewport.width <= 0 || viewport.height <= 0) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  // If no tiles, center (0,0) in viewport at "natural" scale (capped by ceiling)
  const scaleCeiling = Math.max(
    MAX_DOMINO_RENDER_WIDTH / domino.width,
    MAX_DOMINO_RENDER_HEIGHT / domino.height
  );

  if (boardBounds.width === 0 || boardBounds.height === 0) {
    return {
      scale: scaleCeiling,
      translateX: viewport.width / 2,
      translateY: viewport.height / 2,
    };
  }

  const availableWidth = viewport.width - 2 * padding;
  const availableHeight = viewport.height - 2 * padding;

  // Calculate target scale to fit bounds into available space
  let scale = 0;
  if (availableWidth > 0 && availableHeight > 0) {
    const scaleX = availableWidth / boardBounds.width;
    const scaleY = availableHeight / boardBounds.height;
    scale = Math.min(scaleX, scaleY);
  }

  // Apply ceiling: maximum on-screen domino size 56x117
  // Scale ceiling = max(max_width / base_width, max_height / base_height)
  if (scale > scaleCeiling) {
    scale = scaleCeiling;
  }

  // The center of the board in world space
  const boardCenterX = boardBounds.x + boardBounds.width / 2;
  const boardCenterY = boardBounds.y + boardBounds.height / 2;

  // The center of the viewport
  const viewportCenterX = viewport.width / 2;
  const viewportCenterY = viewport.height / 2;

  // Transform: viewportPos = (worldPos * scale) + translation
  // To center boardCenter at viewportCenter:
  // viewportCenter = (boardCenter * scale) + translation
  // translation = viewportCenter - (boardCenter * scale)
  // Transform: viewportPos = (worldPos * scale) + translation
  // To center boardCenter at viewportCenter:
  // viewportCenter = (boardCenter * scale) + translation
  // translation = viewportCenter - (boardCenter * scale)
  const translateX = viewportCenterX - (boardCenterX * scale);
  const translateY = viewportCenterY - (boardCenterY * scale);

  // Round to avoid sub-pixel floating point jitter
  return {
    scale: Math.round(scale * 10000) / 10000,
    translateX: Math.round(translateX * 100) / 100,
    translateY: Math.round(translateY * 100) / 100,
  };
}
