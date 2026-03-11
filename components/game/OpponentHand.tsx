import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { FacedownTile } from "@/components/domino/facedown-tile";
import { spacing } from "@/theme/tokens";

interface OpponentHandProps {
  count: number;
}

export const OpponentHand: React.FC<OpponentHandProps> = ({ count }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.tileWrapper}>
          <FacedownTile scale={0.57} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: -24, // Tuck underneath header
    paddingHorizontal: spacing[8],
    zIndex: 1, // Stay below header's zIndex: 10
  },
  tileWrapper: {
    marginHorizontal: 1,
  },
}));
