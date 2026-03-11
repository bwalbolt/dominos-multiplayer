import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { DominoTile } from "@/components/domino/domino-tile";
import { spacing } from "@/theme/tokens";

interface PlayerHandProps {
  hand: { value1: number; value2: number }[];
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ hand }) => {
  return (
    <View style={styles.container}>
      {hand.map((tile, index) => (
        <View key={index} style={styles.tileWrapper}>
          <DominoTile
            value1={tile.value1 as any}
            value2={tile.value2 as any}
            orientation="up"
            scale={0.85}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: spacing[24],
    paddingHorizontal: spacing[8],
  },
  tileWrapper: {
    marginHorizontal: 1, // Tight spacing like Figma
  },
}));
