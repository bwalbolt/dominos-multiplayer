import { useState, useMemo, useRef } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { BoardState } from "../types";
import { calculateBoardGeometry } from "./anchors";
import { computeBoardBounds, computeFitTransform } from "./viewport";
import { Point, Size } from "./types";

export function useBoardCamera(board: BoardState) {
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  const [containerOffset, setContainerOffset] = useState<Point>({ x: 0, y: 0 });
  const viewRef = useRef<View>(null);

  const geometry = useMemo(() => calculateBoardGeometry(board), [board]);
  const boardBounds = useMemo(() => computeBoardBounds(geometry.placedTiles), [geometry.placedTiles]);

  const transform = useMemo(() => {
    return computeFitTransform(boardBounds, viewportSize, 40 /* padding */);
  }, [boardBounds, viewportSize]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewportSize({ width, height });

    // Measure absolute position to handle screen-to-board conversion
    viewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      setContainerOffset({ x: pageX, y: pageY });
    });
  };

  return {
    transform,
    onLayout,
    geometry,
    viewRef,
    containerOffset,
  };
}

