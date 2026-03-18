import { domino } from "../../../theme/tokens";

import { ChainSide } from "../types";
import {
  LayoutAnchor,
  LayoutOpenSlot,
  LayoutOrientation,
  Point,
  Rect,
} from "./types";

export function createOpenSlot(
  side: ChainSide,
  attachmentPoint: Point,
  heading: LayoutOrientation,
  options?: Readonly<{
    isDouble?: boolean;
  }>,
): LayoutOpenSlot {
  return {
    side,
    attachmentPoint,
    visualDirection: heading,
    rect: createSlotRect(attachmentPoint, heading, options),
  };
}

export function createSlotRect(
  attachmentPoint: Point,
  heading: LayoutOrientation,
  options?: Readonly<{
    isDouble?: boolean;
  }>,
): Rect {
  const isDouble = options?.isDouble ?? false;

  if (isDouble && heading === "left") {
    return {
      x: attachmentPoint.x - domino.width,
      y: attachmentPoint.y - domino.height / 2,
      width: domino.width,
      height: domino.height,
    };
  }

  if (isDouble && heading === "right") {
    return {
      x: attachmentPoint.x,
      y: attachmentPoint.y - domino.height / 2,
      width: domino.width,
      height: domino.height,
    };
  }

  if (isDouble && heading === "up") {
    return {
      x: attachmentPoint.x - domino.height / 2,
      y: attachmentPoint.y - domino.width,
      width: domino.height,
      height: domino.width,
    };
  }

  if (isDouble && heading === "down") {
    return {
      x: attachmentPoint.x - domino.height / 2,
      y: attachmentPoint.y,
      width: domino.height,
      height: domino.width,
    };
  }

  if (heading === "left") {
    return {
      x: attachmentPoint.x - domino.height,
      y: attachmentPoint.y - domino.width / 2,
      width: domino.height,
      height: domino.width,
    };
  }

  if (heading === "right") {
    return {
      x: attachmentPoint.x,
      y: attachmentPoint.y - domino.width / 2,
      width: domino.height,
      height: domino.width,
    };
  }

  if (heading === "up") {
    return {
      x: attachmentPoint.x - domino.width / 2,
      y: attachmentPoint.y - domino.height,
      width: domino.width,
      height: domino.height,
    };
  }

  return {
    x: attachmentPoint.x - domino.width / 2,
    y: attachmentPoint.y,
    width: domino.width,
    height: domino.height,
  };
}

export function createOpenSlotFromAnchor(
  anchor: LayoutAnchor,
  options?: Readonly<{
    isDouble?: boolean;
  }>,
): LayoutOpenSlot {
  if (anchor.ownerTileId === null && anchor.id === "initial") {
    return {
      side: anchor.direction,
      attachmentPoint: anchor.attachmentPoint,
      visualDirection: "up",
      rect: {
        x: anchor.attachmentPoint.x - domino.width / 2,
        y: anchor.attachmentPoint.y - domino.height / 2,
        width: domino.width,
        height: domino.height,
      },
    };
  }

  return createOpenSlot(
    anchor.direction,
    anchor.attachmentPoint,
    anchor.visualDirection ?? anchor.direction,
    options,
  );
}
