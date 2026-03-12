import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { designTokens, spacing, typography } from "@/theme/tokens";

interface BoardHeaderProps {
  opponentName: string;
  opponentTitle: string;
  opponentAvatar: any;
  playerScore: number;
  opponentScore: number;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  opponentName,
  opponentTitle,
  opponentAvatar,
  playerScore,
  opponentScore,
}) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={require("@/assets/images/icons/Chevron_Left_MD.svg")}
            style={styles.backIcon}
          />
        </Pressable>
        <Image source={opponentAvatar} style={styles.avatar} />
        <View style={styles.opponentInfo}>
          <Text style={styles.opponentName}>{opponentName}</Text>
          <Text style={styles.opponentTitle}>{opponentTitle}</Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreValue}>{playerScore}</Text>
        <Text style={styles.scoreLabel}>to</Text>
        <Text style={styles.scoreValue}>{opponentScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingTop: spacing[72],
    paddingHorizontal: designTokens.siteGutter,
    paddingBottom: spacing[16],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.backgroundColor,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 24,
    height: 28,
    justifyContent: "center",
    marginRight: spacing[4],
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.iron,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: spacing[8],
    marginRight: spacing[4],
  },
  opponentInfo: {
    justifyContent: "center",
  },
  opponentName: {
    ...typography.headline6,
    color: theme.colors.iron,
    lineHeight: 20,
  },
  opponentTitle: {
    ...typography.tinyText,
    color: theme.colors.black45,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[8],
  },
  scoreValue: {
    ...typography.scoreText,
    color: theme.colors.black,
  },
  scoreLabel: {
    ...typography.tinyText,
    color: theme.colors.black45,
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
}));
