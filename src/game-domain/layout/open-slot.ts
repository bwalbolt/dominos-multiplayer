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
): LayoutOpenSlot {
  return {
    side,
    attachmentPoint,
    visualDirection: heading,
    rect: createSlotRect(attachmentPoint, heading),
  };
}

export function createSlotRect(
  attachmentPoint: Point,
  heading: LayoutOrientation,
): Rect {
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

export function createOpenSlotFromAnchor(anchor: LayoutAnchor): LayoutOpenSlot {
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
  );
}
