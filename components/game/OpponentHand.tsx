import React, { useEffect, useState } from "react";
import {} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { FacedownTile } from "@/components/domino/facedown-tile";
import { spacing } from "@/theme/tokens";

interface OpponentHandProps {
  count: number;
  isTurn?: boolean;
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  count,
  isTurn = false,
}) => {
  const containerTranslateY = useSharedValue(0);
  const [isDrumming, setIsDrumming] = useState(false);

  useEffect(() => {
    if (isTurn) {
      // 1. Animate container down 16px
      containerTranslateY.value = withTiming(spacing[16], { duration: 600 });

      // 2. Idle timer for drumming animation
      const timeout = setTimeout(() => {
        setIsDrumming(true);
      }, 3000);

      return () => {
        clearTimeout(timeout);
        setIsDrumming(false);
        containerTranslateY.value = withTiming(0, { duration: 400 });
      };
    } else {
      setIsDrumming(false);
      containerTranslateY.value = withTiming(0, { duration: 400 });
    }
  }, [isTurn, containerTranslateY]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: containerTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {Array.from({ length: count }).map((_, index) => (
        <OpponentTile key={index} index={index} isDrumming={isDrumming} />
      ))}
    </Animated.View>
  );
};

interface OpponentTileProps {
  index: number;
  isDrumming: boolean;
}

const OpponentTile: React.FC<OpponentTileProps> = ({ index, isDrumming }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isDrumming) {
      // Finger drumming / wave pattern: staggered up/down animation
      translateY.value = withDelay(
        index * 120, // Stagger based on position in hand
        withRepeat(
          withSequence(
            withTiming(-spacing[16], { duration: 400 }), // Up
            withTiming(0, { duration: 400 }), // Return
            withTiming(0, { duration: 1500 }), // Pause 1.5s
          ),
          -1, // Loop indefinitely
          false,
        ),
      );
    } else {
      cancelAnimation(translateY);
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [isDrumming, index, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.tileWrapper, animatedStyle]}>
      <FacedownTile scale={0.57} />
    </Animated.View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: -32, // Tuck underneath header
    paddingHorizontal: spacing[8],
    zIndex: 1, // Stay below header's zIndex: 10
  },
  tileWrapper: {
    marginHorizontal: 1,
  },
}));
