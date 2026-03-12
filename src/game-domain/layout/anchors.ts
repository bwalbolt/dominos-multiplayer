import { domino } from "../../../theme/tokens";
import { BoardState, ChainSide, DominoPip, TileId } from "../types";
import { projectPlacement } from "./project-placement";
import { getBranchRootId, getSpinnerBranchUnlocks } from "./spinner";
import { BoardGeometry, LayoutAnchor, PlacedTileGeometry, Point } from "./types";

const TILE_WIDTH = domino.width;  // 56
const TILE_HEIGHT = domino.height; // 112

/**
 * Calculates the full geometric layout of the board based on the reconstructed state.
 */
export function calculateBoardGeometry(board: BoardState): BoardGeometry {
  if (board.tiles.length === 0) {
    return { 
      placedTiles: [], 
      anchors: computeLegalAnchors(board, new Map()) 
    };
  }


  const placedGeometries: PlacedTileGeometry[] = [];
  const tilesById = new Map<TileId, PlacedTileGeometry>();

  // 1. Reconstruct tiles in chronological order
  const sortedTiles = [...board.tiles].sort((a, b) => a.placedAtSeq - b.placedAtSeq);
  const firstTile = sortedTiles[0];
  
  // Place first tile at (0, 0)
  // If first tile is a double, it's vertical (0 deg), otherwise horizontal (90 deg)
  const isFirstDouble = firstTile.tile.sideA === firstTile.tile.sideB;
  const firstGeom = createGeometry(
    firstTile.tile.id,
    firstTile.tile.sideA,
    firstTile.tile.sideB,
    { x: 0, y: 0 },
    isFirstDouble ? 0 : 90
  );
  placedGeometries.push(firstGeom);
  tilesById.set(firstTile.tile.id, firstGeom);

  // We need to know which tile to attach to for each side.
  // We initialize with the root of each branch.
  const branchEnds: Record<ChainSide, TileId> = {
    left: getBranchRootId(board, "left")!,
    right: getBranchRootId(board, "right")!,
    up: getBranchRootId(board, "up") || firstTile.tile.id,
    down: getBranchRootId(board, "down") || firstTile.tile.id,
  };

  for (let i = 1; i < sortedTiles.length; i++) {
    const pTile = sortedTiles[i];
    const side = pTile.side;
    const prevTileId = branchEnds[side];
    const prevGeom = tilesById.get(prevTileId)!;

    // Create a temporary anchor to project the placement
    const anchor = getAnchorOnTile(prevGeom, side, 0 /* pip doesn't matter for projection */);
    
    // Determine inward side
    const isDouble = pTile.tile.sideA === pTile.tile.sideB;
    let inwardSide: "sideA" | "sideB" = "sideA";
    if (!isDouble) {
      const inwardPip = pTile.tile.sideA === pTile.openPipFacingOutward ? pTile.tile.sideB : pTile.tile.sideA;
      inwardSide = pTile.tile.sideA === inwardPip ? "sideA" : "sideB";
    }

    const geom = projectPlacement(pTile.tile, anchor, inwardSide);
    placedGeometries.push(geom);
    tilesById.set(pTile.tile.id, geom);
    
    // Update branch end
    branchEnds[side] = pTile.tile.id;
  }

  return {
    placedTiles: placedGeometries,
    anchors: computeLegalAnchors(board, tilesById),
  };
}

function createGeometry(
  tileId: TileId, 
  sideA: DominoPip, 
  sideB: DominoPip, 
  center: Point, 
  rotationDeg: number
): PlacedTileGeometry {
  const isVertical = rotationDeg === 0 || rotationDeg === 180;
  const width = isVertical ? TILE_WIDTH : TILE_HEIGHT;
  const height = isVertical ? TILE_HEIGHT : TILE_WIDTH;
  
  return {
    tileId,
    value1: sideA,
    value2: sideB,
    center,
    rotationDeg,
    width,
    height,
  };
}

function getAnchorOnTile(geom: PlacedTileGeometry, side: ChainSide, openPip: DominoPip): LayoutAnchor {
  let attachmentPoint: Point;
  if (side === "left") attachmentPoint = { x: geom.center.x - geom.width / 2, y: geom.center.y };
  else if (side === "right") attachmentPoint = { x: geom.center.x + geom.width / 2, y: geom.center.y };
  else if (side === "up") attachmentPoint = { x: geom.center.x, y: geom.center.y - geom.height / 2 };
  else attachmentPoint = { x: geom.center.x, y: geom.center.y + geom.height / 2 };
  
  return {
    id: `${geom.tileId}-${side}`,
    ownerTileId: geom.tileId,
    attachmentPoint,
    direction: side,
    openPip,
  };
}

function computeLegalAnchors(board: BoardState, tilesById: Map<TileId, PlacedTileGeometry>): LayoutAnchor[] {
  // If no tiles, special anchor at center
  if (board.tiles.length === 0) {
    return [{
      id: "initial",
      ownerTileId: null,
      attachmentPoint: { x: 0, y: 0 },
      direction: "left", 
      openPip: 0,
    }];
  }



  const { up: upUnlocked, down: downUnlocked } = getSpinnerBranchUnlocks(board);

  return board.openEnds
    .filter(oe => {
      if (oe.side === "up") return upUnlocked;
      if (oe.side === "down") return downUnlocked;
      return true;
    })
    .map(oe => {
      const geom = tilesById.get(oe.tileId!)!;
      return getAnchorOnTile(geom, oe.side, oe.pip);
    });
}

