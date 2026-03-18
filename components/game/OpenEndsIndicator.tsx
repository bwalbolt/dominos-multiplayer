import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { spacing, typography } from "@/theme/tokens";

interface OpenEndsIndicatorProps {
  scoringTotal: number;
}

export const OpenEndsIndicator: React.FC<OpenEndsIndicatorProps> = ({
  scoringTotal,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.total}>{scoringTotal}</Text>
      <Text style={styles.label}>board {"\n"}total</Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundColor,
    borderTopRightRadius: spacing[104],
    borderBottomRightRadius: spacing[104],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[16],
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: theme.colors.black08,
    alignSelf: "flex-start",
    // Add margin bottom to separate from BoneyardIndicator when stacked
    marginBottom: spacing[4],
  },
  total: {
    ...typography.scoreText,
    fontSize: 20,
    color: theme.colors.black66,
    lineHeight: 20,
    marginRight: spacing[4],
  },
  label: {
    ...typography.tinyText,
    color: theme.colors.black66,
    lineHeight: 10,
  },
}));
