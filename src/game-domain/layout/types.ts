import { ChainSide, DominoPip, TileId } from "../types";

/**
 * Basic coordinate point in the board space (pixels)
 */
export type Point = {
  readonly x: number;
  readonly y: number;
};

/**
 * Dimensions of a rectangle in board space
 */
export type Size = {
  readonly width: number;
  readonly height: number;
};

/**
 * Common orientation enum used for layout and rendering
 */
export type LayoutOrientation = "up" | "right" | "down" | "left";

/**
 * A potential slot where a tile can be played
 */
export type LayoutAnchor = {
  /** Uniquely identifies this anchor (e.g. "left", "right", "spinner-up") */
  readonly id: string;
  /** The tile this anchor belongs to (the tile being chained off of). Null for initial opening play. */
  readonly ownerTileId: TileId | null;
  /** The point where the new tile will touch the existing tile */
  readonly attachmentPoint: Point;
  /** The direction in which the chain is growing from this anchor */
  readonly direction: ChainSide;
  /** The pip value that must match for this anchor */
  readonly openPip: DominoPip;
};

/**
 * Visual/geometric representation of a tile already on the board
 */
export type PlacedTileGeometry = {
  readonly tileId: TileId;
  /** Pip values for the tile (A and B) */
  readonly value1: DominoPip;
  readonly value2: DominoPip;
  /** Center point of the tile in world space */
  readonly center: Point;
  /** Rotation in degrees (0 = vertical with sideA on top, 90 = horizontal with sideA on left) */
  readonly rotationDeg: number;
  /** Actual width of the tile bounding box in this rotation */
  readonly width: number;
  /** Actual height of the tile bounding box in this rotation */
  readonly height: number;
};

/**
 * The full geometric state of the board
 */
export type BoardGeometry = {
  readonly placedTiles: readonly PlacedTileGeometry[];
  readonly anchors: readonly LayoutAnchor[];
};

/**
 * Result of a snap resolution
 */
export type SnapResolution = {
  /** The anchor that was snapped to, or null if no anchor met the threshold */
  readonly anchor: LayoutAnchor | null;
  /** Distance in board space to the anchor's attachment point */
  readonly distance: number;
  /** The tile that should be highlighted as the drop target, if any */
  readonly highlightTileId: TileId | null;
};
