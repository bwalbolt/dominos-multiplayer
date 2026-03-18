import { useState, useMemo, useRef } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { BoardState } from "../types";
import { solveBoardLayout } from "./anchors";
import { Point, Size } from "./types";
import { domino } from "../../../theme/tokens";

export function useBoardCamera(board: BoardState) {
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  const [containerOffset, setContainerOffset] = useState<Point>({ x: 0, y: 0 });
  const viewRef = useRef<View>(null);
  const padding = domino.width;

  const layout = useMemo(
    () =>
      solveBoardLayout(board, {
        viewport: viewportSize,
        padding,
      }),
    [board, padding, viewportSize],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewportSize({ width, height });

    // Measure absolute position to handle screen-to-board conversion
    viewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      setContainerOffset({ x: pageX, y: pageY });
    });
  };

  return {
    layout,
    transform: layout.camera,
    onLayout,
    geometry: layout.geometry,
    viewRef,
    containerOffset,
  };
}
