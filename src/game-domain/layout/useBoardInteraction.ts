import { useCallback, useEffect, useRef, useState } from "react";
import { domino } from "../../../theme/tokens";
import { FivesLegalMove, Tile, TileId } from "../types";
import { resolveDragDropTarget } from "./drop-target";
import { projectPlacement } from "./project-placement";
import {
  CameraTransform,
  LayoutAnchor,
  PlacedTileGeometry,
  Point,
  Rect,
} from "./types";

const selectSnappedMove = (
  tileId: TileId,
  snap: LayoutAnchor,
  legalMoves: readonly FivesLegalMove[],
  tileCatalog: Record<TileId, Tile>,
): FivesLegalMove | null => {
  const candidates = legalMoves.filter(
    (move) => move.tileId === tileId && move.side === snap.direction,
  );

  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length === 1 || snap.ownerTileId !== null) {
    return candidates[0];
  }

  const tile = tileCatalog[tileId];
  if (!tile) {
    return candidates[0];
  }

  return (
    candidates.find((move) => move.openPipFacingOutward === tile.sideA) ??
    candidates[0]
  );
};

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
  const [dragScreenPosition, setDragScreenPosition] = useState<Point | null>(
    null,
  );
  const [snapAnchor, setSnapAnchor] = useState<LayoutAnchor | null>(null);
  const [dropTargetAnchor, setDropTargetAnchor] = useState<LayoutAnchor | null>(
    null,
  );
  const [hasClearedHandThreshold, setHasClearedHandThreshold] = useState(false);
  const [isProjectedDropTarget, setIsProjectedDropTarget] = useState(false);
  const draggedTileIdRef = useRef<TileId | null>(null);
  const dragSourceRectRef = useRef<Rect | null>(null);
  const dragPositionRef = useRef<Point | null>(null);
  const dragScreenPositionRef = useRef<Point | null>(null);
  const snapAnchorRef = useRef<LayoutAnchor | null>(null);
  const dropTargetAnchorRef = useRef<LayoutAnchor | null>(null);
  const pendingDragFrameRef = useRef<number | null>(null);
  const pendingDragScreenPointRef = useRef<Point | null>(null);

  const screenToBoard = useCallback(
    (screenX: number, screenY: number): Point => {
      // Correct for viewport offset on screen
      const localX = screenX - containerOffset.x;
      const localY = screenY - containerOffset.y;

      return {
        x: (localX - cameraTransform.translateX) / cameraTransform.scale,
        y: (localY - cameraTransform.translateY) / cameraTransform.scale,
      };
    },
    [cameraTransform, containerOffset],
  );

  useEffect(() => {
    if (isInteractionEnabled) {
      return;
    }

    if (pendingDragFrameRef.current !== null) {
      cancelAnimationFrame(pendingDragFrameRef.current);
      pendingDragFrameRef.current = null;
    }

    setDraggedTileId(null);
    setDragPosition(null);
    setDragScreenPosition(null);
    setSnapAnchor(null);
    setDropTargetAnchor(null);
    setHasClearedHandThreshold(false);
    setIsProjectedDropTarget(false);
    draggedTileIdRef.current = null;
    dragSourceRectRef.current = null;
    dragPositionRef.current = null;
    dragScreenPositionRef.current = null;
    snapAnchorRef.current = null;
    dropTargetAnchorRef.current = null;
    pendingDragScreenPointRef.current = null;
  }, [isInteractionEnabled]);

  const onDragStart = (tileId: TileId, sourceRect: Rect) => {
    if (!isInteractionEnabled) {
      return;
    }

    draggedTileIdRef.current = tileId;
    dragSourceRectRef.current = sourceRect;
    setDraggedTileId(tileId);
  };

  const applyDragUpdate = useCallback((screenX: number, screenY: number) => {
    if (
      !isInteractionEnabled ||
      draggedTileIdRef.current === null ||
      dragSourceRectRef.current === null
    ) {
      return;
    }

    const boardPoint = screenToBoard(screenX, screenY);
    dragPositionRef.current = boardPoint;
    dragScreenPositionRef.current = { x: screenX, y: screenY };
    setDragPosition(boardPoint);
    setDragScreenPosition({ x: screenX, y: screenY });

    // Filter legal anchors for the dragged tile
    const tileLegalMoves = legalMoves.filter(
      (m) => m.tileId === draggedTileIdRef.current,
    );
    const tileLegalSides = new Set(tileLegalMoves.map((m) => m.side));

    // Only snaps to anchors whose direction is a legal side for this tile
    const relevantAnchors = anchors.filter((a) =>
      tileLegalSides.has(a.direction),
    );

    const targetState = resolveDragDropTarget({
      dragPoint: boardPoint,
      dragScreenPosition: { x: screenX, y: screenY },
      relevantAnchors,
      sourceRect: dragSourceRectRef.current,
    });
    snapAnchorRef.current = targetState.snapAnchor;
    dropTargetAnchorRef.current = targetState.dropTargetAnchor;
    setSnapAnchor(targetState.snapAnchor);
    setDropTargetAnchor(targetState.dropTargetAnchor);
    setHasClearedHandThreshold(targetState.hasClearedHandThreshold);
    setIsProjectedDropTarget(targetState.isProjectedDropTarget);
  }, [anchors, isInteractionEnabled, legalMoves, screenToBoard]);

  const flushPendingDragUpdate = useCallback(() => {
    const pendingPoint = pendingDragScreenPointRef.current;

    if (pendingDragFrameRef.current !== null) {
      cancelAnimationFrame(pendingDragFrameRef.current);
      pendingDragFrameRef.current = null;
    }

    if (pendingPoint) {
      pendingDragScreenPointRef.current = null;
      applyDragUpdate(pendingPoint.x, pendingPoint.y);
    }
  }, [applyDragUpdate]);

  const onDragUpdate = (screenX: number, screenY: number) => {
    pendingDragScreenPointRef.current = { x: screenX, y: screenY };

    if (pendingDragFrameRef.current !== null) {
      return;
    }

    pendingDragFrameRef.current = requestAnimationFrame(() => {
      pendingDragFrameRef.current = null;

      const pendingPoint = pendingDragScreenPointRef.current;
      if (!pendingPoint) {
        return;
      }

      pendingDragScreenPointRef.current = null;
      applyDragUpdate(pendingPoint.x, pendingPoint.y);
    });
  };

  const onDragEnd = useCallback(() => {
    flushPendingDragUpdate();

    if (!isInteractionEnabled) {
      setDraggedTileId(null);
      setDragPosition(null);
      setDragScreenPosition(null);
      setSnapAnchor(null);
      setDropTargetAnchor(null);
      setHasClearedHandThreshold(false);
      setIsProjectedDropTarget(false);
      draggedTileIdRef.current = null;
      dragSourceRectRef.current = null;
      dragPositionRef.current = null;
      dragScreenPositionRef.current = null;
      snapAnchorRef.current = null;
      dropTargetAnchorRef.current = null;
      pendingDragScreenPointRef.current = null;
      return null;
    }

    const targetAnchor = dropTargetAnchorRef.current;
    const tileId = draggedTileIdRef.current;
    const wasSnapped = snapAnchorRef.current !== null;
    const targetPreviewGeometry = DraggedTileGeometry(
      tileId,
      targetAnchor,
      tileCatalog,
      legalMoves,
      dragPositionRef.current,
    );

    setDraggedTileId(null);
    setDragPosition(null);
    setDragScreenPosition(null);
    setSnapAnchor(null);
    setDropTargetAnchor(null);
    setHasClearedHandThreshold(false);
    setIsProjectedDropTarget(false);
    draggedTileIdRef.current = null;
    dragSourceRectRef.current = null;
    dragPositionRef.current = null;
    dragScreenPositionRef.current = null;
    snapAnchorRef.current = null;
    dropTargetAnchorRef.current = null;
    pendingDragScreenPointRef.current = null;

    if (targetAnchor && tileId) {
      return {
        move: selectSnappedMove(tileId, targetAnchor, legalMoves, tileCatalog),
        targetPreviewGeometry,
        wasSnapped,
      };
    }
    return null;
  }, [
    flushPendingDragUpdate,
    isInteractionEnabled,
    legalMoves,
    tileCatalog,
  ]);

  const previewGeometry = DraggedTileGeometry(
    isInteractionEnabled ? draggedTileId : null,
    snapAnchor,
    tileCatalog,
    legalMoves,
    dragPosition,
  );

  return {
    draggedTileId,
    snapAnchor,
    dropTargetAnchor,
    hasClearedHandThreshold,
    isProjectedDropTarget,
    dragPosition,
    dragScreenPosition,
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
  dragPosition: Point | null,
): PlacedTileGeometry | null {
  if (!tileId || !dragPosition) return null;
  const tile = tileCatalog[tileId];
  if (!tile) return null;

  if (snap) {
    const move = selectSnappedMove(tileId, snap, legalMoves, tileCatalog);
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
    placedAtSeq: Number.MAX_SAFE_INTEGER,
    logicalSide: "right",
    heading: isDouble ? "up" : "right",
  };
}
