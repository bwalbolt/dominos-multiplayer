import React, { useEffect, useState } from "react";
import { AccessibilityInfo, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Text as SvgText } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { colors, gameEndLayout, typography } from "@/theme/tokens";
import { Image } from "expo-image";

import { GameEndScreen } from "./GameEndScreen";
import type { GameEndPresentation } from "./game-end.helpers";

const TOTAL_SEQUENCE_DURATION_MS = 5000;
const POST_BANNER_PAUSE_MS = 2000;
const VICTORY_INTRO_DURATION_MS = 1100;
const DEFEAT_INTRO_DURATION_MS = 1400;
const BANNER_INTRO_DURATION_MS = 700;
const REDUCED_MOTION_INTRO_DURATION_MS = 180;
const REDUCED_MOTION_REVEAL_DURATION_MS = 180;
const HERO_OUTLINE_WIDTH = 6;
const HERO_STROKE_WIDTH = HERO_OUTLINE_WIDTH * 2;
const VICTORY_BOUNCE_OVERSHOOT_SCALE = 1.36;
const HERO_SHADOW_LAYERS = [
  { x: 4, y: 4, opacity: 0.24, strokeWidth: HERO_STROKE_WIDTH + 4 },
  { x: 4, y: 4, opacity: 0.38, strokeWidth: HERO_STROKE_WIDTH + 2 },
  { x: 4, y: 4, opacity: 0.52, strokeWidth: HERO_STROKE_WIDTH },
] as const;

type GameEndOverlayProps = Readonly<{
  presentation: GameEndPresentation;
  onAddFriend: () => void;
  onRematch: () => void;
  onBackToHome: () => void;
}>;

function getInitialHeadlineOffset(
  outcome: GameEndPresentation["outcome"],
): number {
  return outcome === "victory"
    ? Number(gameEndLayout.victoryTextIntroOffsetY)
    : Number(gameEndLayout.defeatTextIntroOffsetY);
}

function getInitialHeadlineScale(
  outcome: GameEndPresentation["outcome"],
): number {
  return outcome === "victory"
    ? Number(gameEndLayout.victoryTextIntroScale)
    : Number(gameEndLayout.defeatTextIntroScale);
}

export function GameEndOverlay({
  presentation,
  onAddFriend,
  onRematch,
  onBackToHome,
}: GameEndOverlayProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [actionsEnabled, setActionsEnabled] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const revealProgress = useSharedValue(0);
  const headlineOpacity = useSharedValue(0);
  const headlineTranslateY = useSharedValue(
    getInitialHeadlineOffset(presentation.outcome),
  );
  const headlineScale = useSharedValue(
    getInitialHeadlineScale(presentation.outcome),
  );
  const bannerOpacity = useSharedValue(0);
  const bannerTranslateY = useSharedValue(
    Number(gameEndLayout.bannerIntroOffsetY),
  );
  const bannerScale = useSharedValue(Number(gameEndLayout.bannerIntroScale));
  const bannerIntroFullScale = windowWidth / gameEndLayout.heroBannerWidth;

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) {
        setReduceMotionEnabled(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        setReduceMotionEnabled(enabled);
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setActionsEnabled(false);

    cancelAnimation(revealProgress);
    cancelAnimation(headlineOpacity);
    cancelAnimation(headlineTranslateY);
    cancelAnimation(headlineScale);
    cancelAnimation(bannerOpacity);
    cancelAnimation(bannerTranslateY);
    cancelAnimation(bannerScale);

    revealProgress.value = 0;
    headlineOpacity.value = 0;
    headlineTranslateY.value = getInitialHeadlineOffset(presentation.outcome);
    headlineScale.value = getInitialHeadlineScale(presentation.outcome);
    bannerOpacity.value = 0;
    bannerTranslateY.value = Number(gameEndLayout.bannerIntroOffsetY);
    bannerScale.value = Number(gameEndLayout.bannerIntroScale);

    if (reduceMotionEnabled) {
      headlineOpacity.value = withTiming(1, {
        duration: REDUCED_MOTION_INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      headlineTranslateY.value = withTiming(0, {
        duration: REDUCED_MOTION_INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      headlineScale.value = withTiming(1, {
        duration: REDUCED_MOTION_INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      bannerOpacity.value = withDelay(
        60,
        withTiming(1, {
          duration: REDUCED_MOTION_INTRO_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
      );
      bannerTranslateY.value = withDelay(
        60,
        withTiming(0, {
          duration: REDUCED_MOTION_INTRO_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
      );
      bannerScale.value = withDelay(
        60,
        withTiming(bannerIntroFullScale, {
          duration: REDUCED_MOTION_INTRO_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
      );
      revealProgress.value = withDelay(
        REDUCED_MOTION_INTRO_DURATION_MS + 100,
        withTiming(
          1,
          {
            duration: REDUCED_MOTION_REVEAL_DURATION_MS,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            if (finished) {
              runOnJS(setActionsEnabled)(true);
            }
          },
        ),
      );

      return;
    }

    const introDuration =
      presentation.outcome === "victory"
        ? VICTORY_INTRO_DURATION_MS
        : DEFEAT_INTRO_DURATION_MS;
    const bannerDelay =
      presentation.outcome === "victory"
        ? introDuration - BANNER_INTRO_DURATION_MS + 220
        : introDuration - BANNER_INTRO_DURATION_MS + 140;
    const revealDelay =
      bannerDelay + BANNER_INTRO_DURATION_MS + POST_BANNER_PAUSE_MS;
    const revealDuration = Math.max(
      TOTAL_SEQUENCE_DURATION_MS - revealDelay,
      REDUCED_MOTION_REVEAL_DURATION_MS,
    );

    headlineOpacity.value = withTiming(1, {
      duration: introDuration,
      easing: Easing.out(Easing.cubic),
    });
    headlineTranslateY.value = withTiming(0, {
      duration: introDuration,
      easing:
        presentation.outcome === "victory"
          ? Easing.out(Easing.cubic)
          : Easing.out(Easing.exp),
    });
    headlineScale.value =
      presentation.outcome === "victory"
        ? withSequence(
            withTiming(VICTORY_BOUNCE_OVERSHOOT_SCALE, {
              duration: Math.round(introDuration * 0.85),
              easing: Easing.inOut(Easing.quad),
            }),
            withTiming(1, {
              duration: Math.round(introDuration * 0.15),
              easing: Easing.out(Easing.quad),
            }),
          )
        : withTiming(1, {
            duration: introDuration,
            easing: Easing.out(Easing.exp),
          });
    bannerOpacity.value = withDelay(
      bannerDelay,
      withTiming(1, {
        duration: BANNER_INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
    bannerTranslateY.value = withDelay(
      bannerDelay,
      withTiming(0, {
        duration: BANNER_INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
    bannerScale.value = withDelay(
      bannerDelay,
      withTiming(bannerIntroFullScale, {
        duration: BANNER_INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
    revealProgress.value = withDelay(
      revealDelay,
      withTiming(
        1,
        {
          duration: revealDuration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setActionsEnabled)(true);
          }
        },
      ),
    );
  }, [
    bannerOpacity,
    bannerIntroFullScale,
    bannerScale,
    bannerTranslateY,
    headlineOpacity,
    headlineScale,
    headlineTranslateY,
    presentation.outcome,
    reduceMotionEnabled,
    revealProgress,
  ]);

  const headlineAnimatedStyle = useAnimatedStyle(() => {
    const revealOffset = interpolate(
      revealProgress.value,
      [0, 1],
      [0, gameEndLayout.heroFinalTextTop - gameEndLayout.heroIntroTextTop],
      Extrapolation.CLAMP,
    );

    return {
      opacity: headlineOpacity.value,
      transform: [
        { translateY: headlineTranslateY.value + revealOffset },
        { scale: headlineScale.value },
      ],
    };
  });

  const bannerAnimatedStyle = useAnimatedStyle(() => {
    const revealOffset = interpolate(
      revealProgress.value,
      [0, 1],
      [0, gameEndLayout.heroFinalBannerTop - gameEndLayout.heroIntroBannerTop],
      Extrapolation.CLAMP,
    );
    const revealScale = interpolate(
      revealProgress.value,
      [0, 1],
      [1, 1 / bannerIntroFullScale],
      Extrapolation.CLAMP,
    );

    return {
      opacity: bannerOpacity.value,
      transform: [
        { translateY: bannerTranslateY.value + revealOffset },
        { scale: bannerScale.value * revealScale },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={styles.screenLayer}>
        <GameEndScreen
          presentation={presentation}
          actionsEnabled={actionsEnabled}
          revealProgress={revealProgress}
          onAddFriend={onAddFriend}
          onRematch={onRematch}
          onBackToHome={onBackToHome}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.bannerLayer, bannerAnimatedStyle]}
      >
        <Image
          source={presentation.bannerSource}
          style={styles.banner}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.headlineLayer, headlineAnimatedStyle]}
      >
        <HeroHeadline headline={presentation.headline} />
      </Animated.View>
    </View>
  );
}

function HeroHeadline({ headline }: Readonly<{ headline: string }>) {
  const centerX = gameEndLayout.heroTextCanvasWidth / 2;
  const centerY = gameEndLayout.heroTextCanvasHeight / 2;

  return (
    <Svg
      width={gameEndLayout.heroTextCanvasWidth}
      height={gameEndLayout.heroTextCanvasHeight}
    >
      {HERO_SHADOW_LAYERS.map((layer, index) => (
        <SvgText
          key={`hero-shadow-${index}`}
          x={centerX + layer.x}
          y={centerY + layer.y}
          fill={colors.shadow}
          fillOpacity={layer.opacity}
          stroke={colors.shadow}
          strokeOpacity={layer.opacity}
          strokeWidth={layer.strokeWidth}
          strokeLinejoin="round"
          fontFamily={typography.headline1.fontFamily}
          fontSize={typography.headline1.fontSize}
          fontWeight={typography.headline1.fontWeight}
          letterSpacing={typography.headline1.letterSpacing}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {headline}
        </SvgText>
      ))}
      <SvgText
        x={centerX}
        y={centerY}
        fill={colors.white}
        stroke={colors.white}
        strokeWidth={HERO_STROKE_WIDTH}
        strokeLinejoin="round"
        fontFamily={typography.headline1.fontFamily}
        fontSize={typography.headline1.fontSize}
        fontWeight={typography.headline1.fontWeight}
        letterSpacing={typography.headline1.letterSpacing}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {headline}
      </SvgText>
      <SvgText
        x={centerX}
        y={centerY}
        fill={colors.iron}
        fontFamily={typography.headline1.fontFamily}
        fontSize={typography.headline1.fontSize}
        fontWeight={typography.headline1.fontWeight}
        letterSpacing={typography.headline1.letterSpacing}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {headline}
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3000,
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerLayer: {
    position: "absolute",
    top: gameEndLayout.heroIntroBannerTop,
    left: "50%",
    marginLeft: -gameEndLayout.heroBannerWidth / 2,
    width: gameEndLayout.heroBannerWidth,
    height: gameEndLayout.heroBannerHeight,
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  headlineLayer: {
    position: "absolute",
    top: gameEndLayout.heroIntroTextTop,
    left: "50%",
    marginLeft: -gameEndLayout.heroTextCanvasWidth / 2,
    width: gameEndLayout.heroTextCanvasWidth,
    height: gameEndLayout.heroTextCanvasHeight,
  },
});
