import React from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { 
  runOnJS,
  useSharedValue,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { DominoTile } from "../domino/domino-tile";
import { resolveHandPanIntent } from "./hand-pan-intent";
import { DominoPip, TileId } from "@/src/game-domain/types";
import { domino } from "@/theme/tokens";

const HAND_TILE_POSE = {
  elevation: domino.handElevation,
} as const;

interface DraggableHandTileProps {
  tileId: TileId;
  value1: DominoPip;
  value2: DominoPip;
  isPlayable?: boolean;
  isHidden: boolean;
  isInteractionEnabled: boolean;
  usesVerticalDragActivation: boolean;
  onDragStart: (tileId: TileId) => void;
  onDragUpdate: (screenX: number, screenY: number) => void;
  onDragEnd: () => void;
}

export const DraggableHandTile: React.FC<DraggableHandTileProps> = ({
  tileId,
  value1,
  value2,
  isPlayable = false,
  isHidden,
  isInteractionEnabled,
  usesVerticalDragActivation,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}) => {
  const canDrag = isPlayable && isInteractionEnabled;
  const hasActivated = useSharedValue(false);
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const intentResolved = useSharedValue(false);

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
    .onStart(() => {
      "worklet";

      hasActivated.value = true;
      runOnJS(onDragStart)(tileId);
    })
    .onUpdate((event) => {
      "worklet";

      runOnJS(onDragUpdate)(event.absoluteX, event.absoluteY);
    })
    .onFinalize(() => {
      "worklet";

      if (hasActivated.value) {
        hasActivated.value = false;
        runOnJS(onDragEnd)();
      }

      intentResolved.value = false;
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.tile, isHidden && styles.hiddenTile]}>
        <DominoTile
          value1={value1}
          value2={value2}
          orientation="up"
          scale={0.85}
          pose={HAND_TILE_POSE}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create(() => ({
  tile: {
    opacity: 1,
  },
  hiddenTile: {
    opacity: 0,
  },
}));
