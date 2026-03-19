import { DominoTile } from "@/components/domino/domino-tile";
import { getDominoTileFrameSize } from "@/components/domino/domino-tile.utils";
import { domino } from "@/theme/tokens";
import { useEffect } from "react";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { StyleSheet } from "react-native-unistyles";

import { DrawTileAnimation } from "./hand-drag.types";

const DRAW_TILE_POSE = {
  elevation: domino.previewElevation,
} as const;

interface DrawTileOverlayProps {
  animation: DrawTileAnimation | null;
  onAnimationComplete: (animationId: string) => void;
}

export function DrawTileOverlay({
  animation,
  onAnimationComplete,
}: Readonly<DrawTileOverlayProps>) {
  if (!animation) {
    return null;
  }

  return (
    <AnimatedDrawTile
      animation={animation}
      onAnimationComplete={onAnimationComplete}
    />
  );
}

function AnimatedDrawTile({
  animation,
  onAnimationComplete,
}: Readonly<{
  animation: DrawTileAnimation;
  onAnimationComplete: (animationId: string) => void;
}>) {
  const left = useSharedValue(animation.from.left);
  const top = useSharedValue(animation.from.top);
  const scale = useSharedValue(animation.from.scale);

  useEffect(() => {
    cancelAnimation(left);
    cancelAnimation(top);
    cancelAnimation(scale);

    left.value = animation.from.left;
    top.value = animation.from.top;
    scale.value = animation.from.scale;

    left.value = withTiming(
      animation.to.left,
      {
        duration: animation.durationMs,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)(animation.animationId);
        }
      },
    );
    top.value = withTiming(animation.to.top, {
      duration: animation.durationMs,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(animation.to.scale, {
      duration: animation.durationMs,
      easing: Easing.out(Easing.cubic),
    });

    return () => {
      cancelAnimation(left);
      cancelAnimation(top);
      cancelAnimation(scale);
    };
  }, [animation, left, onAnimationComplete, scale, top]);

  const frameSize = getDominoTileFrameSize("up", 1);
  const animatedStyle = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    width: frameSize.width,
    height: frameSize.height,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.tile, animatedStyle]}>
      <DominoTile
        value1={animation.value1}
        value2={animation.value2}
        orientation="up"
        scale={1}
        appearance={{
          renderMode: animation.faceMode,
        }}
        pose={DRAW_TILE_POSE}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create(() => ({
  tile: {
    position: "absolute",
    zIndex: 1,
  },
}));
