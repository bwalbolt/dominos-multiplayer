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

export type RootKind = "line" | "spinner";

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
  /** The rendered direction used for cosmetic wrapping. Defaults to the logical direction. */
  readonly visualDirection?: LayoutOrientation;
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
  /** Stable placement order from the event log. */
  readonly placedAtSeq: number;
  /** Logical chain branch this tile belongs to. */
  readonly logicalSide: ChainSide;
  /** Heading chosen by the layout solver for this tile. */
  readonly heading: LayoutOrientation;
};

/**
 * The full geometric state of the board
 */
export type BoardGeometry = {
  readonly placedTiles: readonly PlacedTileGeometry[];
  readonly anchors: readonly LayoutAnchor[];
};

export type TileSizeMetrics = {
  readonly shortSide: number;
  readonly longSide: number;
};

export type ArmSequenceEntry = {
  readonly tileId: TileId;
  readonly isDouble: boolean;
};

export type BoardLayoutOpenEnd = {
  readonly side: ChainSide;
  readonly ownerTileId: TileId | null;
  readonly openPip: DominoPip;
};

export type BoardLayoutArm = {
  readonly side: ChainSide;
  readonly isOpen: boolean;
  readonly tiles: readonly ArmSequenceEntry[];
};

export type LayoutOpenSlot = {
  readonly side: ChainSide;
  readonly attachmentPoint: Point;
  readonly visualDirection: LayoutOrientation;
  readonly rect: Rect;
};

export type BoardLayoutProblem = {
  readonly viewport: Size | null;
  readonly tileSize: TileSizeMetrics;
  readonly rootKind: RootKind;
  readonly rootTileId: TileId | null;
  readonly openEnds: readonly BoardLayoutOpenEnd[];
  readonly arms: readonly BoardLayoutArm[];
};

export type LayoutScore = {
  readonly fitScale: number;
  readonly compactness: number;
  readonly bendCount: number;
  readonly rightTurnCount: number;
  readonly leftTurnCount: number;
};

export type BoardLayoutSolution = {
  readonly geometry: BoardGeometry;
  readonly openSlots: readonly LayoutOpenSlot[];
  readonly occupiedBounds: Rect;
  readonly playableBounds: Rect;
  readonly fitScale: number;
  readonly camera: CameraTransform;
  readonly bendPlan: Readonly<Record<ChainSide, readonly number[]>>;
  readonly score: LayoutScore;
  readonly problem: BoardLayoutProblem;
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
/**
 * Axis-aligned bounding box
 */
export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Camera state for rendering the board
 */
export type CameraTransform = {
  readonly scale: number;
  readonly translateX: number;
  readonly translateY: number;
};

/**
 * Focus hint for camera transitions
 */
export type CameraFocusTarget = {
  /** The world-space point to prioritize */
  readonly center: Point;
  /** Optional tile ID associated with the focus */
  readonly tileId?: TileId;
  /** Why this target is being focused */
  readonly type: "last-move" | "turn-change" | "default";
};

/**
 * Combined viewport state output
 */
export type ViewportState = {
  readonly transform: CameraTransform;
  readonly focusTarget: CameraFocusTarget | null;
};
