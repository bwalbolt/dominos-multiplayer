import { DominoTile } from "@/components/domino/domino-tile";
import { getDominoTileFrameSize } from "@/components/domino/domino-tile.utils";
import { TileId } from "@/src/game-domain/types";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { StyleSheet } from "react-native-unistyles";
import { useEffect, useState } from "react";
import { domino } from "@/theme/tokens";

import { resolveHandPanIntent } from "./hand-pan-intent";
import {
  ActiveHandDrag,
  DragTileVisual,
  OpponentPlacementAnimation,
  PlacementTileAnimation,
  ReturningHandDrag,
  ScreenPoint,
} from "./hand-drag.types";
import {
  createSourceDragTileVisual,
  getDragTileVisualCenter,
} from "./hand-drag-visual";

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
const OPPONENT_PLACEMENT_TILE_POSE = {
  elevation: domino.previewElevation,
} as const;

interface HandDragOverlayProps {
  activeDrag: ActiveHandDrag | null;
  activeDragVisual: DragTileVisual | null;
  placementAnimation: PlacementTileAnimation | null;
  opponentPlacementAnimation: OpponentPlacementAnimation | null;
  returningDrags: readonly ReturningHandDrag[];
  hideActiveDrag: boolean;
  usesVerticalDragActivation: boolean;
  hasActiveDrag: boolean;
  onPlacementAnimationComplete: (animationId: string) => void;
  onOpponentPlacementAnimationComplete: (animationId: string) => void;
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
  opponentPlacementAnimation,
  returningDrags,
  hideActiveDrag,
  usesVerticalDragActivation,
  hasActiveDrag,
  onPlacementAnimationComplete,
  onOpponentPlacementAnimationComplete,
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
            styles.playerTile,
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

      {opponentPlacementAnimation && (
        <OpponentPlacementAnimationTile
          placement={opponentPlacementAnimation}
          onPlacementAnimationComplete={onOpponentPlacementAnimationComplete}
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

function OpponentPlacementAnimationTile({
  placement,
  onPlacementAnimationComplete,
}: Readonly<{
  placement: OpponentPlacementAnimation;
  onPlacementAnimationComplete: (animationId: string) => void;
}>) {
  const [orientation, setOrientation] = useState<DragTileVisual["orientation"]>(
    "up",
  );
  const [phase, setPhase] = useState<"intro" | "settle">("intro");
  const left = useSharedValue(resolveOpponentTileLeft(placement.from, "up"));
  const top = useSharedValue(resolveOpponentTileTop(placement.from, "up"));
  const scale = useSharedValue(placement.from.scale);
  const flipProgress = useSharedValue(0);
  const [flipProgressValue, setFlipProgressValue] = useState(0);

  useAnimatedReaction(
    () => flipProgress.value,
    (value) => {
      runOnJS(setFlipProgressValue)(value);
    },
  );

  useEffect(() => {
    cancelAnimation(left);
    cancelAnimation(top);
    cancelAnimation(scale);
    cancelAnimation(flipProgress);

    setPhase("intro");
    setOrientation("up");
    left.value = resolveOpponentTileLeft(placement.from, "up");
    top.value = resolveOpponentTileTop(placement.from, "up");
    scale.value = placement.from.scale;
    flipProgress.value = 0;

    left.value = withTiming(resolveOpponentTileLeft(placement.via, "up"), {
      duration: placement.flipIntroDurationMs,
      easing: Easing.in(Easing.cubic),
    });
    top.value = withTiming(resolveOpponentTileTop(placement.via, "up"), {
      duration: placement.flipIntroDurationMs,
      easing: Easing.in(Easing.cubic),
    });
    scale.value = withTiming(placement.via.scale, {
      duration: placement.flipIntroDurationMs,
      easing: Easing.in(Easing.cubic),
    });
    flipProgress.value = withTiming(
      1,
      {
        duration: placement.flipIntroDurationMs,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (!finished) {
          return;
        }
        runOnJS(setPhase)("settle");
      },
    );

    return () => {
      cancelAnimation(left);
      cancelAnimation(top);
      cancelAnimation(scale);
      cancelAnimation(flipProgress);
    };
  }, [
    flipProgress,
    left,
    onPlacementAnimationComplete,
    placement,
    scale,
    top,
  ]);

  useEffect(() => {
    if (phase !== "settle") {
      return;
    }

    cancelAnimation(left);
    cancelAnimation(top);
    cancelAnimation(scale);

    setOrientation(placement.to.orientation);
    left.value = resolveOpponentTileLeft(
      placement.via,
      placement.to.orientation,
    );
    top.value = resolveOpponentTileTop(
      placement.via,
      placement.to.orientation,
    );
    scale.value = placement.via.scale;

    left.value = withTiming(
      resolveOpponentTileLeft(placement.to, placement.to.orientation),
      {
        duration: placement.settleDurationMs,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(onPlacementAnimationComplete)(placement.animationId);
        }
      },
    );
    top.value = withTiming(
      resolveOpponentTileTop(placement.to, placement.to.orientation),
      {
        duration: placement.settleDurationMs,
        easing: Easing.out(Easing.cubic),
      },
    );
    scale.value = withTiming(placement.to.scale, {
      duration: placement.settleDurationMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [
    left,
    onPlacementAnimationComplete,
    phase,
    placement.animationId,
    placement.settleDurationMs,
    placement.to,
    placement.via,
    scale,
    top,
  ]);

  const frameSize = getRenderedTileSize(orientation, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    width: frameSize.width,
    height: frameSize.height,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.opponentTile, animatedStyle]}
    >
      <DominoTile
        value1={placement.value1}
        value2={placement.value2}
        orientation={orientation}
        scale={1}
        appearance={{ renderMode: "back" }}
        pose={{
          ...OPPONENT_PLACEMENT_TILE_POSE,
          flipProgress: flipProgressValue,
        }}
      />
    </Animated.View>
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
    <Animated.View
      pointerEvents="none"
      style={[styles.playerTile, animatedStyle]}
    >
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
      <Animated.View style={[styles.playerTile, animatedStyle]}>
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

function resolveOpponentTileLeft(
  visual: DragTileVisual,
  orientation: DragTileVisual["orientation"],
): number {
  return (
    getDragTileVisualCenter(visual).x -
    getRenderedTileSize(orientation, 1).width / 2
  );
}

function resolveOpponentTileTop(
  visual: DragTileVisual,
  orientation: DragTileVisual["orientation"],
): number {
  return (
    getDragTileVisualCenter(visual).y -
    getRenderedTileSize(orientation, 1).height / 2
  );
}

const styles = StyleSheet.create(() => ({
  playerTile: {
    position: "absolute",
    zIndex: 30,
  },
  opponentTile: {
    position: "absolute",
    zIndex: 5,
  },
}));
