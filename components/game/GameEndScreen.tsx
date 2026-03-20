import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { Button } from "@/components/Button";
import {
  defaultBorderRadius,
  designTokens,
  gameEndLayout,
  spacing,
  typography,
} from "@/theme/tokens";
import { Image } from "expo-image";

import type { GameEndPresentation, GameEndScoreRow } from "./game-end.helpers";

type GameEndScreenProps = Readonly<{
  presentation: GameEndPresentation;
  actionsEnabled: boolean;
  revealProgress: SharedValue<number>;
  onAddFriend: () => void;
  onRematch: () => void;
  onBackToHome: () => void;
}>;

export function GameEndScreen({
  presentation,
  actionsEnabled,
  revealProgress,
  onAddFriend,
  onRematch,
  onBackToHome,
}: GameEndScreenProps) {
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, spacing[24]);
  const topGradientStopOpacity =
    presentation.outcome === "defeat" ? "0.4" : undefined;
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      revealProgress.value,
      [0, 0.22],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      revealProgress.value,
      [0.84, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          revealProgress.value,
          [0.84, 1],
          [96, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.backgroundLayer, backgroundAnimatedStyle]}
      >
        <View style={styles.backgroundFill} />
        <View style={styles.gradientContainer}>
          <Svg width="100%" height="100%">
            <Defs>
              <SvgLinearGradient
                id="game-end-top-gradient"
                x1="50%"
                y1="0%"
                x2="50%"
                y2="100%"
              >
                <Stop
                  offset="0%"
                  stopColor={designTokens.colors.blue32}
                  stopOpacity={topGradientStopOpacity}
                />
                <Stop
                  offset="100%"
                  stopColor={designTokens.colors.blue32}
                  stopOpacity="0"
                />
              </SvgLinearGradient>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill="url(#game-end-top-gradient)"
            />
          </Svg>
        </View>
      </Animated.View>

      <View style={styles.content}>
        <View style={styles.summarySection}>
          {presentation.scoreRows.map((row, index) => (
            <AnimatedScoreRow
              key={row.key}
              row={row}
              revealProgress={revealProgress}
              sequenceIndex={index}
            />
          ))}

          <AnimatedBlock
            revealProgress={revealProgress}
            start={0.72}
            end={0.9}
            yOffset={112}
            style={styles.xpSection}
          >
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>{presentation.xp.label}</Text>
              <Text style={styles.xpGain}>{presentation.xp.gainLabel}</Text>
            </View>

            <View style={styles.xpTrack}>
              <View
                style={[
                  styles.xpFill,
                  { width: `${presentation.xp.progress * 100}%` },
                ]}
              >
                <Svg width="100%" height="100%">
                  <Defs>
                    <SvgLinearGradient
                      id="game-end-xp-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <Stop
                        offset="0%"
                        stopColor={designTokens.colors.blurple}
                      />
                      <Stop offset="50%" stopColor={designTokens.colors.blue} />
                      <Stop
                        offset="100%"
                        stopColor={designTokens.colors.green}
                      />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect
                    width="100%"
                    height="100%"
                    fill="url(#game-end-xp-gradient)"
                  />
                </Svg>
              </View>
            </View>

            <View style={styles.xpValuesRow}>
              <Text style={styles.xpValue}>{presentation.xp.currentLabel}</Text>
              <Text style={styles.xpValue}>{presentation.xp.targetLabel}</Text>
            </View>
          </AnimatedBlock>
        </View>

        <Animated.View
          pointerEvents={actionsEnabled ? "auto" : "none"}
          style={[
            styles.footer,
            { paddingBottom: footerBottomPadding },
            footerAnimatedStyle,
          ]}
        >
          <Button
            label={presentation.actions.addFriend.label}
            variant="tertiary"
            size="compact"
            iconSource={presentation.actions.addFriend.iconSource}
            onPress={onAddFriend}
          />
          <Button
            label={presentation.actions.rematch.label}
            variant="play"
            size="compact"
            iconSource={presentation.actions.rematch.iconSource}
            onPress={onRematch}
          />
          <Button
            label={presentation.actions.backToHome.label}
            variant="tertiary"
            size="compact"
            onPress={onBackToHome}
          />
        </Animated.View>
      </View>
    </View>
  );
}

function AnimatedScoreRow({
  row,
  revealProgress,
  sequenceIndex,
}: Readonly<{
  row: GameEndScoreRow;
  revealProgress: SharedValue<number>;
  sequenceIndex: number;
}>) {
  const start = sequenceIndex === 0 ? 0.46 : 0.6;
  const end = sequenceIndex === 0 ? 0.66 : 0.8;

  return (
    <AnimatedBlock
      revealProgress={revealProgress}
      start={start}
      end={end}
      yOffset={24}
      style={styles.scoreRow}
    >
      <ScoreRowContent row={row} />
    </AnimatedBlock>
  );
}

function AnimatedBlock({
  children,
  revealProgress,
  start,
  end,
  yOffset,
  style,
}: Readonly<{
  children: React.ReactNode;
  revealProgress: SharedValue<number>;
  start: number;
  end: number;
  yOffset: number;
  style?: StyleProp<ViewStyle>;
}>) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      revealProgress.value,
      [start, end],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          revealProgress.value,
          [start, end],
          [yOffset, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

function ScoreRowContent({ row }: Readonly<{ row: GameEndScoreRow }>) {
  return (
    <>
      <View style={styles.scoreIdentity}>
        <Image
          source={row.avatarSource}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.scoreCopy}>
          <Text numberOfLines={1} style={styles.scoreName}>
            {row.name}
          </Text>
          <Text numberOfLines={1} style={styles.scoreTitle}>
            {row.title}
          </Text>
        </View>
      </View>

      <Text style={styles.scoreValue}>{row.score}</Text>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.backgroundColor,
  },
  gradientContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: gameEndLayout.gradientHeight,
  },
  content: {
    flex: 1,
    paddingTop: gameEndLayout.contentTop,
    justifyContent: "space-between",
  },
  summarySection: {
    paddingHorizontal: designTokens.siteGutter,
    rowGap: spacing[24],
  },
  scoreRow: {
    minHeight: spacing[56],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing[16],
  },
  avatar: {
    width: spacing[56],
    height: spacing[56],
    borderRadius: defaultBorderRadius,
  },
  scoreCopy: {
    marginLeft: spacing[8],
    flexShrink: 1,
  },
  scoreName: {
    ...typography.headline5,
    color: theme.colors.iron,
  },
  scoreTitle: {
    ...typography.smallText,
    color: theme.colors.black45,
  },
  scoreValue: {
    ...typography.scoreText,
    color: theme.colors.black66,
    fontSize: 40,
    lineHeight: 40,
    textAlign: "right",
    minWidth: spacing[80],
  },
  xpSection: {
    paddingTop: spacing[32],
    paddingHorizontal: spacing[32],
    rowGap: spacing[4],
  },
  xpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xpLabel: {
    ...typography.headline6,
    color: theme.colors.iron,
  },
  xpGain: {
    ...typography.headline6,
    color: theme.colors.green,
  },
  xpTrack: {
    width: "100%",
    height: spacing[16],
    borderRadius: 999,
    backgroundColor: theme.colors.black08,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 999,
  },
  xpValuesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xpValue: {
    ...typography.tinyText,
    color: theme.colors.black66,
  },
  footer: {
    width: "100%",
    paddingTop: gameEndLayout.footerTopPadding,
    paddingHorizontal: designTokens.siteGutter,
    rowGap: gameEndLayout.footerGap,
  },
}));
