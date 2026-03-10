import { domino } from "../../../theme/tokens";
import { Tile, TileSide } from "../types";
import { LayoutAnchor, PlacedTileGeometry, Point } from "./types";

const HALF_WIDTH = domino.width / 2;   // 28
const HALF_HEIGHT = domino.height / 2;  // 56

/**
 * Computes where a tile would be placed given an anchor and which side of the tile faces inward.
 */
export function projectPlacement(
  tile: Tile,
  anchor: LayoutAnchor,
  inwardTileSide: TileSide = "sideA"
): PlacedTileGeometry {
  const isDouble = tile.sideA === tile.sideB;
  const direction = anchor.direction;

  let rotationDeg = 0;
  let center: Point = { x: 0, y: 0 };

  // Alignment logic:
  // - Non-doubles are placed lengthwise in the direction of the chain.
  // - Doubles are placed crosswise (perpendicular) to the chain.
  
  if (direction === "left") {
    if (isDouble) {
      rotationDeg = 0; // Vertical
      center = { x: anchor.attachmentPoint.x - HALF_WIDTH, y: anchor.attachmentPoint.y };
    } else {
      // Horizontal. Inward side touches the anchor.
      // If sideA is inward, it faces right (anchor is on the right of this new tile).
      // So sideB faces left.
      // Rotation 270 ('left'): sideA at left, sideB at right. Wait.
      // Let's re-verify from DominoTile: 
      // orientation 'left' (270): sideA.x=0, sideB.x=56. (SideA on left, SideB on right)
      // orientation 'right' (90): sideA.x=56, sideB.x=0. (SideA on right, SideB on left)
      
      // If growing LEFT:
      // New tile is to the left of anchor. Anchor is on the right of new tile.
      // So inward side must be on the RIGHT of the new tile.
      // If inward is sideA: we want sideA on the right -> orientation 'right' (90).
      // If inward is sideB: we want sideB on the right -> orientation 'left' (270).
      rotationDeg = inwardTileSide === "sideA" ? 90 : 270;
      center = { x: anchor.attachmentPoint.x - HALF_HEIGHT, y: anchor.attachmentPoint.y };
    }
  } else if (direction === "right") {
    if (isDouble) {
      rotationDeg = 0; // Vertical
      center = { x: anchor.attachmentPoint.x + HALF_WIDTH, y: anchor.attachmentPoint.y };
    } else {
      // Horizontal. New tile is to the right of anchor. Anchor is on the left of new tile.
      // So inward side must be on the LEFT of the new tile.
      // If inward is sideA: we want sideA on the left -> orientation 'left' (270).
      // If inward is sideB: we want sideB on the left -> orientation 'right' (90).
      rotationDeg = inwardTileSide === "sideA" ? 270 : 90;
      center = { x: anchor.attachmentPoint.x + HALF_HEIGHT, y: anchor.attachmentPoint.y };
    }
  } else if (direction === "up") {
    if (isDouble) {
      rotationDeg = 90; // Horizontal
      center = { x: anchor.attachmentPoint.x, y: anchor.attachmentPoint.y - HALF_WIDTH };
    } else {
      // Vertical. New tile is ABOVE anchor. Anchor is BELOW new tile.
      // So inward side must be on the BOTTOM of the new tile.
      // orientation 'up' (0): sideA.y=0, sideB.y=56. (SideA top, SideB bottom)
      // orientation 'down' (180): sideA.y=56, sideB.y=0. (SideA bottom, SideB top)
      
      // If inward is sideA: we want sideA on the bottom -> orientation 'down' (180).
      // If inward is sideB: we want sideB on the bottom -> orientation 'up' (0).
      rotationDeg = inwardTileSide === "sideA" ? 180 : 0;
      center = { x: anchor.attachmentPoint.x, y: anchor.attachmentPoint.y - HALF_HEIGHT };
    }
  } else if (direction === "down") {
    if (isDouble) {
      rotationDeg = 90; // Horizontal
      center = { x: anchor.attachmentPoint.x, y: anchor.attachmentPoint.y + HALF_WIDTH };
    } else {
      // Vertical. New tile is BELOW anchor. Anchor is ABOVE new tile.
      // So inward side must be on the TOP of the new tile.
      
      // If inward is sideA: we want sideA on the top -> orientation 'up' (0).
      // If inward is sideB: we want sideB on the top -> orientation 'down' (180).
      rotationDeg = inwardTileSide === "sideA" ? 0 : 180;
      center = { x: anchor.attachmentPoint.x, y: anchor.attachmentPoint.y + HALF_HEIGHT };
    }
  }

  const isVertical = rotationDeg === 0 || rotationDeg === 180;
  return {
    tileId: tile.id,
    value1: tile.sideA,
    value2: tile.sideB,
    center,
    rotationDeg,
    width: isVertical ? domino.width : domino.height,
    height: isVertical ? domino.height : domino.width,
  };
}
