import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { colors, designTokens, spacing, typography } from "@/theme/tokens";

export type StatCardProps = {
  title: string;
  value: string;
  unit?: string;
  todaysWins?: number;
  iconType: "stats" | "trophy";
};

export function StatCard({
  title,
  value,
  unit,
  todaysWins,
  iconType,
}: StatCardProps) {
  const iconSource =
    iconType === "stats"
      ? require("@/assets/images/bg-icon-stats.svg")
      : require("@/assets/images/bg-icon-trophy.svg");

  return (
    <View style={styles.shadowContainer}>
      <View style={styles.innerContainer}>
        {/* Background Icon */}
        <View style={styles.bgIconContainer} pointerEvents="none">
          <Image
            source={iconSource}
            style={styles.bgIcon}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}

          {todaysWins !== undefined && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>+{todaysWins}</Text>
              <Image
                source={require("@/assets/images/icons/Arrow_Up_MD.svg")}
                style={styles.arrowIcon}
                contentFit="contain"
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    width: "100%",
    height: 96,
    borderRadius: designTokens.defaultBorderRadius,
    backgroundColor: colors.backgroundColor,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  innerContainer: {
    flex: 1,
    borderRadius: designTokens.defaultBorderRadius,
    padding: spacing[16],
    overflow: "hidden",
    backgroundColor: colors.backgroundColor,
  },
  bgIconContainer: {
    position: "absolute",
    right: -8,
    bottom: 0,
    width: 60,
    height: 60,
    opacity: 1,
  },
  bgIcon: {
    width: "100%",
    height: "100%",
  },
  title: {
    ...typography.labelText,
    color: colors.iron,
    marginBottom: spacing[8],
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    ...typography.statValueText,
    color: colors.black,
  },
  unit: {
    ...typography.headline6,
    color: colors.black45,
    marginLeft: 2,
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.green08,
    borderRadius: 16,
    paddingHorizontal: spacing[8],
    paddingVertical: 2,
    marginLeft: spacing[8],
    marginBottom: 6,
  },
  badgeText: {
    ...typography.tinyText,
    color: colors.green,
    fontWeight: designTokens.fontWeights.bold,
  },
  arrowIcon: {
    width: 12,
    height: 12,
    marginLeft: 2,
  },
});
