import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { designTokens, spacing, typography } from "@/theme/tokens";

import type { ScreenRect } from "./hand-drag.types";

interface BoardHeaderProps {
  opponentName: string;
  opponentTitle: string;
  opponentAvatar: any;
  playerScore: number;
  opponentScore: number;
  activeScoreSide?: "player" | "opponent";
  displayedPlayerScore?: number;
  displayedOpponentScore?: number;
  onPlayerScoreRectChange?: (rect: ScreenRect | null) => void;
  onOpponentScoreRectChange?: (rect: ScreenRect | null) => void;
  playerScoreScale?: SharedValue<number>;
  opponentScoreScale?: SharedValue<number>;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  opponentName,
  opponentTitle,
  opponentAvatar,
  playerScore,
  opponentScore,
  activeScoreSide = "player",
  displayedPlayerScore = playerScore,
  displayedOpponentScore = opponentScore,
  onPlayerScoreRectChange,
  onOpponentScoreRectChange,
  playerScoreScale,
  opponentScoreScale,
}) => {
  const router = useRouter();
  const playerScoreRef = useRef<View | null>(null);
  const opponentScoreRef = useRef<View | null>(null);
  const playerScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playerScoreScale?.value ?? 1 }],
  }));
  const opponentScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: opponentScoreScale?.value ?? 1 }],
  }));

  const measureRect = useCallback(
    (
      ref: React.RefObject<View | null>,
      onRectChange?: (rect: ScreenRect | null) => void,
    ) => {
      if (!onRectChange) {
        return;
      }

      const target = ref.current;
      if (!target) {
        onRectChange(null);
        return;
      }

      target.measureInWindow((x, y, width, height) => {
        onRectChange({ x, y, width, height });
      });
    },
    [],
  );

  useEffect(() => {
    if (!onPlayerScoreRectChange) {
      return;
    }

    let delayedFrameId: number | null = null;
    const frameId = requestAnimationFrame(() => {
      measureRect(playerScoreRef, onPlayerScoreRectChange);
    });
    const timeoutId = setTimeout(() => {
      delayedFrameId = requestAnimationFrame(() => {
        measureRect(playerScoreRef, onPlayerScoreRectChange);
      });
    }, 50);

    return () => {
      cancelAnimationFrame(frameId);
      if (delayedFrameId !== null) {
        cancelAnimationFrame(delayedFrameId);
      }
      clearTimeout(timeoutId);
    };
  }, [displayedPlayerScore, measureRect, onPlayerScoreRectChange]);

  useEffect(() => {
    if (!onOpponentScoreRectChange) {
      return;
    }

    let delayedFrameId: number | null = null;
    const frameId = requestAnimationFrame(() => {
      measureRect(opponentScoreRef, onOpponentScoreRectChange);
    });
    const timeoutId = setTimeout(() => {
      delayedFrameId = requestAnimationFrame(() => {
        measureRect(opponentScoreRef, onOpponentScoreRectChange);
      });
    }, 50);

    return () => {
      cancelAnimationFrame(frameId);
      if (delayedFrameId !== null) {
        cancelAnimationFrame(delayedFrameId);
      }
      clearTimeout(timeoutId);
    };
  }, [displayedOpponentScore, measureRect, onOpponentScoreRectChange]);

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={require("@/assets/images/icons/Chevron_Left_MD.svg")}
            style={styles.backIcon}
          />
        </Pressable>
        <Image source={opponentAvatar} style={styles.avatar} />
        <View style={styles.opponentInfo}>
          <Text style={styles.opponentName}>{opponentName}</Text>
          <Text style={styles.opponentTitle}>{opponentTitle}</Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View ref={playerScoreRef} collapsable={false}>
          <Animated.View style={playerScoreAnimatedStyle}>
            <Text
              style={[
                styles.scoreValue,
                activeScoreSide !== "player" && styles.inactiveScoreValue,
              ]}
            >
              {displayedPlayerScore}
            </Text>
          </Animated.View>
        </View>
        <Text style={styles.scoreLabel}>to</Text>
        <View ref={opponentScoreRef} collapsable={false}>
          <Animated.View style={opponentScoreAnimatedStyle}>
            <Text
              style={[
                styles.scoreValue,
                activeScoreSide !== "opponent" && styles.inactiveScoreValue,
              ]}
            >
              {displayedOpponentScore}
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingTop: spacing[72],
    paddingHorizontal: designTokens.siteGutter,
    paddingBottom: spacing[16],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.backgroundColor,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 24,
    height: 28,
    justifyContent: "center",
    marginRight: spacing[4],
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.iron,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: spacing[8],
    marginRight: spacing[4],
  },
  opponentInfo: {
    justifyContent: "center",
  },
  opponentName: {
    ...typography.headline6,
    color: theme.colors.iron,
    lineHeight: 20,
  },
  opponentTitle: {
    ...typography.tinyText,
    color: theme.colors.black45,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[8],
  },
  scoreValue: {
    ...typography.scoreText,
    color: theme.colors.black,
  },
  inactiveScoreValue: {
    color: theme.colors.black45,
  },
  scoreLabel: {
    ...typography.tinyText,
    color: theme.colors.black45,
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
}));
