import { DominoOrientation } from "@/components/domino/domino-tile.types";
import {
  CameraTransform,
  PlacedTileGeometry,
  Point,
} from "@/src/game-domain/layout/types";
import { domino } from "@/theme/tokens";

import { DragTileVisual, ScreenRect } from "./hand-drag.types";

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
    scale: sourceRect.width / domino.width,
    orientation: "up",
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

export function resolveDraggedTileVisual(
  input: ResolveDraggedTileVisualInput,
): DragTileVisual | null {
  if (input.isSnapped && input.previewGeometry) {
    const screenCenter = projectBoardPointToScreen(
      input.previewGeometry.center,
      input.cameraTransform,
      input.containerOffset,
    );

    return {
      left:
        screenCenter.x -
        (input.previewGeometry.width * input.cameraTransform.scale) / 2,
      top:
        screenCenter.y -
        (input.previewGeometry.height * input.cameraTransform.scale) / 2,
      scale: input.cameraTransform.scale,
      orientation: rotationDegToOrientation(input.previewGeometry.rotationDeg),
    };
  }

  if (!input.dragScreenPosition) {
    return input.fallbackVisual;
  }

  return {
    left: input.dragScreenPosition.x - input.sourceRect.width / 2,
    top: input.dragScreenPosition.y - input.sourceRect.height / 2,
    scale: input.sourceRect.width / domino.width,
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
