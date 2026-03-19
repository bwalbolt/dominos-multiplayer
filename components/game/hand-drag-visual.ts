import { DominoOrientation } from "@/components/domino/domino-tile.types";
import {
  getDominoTileBodySize,
  getDominoTileFrameSize,
} from "@/components/domino/domino-tile.utils";
import { ChainSide } from "@/src/game-domain/types";
import {
  CameraTransform,
  LayoutAnchor,
  PlacedTileGeometry,
  Point,
} from "@/src/game-domain/layout/types";

import { DragTileVisual, ScreenRect } from "./hand-drag.types";

const DEFAULT_HAND_TILE_BODY_SIZE = getDominoTileBodySize("up");

type ResolveDraggedTileVisualInput = Readonly<{
  sourceRect: ScreenRect;
  dragScreenPosition: Point | null;
  fallbackVisual: DragTileVisual | null;
  previewGeometry: PlacedTileGeometry | null;
  cameraTransform: CameraTransform;
  containerOffset: Point;
  isSnapped: boolean;
}>;

export function createSourceDragTileVisual(sourceRect: ScreenRect): DragTileVisual {
  return {
    left: sourceRect.x,
    top: sourceRect.y,
    scale: sourceRect.width / DEFAULT_HAND_TILE_BODY_SIZE.width,
    orientation: "up",
  };
}

export function createCenteredDragTileVisual(
  center: Point,
  orientation: DominoOrientation,
  scale: number,
): DragTileVisual {
  const frameSize = getDragTileVisualFrameSize(orientation, scale);

  return {
    left: center.x - frameSize.width / 2,
    top: center.y - frameSize.height / 2,
    scale,
    orientation,
  };
}

export function projectBoardPointToScreen(
  point: Point,
  cameraTransform: CameraTransform,
  containerOffset: Point,
): Point {
  return {
    x: containerOffset.x + cameraTransform.translateX + point.x * cameraTransform.scale,
    y: containerOffset.y + cameraTransform.translateY + point.y * cameraTransform.scale,
  };
}

export function projectPlacedTileGeometryToDragVisual(
  geometry: PlacedTileGeometry,
  cameraTransform: CameraTransform,
  containerOffset: Point,
): DragTileVisual {
  const screenCenter = projectBoardPointToScreen(
    geometry.center,
    cameraTransform,
    containerOffset,
  );

  return createCenteredDragTileVisual(
    screenCenter,
    rotationDegToOrientation(geometry.rotationDeg),
    cameraTransform.scale,
  );
}

export function getDragTileVisualCenter(visual: DragTileVisual): Point {
  const frameSize = getDragTileVisualFrameSize(visual.orientation, visual.scale);

  return {
    x: visual.left + frameSize.width / 2,
    y: visual.top + frameSize.height / 2,
  };
}

export function findLayoutAnchorForSide(
  anchors: readonly LayoutAnchor[],
  side: ChainSide,
): LayoutAnchor | null {
  return anchors.find((anchor) => anchor.direction === side) ?? null;
}

export function resolveDraggedTileVisual(
  input: ResolveDraggedTileVisualInput,
): DragTileVisual | null {
  if (input.isSnapped && input.previewGeometry) {
    return projectPlacedTileGeometryToDragVisual(
      input.previewGeometry,
      input.cameraTransform,
      input.containerOffset,
    );
  }

  if (!input.dragScreenPosition) {
    return input.fallbackVisual;
  }

  return {
    left: input.dragScreenPosition.x - input.sourceRect.width / 2,
    top: input.dragScreenPosition.y - input.sourceRect.height / 2,
    scale: input.sourceRect.width / DEFAULT_HAND_TILE_BODY_SIZE.width,
    orientation: "up",
  };
}

function rotationDegToOrientation(rotationDeg: number): DominoOrientation {
  const normalizedRotation = normalizeDegrees(rotationDeg);

  if (normalizedRotation === 90) {
    return "right";
  }

  if (normalizedRotation === 180) {
    return "down";
  }

  if (normalizedRotation === 270) {
    return "left";
  }

  return "up";
}

function normalizeDegrees(angleDeg: number): number {
  const normalized = angleDeg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function getDragTileVisualFrameSize(
  orientation: DominoOrientation,
  scale: number,
): Readonly<{
  width: number;
  height: number;
}> {
  return getDominoTileFrameSize(orientation, scale);
}
