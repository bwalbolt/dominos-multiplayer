import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  FeDropShadow,
  Filter,
  LinearGradient,
  Mask,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { colors, typography } from "@/theme/tokens";

import type { ActiveScoreBurst } from "./score-burst.helpers";
import { getScoreBurstOrigin } from "./score-burst.helpers";

const TOTAL_DURATION_MS = 2000;
const BURST_DURATION_MS = 1500;
const TRAVEL_END_MS = 1850;
const BURST_END_PROGRESS = BURST_DURATION_MS / TOTAL_DURATION_MS;
const TRAVEL_END_PROGRESS = TRAVEL_END_MS / TOTAL_DURATION_MS;
const SCORE_FULL_SIZE_PROGRESS = 200 / BURST_DURATION_MS;
const SCORE_OVERSHOOT_PROGRESS = 280 / BURST_DURATION_MS;
const CIRCLE_HALF_SIZE_PROGRESS = 300 / BURST_DURATION_MS;
const CIRCLE_FULL_SIZE_PROGRESS = 450 / BURST_DURATION_MS;
const CIRCLE_NINETY_PERCENT_PROGRESS =
  CIRCLE_HALF_SIZE_PROGRESS +
  (CIRCLE_FULL_SIZE_PROGRESS - CIRCLE_HALF_SIZE_PROGRESS) * 0.8;
const CIRCLE_FADE_START_PROGRESS =
  CIRCLE_HALF_SIZE_PROGRESS +
  (CIRCLE_FULL_SIZE_PROGRESS - CIRCLE_HALF_SIZE_PROGRESS) * 0.9;
const DONUT_START_PROGRESS = 180 / BURST_DURATION_MS;
const DONUT_NEAR_COMPLETE_PROGRESS = CIRCLE_NINETY_PERCENT_PROGRESS;
const DONUT_COMPLETE_PROGRESS = 420 / BURST_DURATION_MS;
const SCORE_TEXT_SIZE = 50;
const TEXT_STROKE_WIDTH = 1;
const CIRCLE_DIAMETER = 200;
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2;
const RING_STROKE_WIDTH = 3;
const CANVAS_SIZE = 280;
const TEXT_LAYER_HEIGHT = 140;
const ARC_LIFT = 120;
const TRAVEL_FADE_START_PROGRESS = 0.95;
const TEXT_OUTLINE_OFFSETS = [
  { x: -TEXT_STROKE_WIDTH, y: 0 },
  { x: TEXT_STROKE_WIDTH, y: 0 },
  { x: 0, y: -TEXT_STROKE_WIDTH },
  { x: 0, y: TEXT_STROKE_WIDTH },
  { x: -TEXT_STROKE_WIDTH, y: -TEXT_STROKE_WIDTH },
  { x: -TEXT_STROKE_WIDTH, y: TEXT_STROKE_WIDTH },
  { x: TEXT_STROKE_WIDTH, y: -TEXT_STROKE_WIDTH },
  { x: TEXT_STROKE_WIDTH, y: TEXT_STROKE_WIDTH },
] as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreBurstOverlayProps {
  burst: ActiveScoreBurst | null;
  windowSize: Readonly<{
    width: number;
    height: number;
  }>;
  onAnimationComplete: (burstId: string) => void;
}

export function ScoreBurstOverlay({
  burst,
  windowSize,
  onAnimationComplete,
}: ScoreBurstOverlayProps) {
  const progress = useSharedValue(0);
  const burstOrigin = useMemo(
    () => getScoreBurstOrigin(windowSize),
    [windowSize],
  );
  const targetCenter = useMemo(() => {
    if (!burst) {
      return null;
    }

    return {
      x: burst.targetRect.x + burst.targetRect.width / 2,
      y: burst.targetRect.y + burst.targetRect.height / 2,
    };
  }, [burst]);
  const controlPoint = useMemo(() => {
    if (!targetCenter) {
      return null;
    }

    return {
      x: (burstOrigin.x + targetCenter.x) / 2,
      y: Math.max(burstOrigin.y, targetCenter.y) + ARC_LIFT,
    };
  }, [burstOrigin, targetCenter]);
  const containerAnimatedStyle = useAnimatedStyle(() => {
    if (!targetCenter || !controlPoint) {
      return {
        opacity: 0,
      };
    }

    let currentCenter = burstOrigin;

    if (progress.value > BURST_END_PROGRESS) {
      const travelProgress = interpolate(
        progress.value,
        [BURST_END_PROGRESS, TRAVEL_END_PROGRESS],
        [0, 1],
        Extrapolation.CLAMP,
      );
      const inverseTravelProgress = 1 - travelProgress;

      currentCenter = {
        x:
          inverseTravelProgress * inverseTravelProgress * burstOrigin.x +
          2 * inverseTravelProgress * travelProgress * controlPoint.x +
          travelProgress * travelProgress * targetCenter.x,
        y:
          inverseTravelProgress * inverseTravelProgress * burstOrigin.y +
          2 * inverseTravelProgress * travelProgress * controlPoint.y +
          travelProgress * travelProgress * targetCenter.y,
      };
    }

    return {
      left: currentCenter.x - CANVAS_SIZE / 2,
      top: currentCenter.y - CANVAS_SIZE / 2,
      opacity: 1,
    };
  });
  const circleAnimatedStyle = useAnimatedStyle(() => {
    const burstProgress = interpolate(
      progress.value,
      [0, BURST_END_PROGRESS],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      burstProgress,
      [0, CIRCLE_HALF_SIZE_PROGRESS, CIRCLE_FULL_SIZE_PROGRESS, 1],
      [0, 0.5, 1, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      burstProgress,
      [0, CIRCLE_FADE_START_PROGRESS, CIRCLE_FULL_SIZE_PROGRESS, 1],
      [1, 1, 0, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });
  const textAnimatedStyle = useAnimatedStyle(() => {
    const burstProgress = interpolate(
      progress.value,
      [0, BURST_END_PROGRESS],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const scaleDuringBurst = interpolate(
      burstProgress,
      [0, SCORE_FULL_SIZE_PROGRESS, SCORE_OVERSHOOT_PROGRESS, 0.22, 1],
      [0.4, 1, 1.4, 1, 1],
      Extrapolation.CLAMP,
    );
    const opacityDuringBurst = interpolate(
      burstProgress,
      [0, 0.18, 1],
      [0, 1, 1],
      Extrapolation.CLAMP,
    );

    if (progress.value <= BURST_END_PROGRESS) {
      return {
        opacity: opacityDuringBurst,
        transform: [{ scale: scaleDuringBurst }],
      };
    }

    const travelProgress = interpolate(
      progress.value,
      [BURST_END_PROGRESS, TRAVEL_END_PROGRESS],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: interpolate(
        travelProgress,
        [0, TRAVEL_FADE_START_PROGRESS, 1],
        [1, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            travelProgress,
            [0, 1],
            [1, 0.1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });
  const innerCutoutAnimatedProps = useAnimatedProps(() => {
    const burstProgress = interpolate(
      progress.value,
      [0, BURST_END_PROGRESS],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const donutProgress = interpolate(
      burstProgress,
      [
        0,
        DONUT_START_PROGRESS,
        DONUT_NEAR_COMPLETE_PROGRESS,
        DONUT_COMPLETE_PROGRESS,
        1,
      ],
      [0, 0, 0.82, 1, 1],
      Extrapolation.CLAMP,
    );
    const ringInnerRadius = Math.max(0, CIRCLE_RADIUS - RING_STROKE_WIDTH);

    return {
      r: ringInnerRadius * donutProgress,
    };
  });

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;

    if (!burst || !targetCenter || !controlPoint) {
      return;
    }

    progress.value = withTiming(
      1,
      {
        duration: TOTAL_DURATION_MS,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)(burst.id);
        }
      },
    );
  }, [burst, controlPoint, onAnimationComplete, progress, targetCenter]);

  if (!burst || !targetCenter || !controlPoint) {
    return null;
  }

  const gradientId = `score-burst-gradient-${burst.id}`;
  const filterId = `score-burst-shadow-${burst.id}`;
  const maskId = `score-burst-mask-${burst.id}`;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.canvasWrapper, containerAnimatedStyle]}>
        <Animated.View style={[styles.circleLayer, circleAnimatedStyle]}>
          <Svg width={CIRCLE_DIAMETER} height={CIRCLE_DIAMETER}>
            <Defs>
              <Mask id={maskId}>
                <Rect
                  x={0}
                  y={0}
                  width={CIRCLE_DIAMETER}
                  height={CIRCLE_DIAMETER}
                  fill={colors.black}
                />
                <Circle
                  cx={CIRCLE_RADIUS}
                  cy={CIRCLE_RADIUS}
                  r={CIRCLE_RADIUS}
                  fill={colors.white}
                />
                <AnimatedCircle
                  animatedProps={innerCutoutAnimatedProps}
                  cx={CIRCLE_RADIUS}
                  cy={CIRCLE_RADIUS}
                  fill={colors.black}
                />
              </Mask>
            </Defs>

            <Circle
              cx={CIRCLE_RADIUS}
              cy={CIRCLE_RADIUS}
              r={CIRCLE_RADIUS}
              fill={colors.white}
              mask={`url(#${maskId})`}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.textLayer, textAnimatedStyle]}>
          <Svg width={CANVAS_SIZE} height={TEXT_LAYER_HEIGHT}>
            <Defs>
              <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={colors.blurple} />
                <Stop offset="50%" stopColor={colors.purple} />
                <Stop offset="100%" stopColor={colors.pink} />
              </LinearGradient>
              <Filter
                id={filterId}
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <FeDropShadow
                  dx="4"
                  dy="4"
                  stdDeviation="4"
                  floodColor={colors.shadow}
                />
              </Filter>
            </Defs>
            {TEXT_OUTLINE_OFFSETS.map((offset, index) => (
              <SvgText
                key={`${burst.id}-outline-${index}`}
                x={CANVAS_SIZE / 2 + offset.x}
                y={TEXT_LAYER_HEIGHT / 2 + offset.y}
                fill={colors.white}
                fontFamily={typography.scoreText.fontFamily}
                fontSize={SCORE_TEXT_SIZE}
                fontWeight={typography.scoreText.fontWeight}
                letterSpacing={typography.scoreText.letterSpacing}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {burst.label}
              </SvgText>
            ))}
            <SvgText
              x={CANVAS_SIZE / 2}
              y={TEXT_LAYER_HEIGHT / 2}
              fill={`url(#${gradientId})`}
              filter={`url(#${filterId})`}
              fontFamily={typography.scoreText.fontFamily}
              fontSize={SCORE_TEXT_SIZE}
              fontWeight={typography.scoreText.fontWeight}
              letterSpacing={typography.scoreText.letterSpacing}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {burst.label}
            </SvgText>
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1600,
  },
  canvasWrapper: {
    position: "absolute",
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
  circleLayer: {
    position: "absolute",
    left: (CANVAS_SIZE - CIRCLE_DIAMETER) / 2,
    top: (CANVAS_SIZE - CIRCLE_DIAMETER) / 2,
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
  },
  textLayer: {
    position: "absolute",
    top: (CANVAS_SIZE - TEXT_LAYER_HEIGHT) / 2,
    width: CANVAS_SIZE,
    height: TEXT_LAYER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
}));
