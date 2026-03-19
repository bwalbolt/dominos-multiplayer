import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { FacedownTile } from "@/components/domino/facedown-tile";
import { spacing } from "@/theme/tokens";

import { ScreenRect } from "./hand-drag.types";
import {
  resolveOpponentLaunchTileIndex,
  shouldHideOpponentLaunchTile,
} from "./opponent-hand.utils";

const OPPONENT_TURN_ENTER_DURATION_MS = 600;
const OPPONENT_TURN_EXIT_DURATION_MS = 400;

interface OpponentHandProps {
  count: number;
  isTurn?: boolean;
  isLaunchingTile?: boolean;
  onLaunchTileRectChange?: (rect: ScreenRect | null) => void;
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  count,
  isTurn = false,
  isLaunchingTile = false,
  onLaunchTileRectChange,
}) => {
  const containerTranslateY = useSharedValue(0);
  const [isDrumming, setIsDrumming] = useState(false);
  const tileWrapperRefs = useRef<Record<number, View | null>>({});
  const launchTileIndex = useMemo(
    () => resolveOpponentLaunchTileIndex(count),
    [count],
  );

  const setTileWrapperRef = useCallback(
    (index: number) => (view: View | null) => {
      tileWrapperRefs.current[index] = view;
    },
    [],
  );

  useEffect(() => {
    if (!onLaunchTileRectChange) {
      return;
    }

    if (count <= 0) {
      onLaunchTileRectChange(null);
      return;
    }

    const measureTile = () => {
      const launchTile = tileWrapperRefs.current[launchTileIndex];
      if (!launchTile) {
        onLaunchTileRectChange(null);
        return;
      }

      launchTile.measureInWindow((x, y, width, height) => {
        onLaunchTileRectChange({ x, y, width, height });
      });
    };

    let delayedFrameId: number | null = null;
    const frameId = requestAnimationFrame(measureTile);
    const animationDurationMs = isTurn
      ? OPPONENT_TURN_ENTER_DURATION_MS
      : OPPONENT_TURN_EXIT_DURATION_MS;
    const timeoutId = setTimeout(() => {
      delayedFrameId = requestAnimationFrame(measureTile);
    }, animationDurationMs);

    return () => {
      cancelAnimationFrame(frameId);
      if (delayedFrameId !== null) {
        cancelAnimationFrame(delayedFrameId);
      }
      clearTimeout(timeoutId);
    };
  }, [count, isLaunchingTile, isTurn, launchTileIndex, onLaunchTileRectChange]);

  useEffect(() => {
    if (isTurn) {
      containerTranslateY.value = withTiming(spacing[16], {
        duration: OPPONENT_TURN_ENTER_DURATION_MS,
      });

      const timeout = setTimeout(() => {
        setIsDrumming(true);
      }, 3000);

      return () => {
        clearTimeout(timeout);
        setIsDrumming(false);
        containerTranslateY.value = withTiming(0, {
          duration: OPPONENT_TURN_EXIT_DURATION_MS,
        });
      };
    }

    setIsDrumming(false);
    containerTranslateY.value = withTiming(0, {
      duration: OPPONENT_TURN_EXIT_DURATION_MS,
    });
  }, [containerTranslateY, isTurn]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: containerTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          ref={setTileWrapperRef(index)}
          collapsable={false}
          style={styles.tileWrapper}
        >
          <OpponentTile
            index={index}
            isDrumming={isDrumming}
            isHidden={shouldHideOpponentLaunchTile(index, count, isLaunchingTile)}
          />
        </View>
      ))}
    </Animated.View>
  );
};

interface OpponentTileProps {
  index: number;
  isDrumming: boolean;
  isHidden: boolean;
}

const OpponentTile: React.FC<OpponentTileProps> = ({
  index,
  isDrumming,
  isHidden,
}) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isDrumming && !isHidden) {
      translateY.value = withDelay(
        index * 120,
        withRepeat(
          withSequence(
            withTiming(-spacing[16], { duration: 400 }),
            withTiming(0, { duration: 400 }),
            withTiming(0, { duration: 1500 }),
          ),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(translateY);
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [index, isDrumming, isHidden, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isHidden ? 0 : 1,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <FacedownTile scale={0.57} />
    </Animated.View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: -32,
    paddingHorizontal: spacing[8],
    zIndex: 1,
  },
  tileWrapper: {
    marginHorizontal: 1,
  },
}));
