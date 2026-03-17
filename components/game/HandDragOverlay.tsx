import { DominoTile } from "@/components/domino/domino-tile";
import { TileId } from "@/src/game-domain/types";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useEffect } from "react";

import { ActiveHandDrag, DragTileVisual } from "./hand-drag.types";
import { createSourceDragTileVisual } from "./hand-drag-visual";

interface HandDragOverlayProps {
  drag: ActiveHandDrag | null;
  currentVisual: DragTileVisual | null;
  onReturnComplete: (tileId: TileId) => void;
}

export function HandDragOverlay({
  drag,
  currentVisual,
  onReturnComplete,
}: HandDragOverlayProps) {
  if (!drag) {
    return null;
  }

  if (drag.phase === "returning") {
    return (
      <ReturningDragTile
        drag={drag}
        onReturnComplete={onReturnComplete}
      />
    );
  }

  if (!currentVisual) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.tile,
        {
          left: currentVisual.left,
          top: currentVisual.top,
        },
      ]}
    >
      <DominoTile
        value1={drag.value1}
        value2={drag.value2}
        orientation={currentVisual.orientation}
        scale={currentVisual.scale}
      />
    </Animated.View>
  );
}

function ReturningDragTile({
  drag,
  onReturnComplete,
}: Readonly<{
  drag: ActiveHandDrag;
  onReturnComplete: (tileId: TileId) => void;
}>) {
  const sourceVisual = createSourceDragTileVisual(drag.sourceRect);
  const returnFrom = drag.returnFrom ?? sourceVisual;
  const left = useSharedValue(returnFrom.left);
  const top = useSharedValue(returnFrom.top);

  useEffect(() => {
    left.value = returnFrom.left;
    top.value = returnFrom.top;

    left.value = withSpring(sourceVisual.left, undefined, (finished) => {
      if (finished) {
        runOnJS(onReturnComplete)(drag.tileId);
      }
    });
    top.value = withSpring(sourceVisual.top);
  }, [
    drag.tileId,
    left,
    onReturnComplete,
    returnFrom.left,
    returnFrom.top,
    sourceVisual.left,
    sourceVisual.top,
    top,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.tile, animatedStyle]}>
      <DominoTile
        value1={drag.value1}
        value2={drag.value2}
        orientation="up"
        scale={sourceVisual.scale}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create(() => ({
  tile: {
    position: "absolute",
    zIndex: 30,
  },
}));
