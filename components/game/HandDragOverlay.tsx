import { DominoTile } from "@/components/domino/domino-tile";
import { getDominoTileFrameSize } from "@/components/domino/domino-tile.utils";
import { TileId } from "@/src/game-domain/types";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useEffect } from "react";
import { domino } from "@/theme/tokens";

import { resolveHandPanIntent } from "./hand-pan-intent";
import {
  ActiveHandDrag,
  DragTileVisual,
  PlacementTileAnimation,
  ReturningHandDrag,
  ScreenPoint,
} from "./hand-drag.types";
import { createSourceDragTileVisual } from "./hand-drag-visual";

const DROP_SETTLE_DURATION_MS = 160;
const ACTIVE_DRAG_TILE_POSE = {
  elevation: domino.dragElevation,
  tiltXDeg: domino.dragTiltXDeg,
  tiltYDeg: domino.dragTiltYDeg,
} as const;
const PLACEMENT_TILE_POSE = {
  elevation: domino.previewElevation,
} as const;
const RETURNING_TILE_POSE = {
  elevation: domino.dragElevation,
} as const;

interface HandDragOverlayProps {
  activeDrag: ActiveHandDrag | null;
  activeDragVisual: DragTileVisual | null;
  placementAnimation: PlacementTileAnimation | null;
  returningDrags: readonly ReturningHandDrag[];
  hideActiveDrag: boolean;
  usesVerticalDragActivation: boolean;
  hasActiveDrag: boolean;
  onPlacementAnimationComplete: (animationId: string) => void;
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
  placementAnimation,
  returningDrags,
  hideActiveDrag,
  usesVerticalDragActivation,
  hasActiveDrag,
  onPlacementAnimationComplete,
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
            pose={ACTIVE_DRAG_TILE_POSE}
          />
        </Animated.View>
      )}

      {placementAnimation && (
        <PlacementAnimationTile
          placement={placementAnimation}
          onPlacementAnimationComplete={onPlacementAnimationComplete}
        />
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

function PlacementAnimationTile({
  placement,
  onPlacementAnimationComplete,
}: Readonly<{
  placement: PlacementTileAnimation;
  onPlacementAnimationComplete: (animationId: string) => void;
}>) {
  const initialPosition = resolvePlacementStartPosition(placement);
  const left = useSharedValue(initialPosition.left);
  const top = useSharedValue(initialPosition.top);

  useEffect(() => {
    const startPosition = resolvePlacementStartPosition(placement);

    left.value = startPosition.left;
    top.value = startPosition.top;

    left.value = withTiming(
      placement.to.left,
      {
        duration: DROP_SETTLE_DURATION_MS,
      },
      (finished) => {
        if (finished) {
          runOnJS(onPlacementAnimationComplete)(placement.animationId);
        }
      },
    );
    top.value = withTiming(placement.to.top, {
      duration: DROP_SETTLE_DURATION_MS,
    });
  }, [
    left,
    onPlacementAnimationComplete,
    placement,
    placement.animationId,
    placement.from.left,
    placement.from.orientation,
    placement.from.scale,
    placement.from.top,
    placement.to.left,
    placement.to.orientation,
    placement.to.scale,
    placement.to.top,
    top,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.tile, animatedStyle]}>
      <DominoTile
        value1={placement.value1}
        value2={placement.value2}
        orientation={placement.to.orientation}
        scale={placement.to.scale}
        pose={PLACEMENT_TILE_POSE}
      />
    </Animated.View>
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
          pose={RETURNING_TILE_POSE}
        />
      </Animated.View>
    </GestureDetector>
  );
}

function resolvePlacementStartPosition(
  placement: PlacementTileAnimation,
): Readonly<{
  left: number;
  top: number;
}> {
  const fromSize = getRenderedTileSize(
    placement.from.orientation,
    placement.from.scale,
  );
  const toSize = getRenderedTileSize(
    placement.to.orientation,
    placement.to.scale,
  );
  const fromCenterX = placement.from.left + fromSize.width / 2;
  const fromCenterY = placement.from.top + fromSize.height / 2;

  return {
    left: fromCenterX - toSize.width / 2,
    top: fromCenterY - toSize.height / 2,
  };
}

function getRenderedTileSize(
  orientation: DragTileVisual["orientation"],
  scale: number,
): Readonly<{
  width: number;
  height: number;
}> {
  const frameSize = getDominoTileFrameSize(orientation, scale);

  return {
    width: frameSize.width,
    height: frameSize.height,
  };
}

const styles = StyleSheet.create(() => ({
  tile: {
    position: "absolute",
    zIndex: 30,
  },
}));
