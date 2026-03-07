import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { Button } from "@/components/Button";
import { DifficultyButton } from "@/components/difficulty-button";
import { designTokens, spacing, typography } from "@/theme/tokens";

type Difficulty = "Easy" | "Medium" | "Hard";

export default function CasualGameSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, spacing[64]) },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={require("@/assets/images/icons/Chevron_Left_MD.svg")}
            style={styles.backIcon}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Casual Game</Text>
        <View style={styles.placeholder} />

        <View style={styles.headerGradientStrip}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient
                id="header-strip"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor={designTokens.colors.blue} />
                <Stop offset="50%" stopColor={designTokens.colors.blurple} />
                <Stop offset="100%" stopColor={designTokens.colors.green} />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#header-strip)"
            />
          </Svg>
        </View>
      </View>

      <View style={styles.content}>
        {/* Vs Computer Section */}
        <View style={styles.vsComputerSection}>
          <View style={styles.vsComputerHeader}>
            <Text style={styles.vsComputerTitle}>Vs Computer</Text>
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline mode</Text>
            </View>
          </View>

          <View style={styles.difficultyContainer}>
            <DifficultyButton
              label="Easy"
              iconSource={require("@/assets/images/computer-easy-icon.svg")}
              selected={difficulty === "Easy"}
              onPress={() => setDifficulty("Easy")}
            />
            <DifficultyButton
              label="Medium"
              iconSource={require("@/assets/images/computer-medium-icon.svg")}
              selected={difficulty === "Medium"}
              onPress={() => setDifficulty("Medium")}
            />
            <DifficultyButton
              label="Hard"
              iconSource={require("@/assets/images/computer-hard-icon.svg")}
              selected={difficulty === "Hard"}
              onPress={() => setDifficulty("Hard")}
            />
          </View>

          <Button
            label="Play Computer"
            variant="play"
            hasIcon
            onPress={() => console.log("Play Computer", difficulty)}
            style={styles.playButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.backgroundColor,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: designTokens.siteGutter,
    paddingBottom: spacing[16],
    backgroundColor: designTokens.colors.backgroundColor,
    borderBottomWidth: 2,
    borderBottomColor: designTokens.colors.white,
    shadowColor: designTokens.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  headerGradientStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...typography.headline4,
    color: designTokens.colors.iron,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.siteGutter,
    paddingTop: spacing[8],
  },
  vsComputerSection: {
    paddingTop: spacing[16],
    marginBottom: spacing[40],
  },
  vsComputerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[16],
    height: 24,
  },
  vsComputerTitle: {
    ...typography.labelText,
    color: designTokens.colors.iron,
  },
  offlineBadge: {
    backgroundColor: designTokens.colors.backgroundColor,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: spacing[8],
    borderWidth: 1,
    borderColor: designTokens.colors.black08,
  },
  offlineText: {
    ...typography.smallText,
    color: designTokens.colors.black66,
  },
  difficultyContainer: {
    flexDirection: "row",
    backgroundColor: designTokens.colors.black04,
    borderRadius: spacing[8],
    padding: 2,
    marginBottom: spacing[16],
  },
  playButton: {
    // using Button default variant for now
  },
});
