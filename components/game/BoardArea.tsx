import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { DominoTile } from "@/components/domino/domino-tile";

export const BoardArea: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Placeholder for the first played tile (spinner 5-5) */}
      <View style={styles.centerTile}>
        <DominoTile 
          value1={5} 
          value2={5} 
          orientation="up" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerTile: {
    // Positioning handled by parent flex for center
  },
}));
