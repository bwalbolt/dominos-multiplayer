import { useState, useCallback, useEffect } from "react";
import { 
  FivesLegalMove, 
  Tile, 
  TileId, 
} from "../types";
import { LayoutAnchor, CameraTransform, Point, PlacedTileGeometry } from "./types";
import { resolveSnapTarget } from "./snap";
import { projectPlacement } from "./project-placement";
import { domino } from "../../../theme/tokens";

export function useBoardInteraction(
  anchors: readonly LayoutAnchor[],
  legalMoves: readonly FivesLegalMove[],
  tileCatalog: Record<TileId, Tile>,
  cameraTransform: CameraTransform,
  containerOffset: Point,
  isInteractionEnabled: boolean,
) {
  const [draggedTileId, setDraggedTileId] = useState<TileId | null>(null);
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const [activeSnap, setActiveSnap] = useState<LayoutAnchor | null>(null);

  const screenToBoard = useCallback((screenX: number, screenY: number): Point => {
    // Correct for viewport offset on screen
    const localX = screenX - containerOffset.x;
    const localY = screenY - containerOffset.y;

    return {
      x: (localX - cameraTransform.translateX) / cameraTransform.scale,
      y: (localY - cameraTransform.translateY) / cameraTransform.scale,
    };
  }, [cameraTransform, containerOffset]);


  useEffect(() => {
    if (isInteractionEnabled) {
      return;
    }

    setDraggedTileId(null);
    setDragPosition(null);
    setActiveSnap(null);
  }, [isInteractionEnabled]);

  const onDragStart = (tileId: TileId) => {
    if (!isInteractionEnabled) {
      return;
    }

    setDraggedTileId(tileId);
  };

  const onDragUpdate = (screenX: number, screenY: number) => {
    if (!isInteractionEnabled || draggedTileId === null) {
      return;
    }

    const boardPoint = screenToBoard(screenX, screenY);
    setDragPosition(boardPoint);

    // Filter legal anchors for the dragged tile
    const tileLegalMoves = legalMoves.filter(m => m.tileId === draggedTileId);
    const tileLegalSides = new Set(tileLegalMoves.map(m => m.side));
    
    // Only snaps to anchors whose direction is a legal side for this tile
    const relevantAnchors = anchors.filter(a => tileLegalSides.has(a.direction));
    
    // Snap threshold: 60px in board space
    const resolution = resolveSnapTarget(boardPoint, relevantAnchors, 60);
    setActiveSnap(resolution.anchor);
  };

  const onDragEnd = () => {
    if (!isInteractionEnabled) {
      setDraggedTileId(null);
      setDragPosition(null);
      setActiveSnap(null);
      return null;
    }

    const snap = activeSnap;
    const tileId = draggedTileId;
    
    setDraggedTileId(null);
    setDragPosition(null);
    setActiveSnap(null);

    if (snap && tileId) {
      // Find the specific move that matches this snap
      const move = legalMoves.find(m => m.tileId === tileId && m.side === snap.direction);
      return move || null;
    }
    return null;
  };

  const previewGeometry = DraggedTileGeometry(
    isInteractionEnabled ? draggedTileId : null,
    activeSnap,
    tileCatalog,
    legalMoves,
    dragPosition,
  );

  return {
    draggedTileId,
    activeSnap,
    dragPosition,
    previewGeometry,
    onDragStart,
    onDragUpdate,
    onDragEnd,
  };
}

function DraggedTileGeometry(
  tileId: TileId | null,
  snap: LayoutAnchor | null,
  tileCatalog: Record<TileId, Tile>,
  legalMoves: readonly FivesLegalMove[],
  dragPosition: Point | null
): PlacedTileGeometry | null {
  if (!tileId || !dragPosition) return null;
  const tile = tileCatalog[tileId];
  if (!tile) return null;

  if (snap) {
    const move = legalMoves.find(m => m.tileId === tileId && m.side === snap.direction);
    if (move) {
      return projectPlacement(tile, snap, move.inwardTileSide);
    }
  }

  // Not snapped: just follow drag point (center)
  const isDouble = tile.sideA === tile.sideB;
  return {
    tileId,
    value1: tile.sideA,
    value2: tile.sideB,
    center: dragPosition,
    rotationDeg: isDouble ? 0 : 90,
    width: isDouble ? domino.width : domino.height,
    height: isDouble ? domino.height : domino.width,
  };
}
