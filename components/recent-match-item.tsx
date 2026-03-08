import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { colors, spacing, typography } from "@/theme/tokens";

export type RecentMatchItemProps = {
  title: string;
  subtitle: string;
  isWin: boolean;
  xpValue: string;
  scoreDisplay: string;
  isLast?: boolean;
};

export function RecentMatchItem({
  title,
  subtitle,
  isWin,
  xpValue,
  scoreDisplay,
  isLast,
}: RecentMatchItemProps) {
  const iconSource = isWin
    ? require("@/assets/images/icons/Check.svg")
    : require("@/assets/images/icons/Close_SM.svg");

  return (
    <View style={[styles.container, !isLast && styles.withBorder]}>
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: isWin ? colors.green08 : colors.pink08 },
          ]}
        >
          <Image
            source={iconSource}
            style={[
              styles.statusIcon,
              { tintColor: isWin ? colors.green : colors.pink },
            ]}
            contentFit="contain"
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.xpText, isWin ? styles.winXp : styles.lossXp]}>
          +{xpValue} XP
        </Text>
        <Text style={styles.scoreText}>{scoreDisplay}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[16],
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.black08,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[8],
  },
  statusIcon: {
    width: 24,
    height: 24,
  },
  infoContainer: {
    justifyContent: "center",
  },
  title: {
    ...typography.headline6,
    color: colors.iron,
  },
  subtitle: {
    ...typography.tinyText,
    color: colors.black45,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  xpText: {
    ...typography.statValueText,
    fontSize: 14,
    lineHeight: 16,
  },
  winXp: {
    color: colors.green,
  },
  lossXp: {
    color: colors.black66,
  },
  scoreText: {
    ...typography.tinyText,
    color: colors.black45,
    marginTop: 2,
  },
});
