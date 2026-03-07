import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { designTokens } from "../theme/tokens";

export type GameCardProps = {
  avatarSource?: string | number | null;
  name: string;
  timeAgo: string;
  myScore?: number;
  opponentScore?: number;
  isWaiting?: boolean;
};

export function GameCard({
  avatarSource,
  name,
  timeAgo,
  myScore,
  opponentScore,
  isWaiting = false,
}: GameCardProps) {
  return (
    <View style={styles.container(isWaiting)}>
      <View style={styles.leftSection}>
        {avatarSource ? (
          <Image
            source={
              typeof avatarSource === "string"
                ? { uri: avatarSource }
                : avatarSource
            }
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.timeText} numberOfLines={1}>
            {timeAgo}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {myScore !== undefined && opponentScore !== undefined && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{myScore}</Text>
            <Text style={styles.scoreDivider}>to</Text>
            <Text style={styles.scoreNumber}>{opponentScore}</Text>
          </View>
        )}
      </View>
      {isWaiting && <Text style={styles.waitingText}>Waiting…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: (isWaiting: boolean) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: isWaiting
      ? designTokens.colors.backgroundColor
      : designTokens.colors.white,
    height: 64,
    borderRadius: designTokens.defaultBorderRadius,
    paddingRight: designTokens.spacing[16],
    borderWidth: isWaiting ? 1 : 0,
    borderColor: isWaiting ? designTokens.colors.black08 : "transparent",
    opacity: isWaiting ? 0.6 : 1,
    ...(isWaiting
      ? { overflow: "hidden" as const }
      : {
          shadowColor: designTokens.colors.shadow,
          shadowOffset: { width: 2, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 4,
        }),
  }),
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderTopLeftRadius: designTokens.defaultBorderRadius,
    borderBottomLeftRadius: designTokens.defaultBorderRadius,
  },
  avatarPlaceholder: {
    backgroundColor: designTokens.colors.black08,
  },
  infoContainer: {
    marginLeft: 12,
    justifyContent: "center",
  },
  nameText: {
    ...designTokens.typography.headline6,
    color: designTokens.colors.iron,
  },
  timeText: {
    ...designTokens.typography.tinyText,
    color: designTokens.colors.black45,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  waitingText: {
    ...designTokens.typography.tinyText,
    color: designTokens.colors.black45,
    position: "absolute",
    top: 5,
    right: 12,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: designTokens.spacing[4],
  },
  scoreNumber: {
    ...designTokens.typography.scoreText,
    color: designTokens.colors.black66,
  },
  scoreDivider: {
    ...designTokens.typography.tinyText,
    color: designTokens.colors.black45,
  },
});
