import { DominoTile } from "@/components/domino/domino-tile";
import { TileId } from "@/src/game-domain/types";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useEffect } from "react";

import { resolveHandPanIntent } from "./hand-pan-intent";
import {
  ActiveHandDrag,
  DragTileVisual,
  ReturningHandDrag,
  ScreenPoint,
} from "./hand-drag.types";
import { createSourceDragTileVisual } from "./hand-drag-visual";

interface HandDragOverlayProps {
  activeDrag: ActiveHandDrag | null;
  activeDragVisual: DragTileVisual | null;
  returningDrags: readonly ReturningHandDrag[];
  hideActiveDrag: boolean;
  usesVerticalDragActivation: boolean;
  hasActiveDrag: boolean;
  onReturnComplete: (returnId: string, tileId: TileId) => void;
  onReturningDragStart: (
    returnId: string,
    currentVisual: DragTileVisual,
    touchPoint: ScreenPoint,
  ) => void;
  onReturningDragUpdate: (returnId: string, screenX: number, screenY: number) => void;
  onReturningDragEnd: (returnId: string) => void;
}

export function HandDragOverlay({
  activeDrag,
  activeDragVisual,
  returningDrags,
  hideActiveDrag,
  usesVerticalDragActivation,
  hasActiveDrag,
  onReturnComplete,
  onReturningDragStart,
  onReturningDragUpdate,
  onReturningDragEnd,
}: HandDragOverlayProps) {
  return (
    <>
      {activeDrag && activeDragVisual && !hideActiveDrag && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tile,
            {
              left: activeDragVisual.left,
              top: activeDragVisual.top,
            },
          ]}
        >
          <DominoTile
            value1={activeDrag.value1}
            value2={activeDrag.value2}
            orientation={activeDragVisual.orientation}
            scale={activeDragVisual.scale}
          />
        </Animated.View>
      )}

      {returningDrags.map((returningDrag) => (
        <ReturningDragTile
          key={returningDrag.returnId}
          drag={returningDrag}
          canDrag={!hasActiveDrag || returningDrag.isPromotedToActive}
          usesVerticalDragActivation={usesVerticalDragActivation}
          onReturnComplete={onReturnComplete}
          onReturningDragStart={onReturningDragStart}
          onReturningDragUpdate={onReturningDragUpdate}
          onReturningDragEnd={onReturningDragEnd}
        />
      ))}
    </>
  );
}

function ReturningDragTile({
  drag,
  canDrag,
  usesVerticalDragActivation,
  onReturnComplete,
  onReturningDragStart,
  onReturningDragUpdate,
  onReturningDragEnd,
}: Readonly<{
  drag: ReturningHandDrag;
  canDrag: boolean;
  usesVerticalDragActivation: boolean;
  onReturnComplete: (returnId: string, tileId: TileId) => void;
  onReturningDragStart: (
    returnId: string,
    currentVisual: DragTileVisual,
    touchPoint: ScreenPoint,
  ) => void;
  onReturningDragUpdate: (returnId: string, screenX: number, screenY: number) => void;
  onReturningDragEnd: (returnId: string) => void;
}>) {
  const sourceVisual = createSourceDragTileVisual(drag.sourceRect);
  const left = useSharedValue(drag.returnFrom.left);
  const top = useSharedValue(drag.returnFrom.top);
  const hasActivated = useSharedValue(false);
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const intentResolved = useSharedValue(false);

  useEffect(() => {
    if (drag.isPromotedToActive) {
      return;
    }

    left.value = drag.returnFrom.left;
    top.value = drag.returnFrom.top;

    left.value = withSpring(sourceVisual.left, undefined, (finished) => {
      if (finished) {
        runOnJS(onReturnComplete)(drag.returnId, drag.tileId);
      }
    });
    top.value = withSpring(sourceVisual.top);
  }, [
    drag.isPromotedToActive,
    drag.returnFrom.left,
    drag.returnFrom.top,
    drag.returnId,
    drag.tileId,
    left,
    onReturnComplete,
    sourceVisual.left,
    sourceVisual.top,
    top,
  ]);

  const panGesture = Gesture.Pan().enabled(canDrag);

  if (usesVerticalDragActivation) {
    panGesture
      .manualActivation(true)
      .onTouchesDown((event) => {
        "worklet";

        const touch = event.changedTouches[0] ?? event.allTouches[0];
        if (!touch) {
          return;
        }

        touchStartX.value = touch.absoluteX;
        touchStartY.value = touch.absoluteY;
        intentResolved.value = false;
      })
      .onTouchesMove((event, stateManager) => {
        "worklet";

        if (intentResolved.value) {
          return;
        }

        const touch = event.changedTouches[0] ?? event.allTouches[0];
        if (!touch) {
          return;
        }

        const intent = resolveHandPanIntent({
          translationX: touch.absoluteX - touchStartX.value,
          translationY: touch.absoluteY - touchStartY.value,
        });

        if (intent === "activate_drag") {
          intentResolved.value = true;
          stateManager.activate();
        } else if (intent === "yield_to_scroll") {
          intentResolved.value = true;
          stateManager.fail();
        }
      })
      .onTouchesUp((_event, stateManager) => {
        "worklet";

        if (intentResolved.value) {
          return;
        }

        intentResolved.value = true;
        stateManager.fail();
      })
      .onTouchesCancelled(() => {
        "worklet";

        intentResolved.value = true;
      });
  }

  panGesture
    .onStart((event) => {
      "worklet";

      hasActivated.value = true;
      cancelAnimation(left);
      cancelAnimation(top);
      runOnJS(onReturningDragStart)(
        drag.returnId,
        {
          left: left.value,
          top: top.value,
          scale: sourceVisual.scale,
          orientation: "up",
        },
        {
          x: event.absoluteX,
          y: event.absoluteY,
        },
      );
    })
    .onUpdate((event) => {
      "worklet";

      if (!hasActivated.value) {
        return;
      }

      runOnJS(onReturningDragUpdate)(
        drag.returnId,
        event.absoluteX,
        event.absoluteY,
      );
    })
    .onFinalize(() => {
      "worklet";

      if (hasActivated.value) {
        hasActivated.value = false;
        runOnJS(onReturningDragEnd)(drag.returnId);
      }

      intentResolved.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    opacity: drag.isPromotedToActive ? 0 : 1,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.tile, animatedStyle]}>
        <DominoTile
          value1={drag.value1}
          value2={drag.value2}
          orientation="up"
          scale={sourceVisual.scale}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create(() => ({
  tile: {
    position: "absolute",
    zIndex: 30,
  },
}));
