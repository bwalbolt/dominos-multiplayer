import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Rect } from "react-native-svg";

import { colors, domino, spacing } from "@/theme/tokens";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const DOMINO_SELECTION_OUTLINE_PADDING = spacing[4] + spacing[2];

type DominoSelectionOutlineProps = Readonly<{
  width: number;
  height: number;
  x?: number;
  y?: number;
  borderRadius?: number;
  stroke?: string;
}>;

export function DominoSelectionOutline({
  width,
  height,
  x = 0,
  y = 0,
  borderRadius = domino.borderRadius,
  stroke = colors.blue,
}: DominoSelectionOutlineProps) {
  const glowOffset = useSharedValue(0);

  useEffect(() => {
    glowOffset.value = withRepeat(
      withTiming(3, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    return () => {
      glowOffset.value = 0;
    };
  }, [glowOffset]);

  const animatedProps = useAnimatedProps(() => ({
    x: x - glowOffset.value,
    y: y - glowOffset.value,
    width: width + glowOffset.value * 2,
    height: height + glowOffset.value * 2,
    strokeWidth: 1.5 + glowOffset.value * 0.5,
    rx: borderRadius + glowOffset.value,
    ry: borderRadius + glowOffset.value,
    opacity: 1,
  }));

  return <AnimatedRect animatedProps={animatedProps} fill="none" stroke={stroke} />;
}
