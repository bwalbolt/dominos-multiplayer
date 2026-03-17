import { domino } from "../../../theme/tokens";
import { CameraTransform, LayoutAnchor, PlacedTileGeometry, Rect, Size } from "./types";

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
 * Expands the board bounds to reserve enough space for a full next play at each open anchor.
 */
export function computePlayableBounds(
  placedTiles: readonly PlacedTileGeometry[],
  anchors: readonly LayoutAnchor[],
): Rect {
  const bounds = computeBoardBounds(placedTiles);
  if (anchors.length === 0) {
    return bounds;
  }

  let minX = bounds.x;
  let minY = bounds.y;
  let maxX = bounds.x + bounds.width;
  let maxY = bounds.y + bounds.height;

  for (const anchor of anchors) {
    const direction = anchor.visualDirection ?? anchor.direction;

    if (direction === "left") {
      minX = Math.min(minX, anchor.attachmentPoint.x - domino.height);
      maxX = Math.max(maxX, anchor.attachmentPoint.x);
      minY = Math.min(minY, anchor.attachmentPoint.y - domino.width / 2);
      maxY = Math.max(maxY, anchor.attachmentPoint.y + domino.width / 2);
      continue;
    }

    if (direction === "right") {
      minX = Math.min(minX, anchor.attachmentPoint.x);
      maxX = Math.max(maxX, anchor.attachmentPoint.x + domino.height);
      minY = Math.min(minY, anchor.attachmentPoint.y - domino.width / 2);
      maxY = Math.max(maxY, anchor.attachmentPoint.y + domino.width / 2);
      continue;
    }

    if (direction === "up") {
      minX = Math.min(minX, anchor.attachmentPoint.x - domino.width / 2);
      maxX = Math.max(maxX, anchor.attachmentPoint.x + domino.width / 2);
      minY = Math.min(minY, anchor.attachmentPoint.y - domino.height);
      maxY = Math.max(maxY, anchor.attachmentPoint.y);
      continue;
    }

    minX = Math.min(minX, anchor.attachmentPoint.x - domino.width / 2);
    maxX = Math.max(maxX, anchor.attachmentPoint.x + domino.width / 2);
    minY = Math.min(minY, anchor.attachmentPoint.y);
    maxY = Math.max(maxY, anchor.attachmentPoint.y + domino.height);
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
 * Padding is expressed in board-space units, so the visible screen margin scales with zoom.
 * 
 * @param boardBounds The AABB of the board in world space.
 * @param viewport The dimensions of the available screen area.
 * @param padding The minimum margin to keep around the board.
 * @returns A transform object { scale, translateX, translateY }
 */
export function computeFitTransform(
  boardBounds: Rect,
  viewport: Size,
  padding: number,
  fitBounds: Rect = boardBounds,
): CameraTransform {
  // If viewport is invalid or too small to fit padding, return identity-ish
  if (viewport.width <= 0 || viewport.height <= 0) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  if (fitBounds.width === 0 || fitBounds.height === 0) {
    return {
      scale: 1,
      translateX: viewport.width / 2,
      translateY: viewport.height / 2,
    };
  }

  const paddedWidth = fitBounds.width + padding * 2;
  const paddedHeight = fitBounds.height + padding * 2;
  const scaleX = paddedWidth > 0 ? viewport.width / paddedWidth : 1;
  const scaleY = paddedHeight > 0 ? viewport.height / paddedHeight : 1;
  const scale = Math.min(scaleX, scaleY, 1);

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
  const preferredTranslateX = viewportCenterX - (boardCenterX * scale);
  const preferredTranslateY = viewportCenterY - (boardCenterY * scale);
  const paddingScreen = padding * scale;
  const minTranslateX = paddingScreen - fitBounds.x * scale;
  const maxTranslateX =
    viewport.width - paddingScreen - (fitBounds.x + fitBounds.width) * scale;
  const minTranslateY = paddingScreen - fitBounds.y * scale;
  const maxTranslateY =
    viewport.height - paddingScreen - (fitBounds.y + fitBounds.height) * scale;
  const translateX = clamp(preferredTranslateX, minTranslateX, maxTranslateX);
  const translateY = clamp(preferredTranslateY, minTranslateY, maxTranslateY);

  // Round to avoid sub-pixel floating point jitter
  return {
    scale: Math.round(scale * 10000) / 10000,
    translateX: Math.round(translateX * 100) / 100,
    translateY: Math.round(translateY * 100) / 100,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return (min + max) / 2;
  }

  return Math.min(Math.max(value, min), max);
}
