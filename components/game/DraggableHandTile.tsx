import React from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import { DominoTile } from "../domino/domino-tile";
import { TileId } from "@/src/game-domain/types";

interface DraggableHandTileProps {
  tileId: TileId;
  value1: number;
  value2: number;
  isPlayable?: boolean;
  isInteractionEnabled: boolean;
  onDragStart: (tileId: TileId) => void;
  onDragUpdate: (screenX: number, screenY: number) => void;
  onDragEnd: () => void;
}

export const DraggableHandTile: React.FC<DraggableHandTileProps> = ({
  tileId,
  value1,
  value2,
  isPlayable = false,
  isInteractionEnabled,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}) => {

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const canDrag = isPlayable && isInteractionEnabled;

  const panGesture = Gesture.Pan()
    .enabled(canDrag)
    .onStart(() => {
      isDragging.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
      runOnJS(onDragStart)(tileId);
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
      runOnJS(onDragUpdate)(event.absoluteX, event.absoluteY);
    })
    .onEnd(() => {
      isDragging.value = false;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      runOnJS(onDragEnd)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: isDragging.value ? 1.1 : 1 },
      ],
      zIndex: isDragging.value ? 100 : 1,
      opacity: isDragging.value ? 0 : 1,
    };
  });



  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <DominoTile
          value1={value1 as any}
          value2={value2 as any}
          orientation="up"
          scale={0.85}
        />
      </Animated.View>
    </GestureDetector>
  );
};
