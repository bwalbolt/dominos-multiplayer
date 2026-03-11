import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { spacing, typography } from "@/theme/tokens";

interface BoneyardIndicatorProps {
  count: number;
}

export const BoneyardIndicator: React.FC<BoneyardIndicatorProps> = ({
  count,
}) => {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/icons/boneyard-icon.svg")}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.label}>tiles</Text>
      </View>
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
  },
  icon: {
    width: 16,
    height: 19,
    marginRight: spacing[8],
  },
  content: {
    flexDirection: "column",
  },
  count: {
    ...typography.smallText,
    fontWeight: "700",
    color: theme.colors.black66,
    lineHeight: 12,
  },
  label: {
    ...typography.tinyText,
    color: theme.colors.black66,
    lineHeight: 10,
  },
}));
