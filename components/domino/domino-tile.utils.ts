import { domino } from "@/theme/tokens";

import {
  DominoOrientation,
  DominoState,
  DominoTileRenderMode,
} from "./domino-tile.types";

type DominoTileSize = Readonly<{
  width: number;
  height: number;
}>;

type DominoTileFaceOffset = Readonly<{
  x: number;
  y: number;
}>;

export type DominoTileMetrics = Readonly<{
  bodySize: DominoTileSize;
  frameSize: DominoTileSize;
  halfFaceSize: number;
  padding: number;
  depthOffset: number;
  strokeWidth: number;
  svgOffset: number;
  svgWidth: number;
  svgHeight: number;
  divider: Readonly<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
}>;

export function isVerticalDominoOrientation(
  orientation: DominoOrientation,
): boolean {
  return orientation === "up" || orientation === "down";
}

export function getDominoTileBodySize(
  orientation: DominoOrientation,
): DominoTileSize {
  const isVertical = isVerticalDominoOrientation(orientation);

  return {
    width: isVertical ? domino.width : domino.height,
    height: isVertical ? domino.height : domino.width,
  };
}

export function getDominoTileFrameSize(
  orientation: DominoOrientation,
  scale = 1,
): DominoTileSize {
  const bodySize = getDominoTileBodySize(orientation);

  return {
    width: bodySize.width * scale,
    height: (bodySize.height + domino.depthOffset) * scale,
  };
}

export function getDominoTileMetrics(
  orientation: DominoOrientation,
): DominoTileMetrics {
  const bodySize = getDominoTileBodySize(orientation);
  const divider = isVerticalDominoOrientation(orientation)
    ? {
        x1: domino.bevelInset,
        y1: domino.width,
        x2: bodySize.width - domino.bevelInset,
        y2: domino.width,
      }
    : {
        x1: domino.width,
        y1: domino.bevelInset,
        x2: domino.width,
        y2: bodySize.height - domino.bevelInset,
      };

  return {
    bodySize,
    frameSize: {
      width: bodySize.width,
      height: bodySize.height + domino.depthOffset,
    },
    halfFaceSize: domino.width,
    padding: domino.outlinePadding,
    depthOffset: domino.depthOffset,
    strokeWidth: domino.strokeWidth,
    svgOffset: domino.strokeWidth / 2 + domino.outlinePadding,
    svgWidth: bodySize.width + domino.strokeWidth + domino.outlinePadding * 2,
    svgHeight:
      bodySize.height +
      domino.depthOffset +
      domino.strokeWidth +
      domino.outlinePadding * 2,
    divider,
  };
}

export function getDominoTileFaceOffsets(
  orientation: DominoOrientation,
): Readonly<[DominoTileFaceOffset, DominoTileFaceOffset]> {
  if (orientation === "up") {
    return [
      { x: 0, y: 0 },
      { x: 0, y: domino.width },
    ];
  }

  if (orientation === "down") {
    return [
      { x: 0, y: domino.width },
      { x: 0, y: 0 },
    ];
  }

  if (orientation === "left") {
    return [
      { x: 0, y: 0 },
      { x: domino.width, y: 0 },
    ];
  }

  return [
    { x: domino.width, y: 0 },
    { x: 0, y: 0 },
  ];
}

export function getDominoTileRotationAngle(
  orientation: DominoOrientation,
): number {
  return (
    {
      up: 0,
      right: 90,
      down: 180,
      left: 270,
    }[orientation] ?? 0
  );
}

export function clampDominoFlipProgress(progress?: number): number {
  if (progress === undefined) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

export function resolveDominoTileOpacity(
  state: DominoState,
  opacityOverride = 1,
): number {
  return (state === "ghost" ? domino.ghostOpacity : 1) * opacityOverride;
}

export function resolveDominoTileShadowOpacity(
  renderMode: DominoTileRenderMode,
  state: DominoState,
  shadowOpacityOverride = 1,
): number {
  const renderModeMultiplier =
    renderMode === "shell" ? domino.shellDepthOpacity : 1;
  const stateMultiplier = state === "ghost" ? domino.ghostOpacity + 0.2 : 1;

  return (
    domino.shadowOpacity *
    renderModeMultiplier *
    stateMultiplier *
    shadowOpacityOverride
  );
}

export function resolveDominoTileRenderMode(
  requestedRenderMode: DominoTileRenderMode | undefined,
  flipProgress: number,
): DominoTileRenderMode {
  const baseRenderMode = requestedRenderMode ?? "front";

  if (baseRenderMode === "shell" || flipProgress < domino.flipHalfway) {
    return baseRenderMode;
  }

  return baseRenderMode === "front" ? "back" : "front";
}

export function buildDominoTileDepthPath(
  x: number,
  y: number,
  width: number,
  height: number,
  depthOffset: number,
  borderRadius: number,
): string {
  return `
    M ${x},${y + height - borderRadius}
    V ${y + height + depthOffset - borderRadius}
    Q ${x},${y + height + depthOffset} ${x + borderRadius},${y + height + depthOffset}
    H ${x + width - borderRadius}
    Q ${x + width},${y + height + depthOffset} ${x + width},${y + height + depthOffset - borderRadius}
    V ${y + height - borderRadius}
  `;
}

export function buildDominoTileDepthOverlapPath(
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number,
): string {
  const clampedRadius = Math.max(
    0,
    Math.min(borderRadius, width / 2, height / 2),
  );

  return `
    M ${x},${y + height - clampedRadius}
    Q ${x},${y + height} ${x + clampedRadius},${y + height}
    H ${x + width - clampedRadius}
    Q ${x + width},${y + height} ${x + width},${y + height - clampedRadius}
    H ${x}
    Z
  `;
}

export function buildDominoTileDepthFillPath(
  x: number,
  y: number,
  width: number,
  height: number,
  depthOffset: number,
  borderRadius: number,
): string {
  return `
    ${buildDominoTileDepthPath(
      x,
      y,
      width,
      height,
      depthOffset,
      borderRadius,
    )} Z
    ${buildDominoTileDepthOverlapPath(
      x,
      y,
      width,
      height,
      borderRadius,
    )}
  `;
}

export function buildDominoTileBevelHighlightPath(
  x: number,
  y: number,
  width: number,
  height: number,
  inset: number,
): string {
  return `M ${x + inset},${y + height - inset} V ${y + inset} H ${x + width - inset}`;
}

export function buildDominoTileBevelLowlightPath(
  x: number,
  y: number,
  width: number,
  height: number,
  inset: number,
): string {
  return `M ${x + width - inset},${y + inset} V ${y + height - inset} H ${x + inset}`;
}
