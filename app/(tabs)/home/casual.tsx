import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { Button } from "@/components/Button";
import { DifficultyButton } from "@/components/difficulty-button";
import { designTokens, spacing, typography } from "@/theme/tokens";

type Difficulty = "Easy" | "Medium" | "Hard";

// Dashboard ADD_NEW dashed border math
const ADD_NEW_SIZE = 62;
const ADD_NEW_RADIUS = spacing[8] - 1; // 7
// Perimeter of a rounded rectangle: 2 * width + 2 * height - 8 * r + 2 * PI * r
const ADD_NEW_PERIMETER =
  4 * ADD_NEW_SIZE - 8 * ADD_NEW_RADIUS + 2 * Math.PI * ADD_NEW_RADIUS;
const ADD_NEW_SEGMENT = ADD_NEW_PERIMETER / 18; // 18 segments
const ADD_NEW_DASH = ADD_NEW_SEGMENT / 2 + 1;
const ADD_NEW_GAP = ADD_NEW_SEGMENT / 2 - 1;

const MOCK_FRIENDS = [
  {
    id: "1",
    name: "Lilly289",
    image: require("@/assets/images/avatar(5).png"),
    isOnline: true,
  },
  {
    id: "2",
    name: "Mike",
    image: require("@/assets/images/avatar(1).png"),
    isOnline: true,
  },
  {
    id: "3",
    name: "Alex",
    image: require("@/assets/images/avatar(20).png"),
    isOnline: true,
  },
  {
    id: "4",
    name: "JoeBob\nChill",
    image: require("@/assets/images/avatar(12).png"),
    isOnline: false,
  },
  {
    id: "5",
    name: "Jessica",
    image: require("@/assets/images/avatar(22).png"),
    isOnline: false,
  },
];

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

        {/* Play a Friend Section */}
        <View style={styles.playAFriendSection}>
          <View style={styles.playAFriendHeader}>
            <Text style={styles.playAFriendTitle}>Play a Friend</Text>
            <Pressable hitSlop={8}>
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsScrollContent}
            style={styles.friendsScrollView}
          >
            {MOCK_FRIENDS.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <View style={styles.avatarContainer}>
                  <Image source={friend.image} style={styles.avatarImage} />
                  {friend.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <Text style={styles.friendName} numberOfLines={2}>
                  {friend.name}
                </Text>
              </View>
            ))}

            {/* Add New Button */}
            <Pressable style={styles.friendItem}>
              <View style={styles.addNewAvatar}>
                <Svg style={StyleSheet.absoluteFill}>
                  <Rect
                    x="1"
                    y="1"
                    width="62"
                    height="62"
                    rx={spacing[8] - 1}
                    ry={spacing[8] - 1}
                    stroke={designTokens.colors.black24}
                    strokeWidth="2"
                    strokeDasharray={`${ADD_NEW_DASH}, ${ADD_NEW_GAP}`}
                    fill="none"
                  />
                </Svg>
                <Image
                  source={require("@/assets/images/icons/plus-icon.svg")}
                  style={styles.addNewIcon}
                />
              </View>
              <Text style={styles.friendName}>Add New</Text>
            </Pressable>
          </ScrollView>
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
  playAFriendSection: {
    paddingBottom: spacing[40],
  },
  playAFriendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
    height: 24,
  },
  playAFriendTitle: {
    ...typography.labelText,
    color: designTokens.colors.iron,
  },
  viewAllText: {
    ...typography.headline6,
    color: designTokens.colors.blue,
  },
  friendsScrollView: {
    marginHorizontal: -designTokens.siteGutter,
  },
  friendsScrollContent: {
    paddingHorizontal: designTokens.siteGutter,
    gap: spacing[8],
  },
  friendItem: {
    alignItems: "center",
    width: 72,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    marginBottom: spacing[4],
    marginTop: 6,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: spacing[8],
    borderWidth: 1,
    borderColor: designTokens.colors.white,
  },
  onlineIndicator: {
    position: "absolute",
    top: -5,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designTokens.colors.green,
    borderWidth: 1,
    borderColor: designTokens.colors.white,
    zIndex: 1,
  },
  friendName: {
    ...typography.smallText,
    color: designTokens.colors.iron,
    textAlign: "center",
  },
  addNewAvatar: {
    width: 64,
    height: 64,
    borderRadius: spacing[8],
    backgroundColor: designTokens.colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
    marginTop: 6,
    position: "relative",
  },
  addNewIcon: {
    width: 16,
    height: 16,
    tintColor: designTokens.colors.black45,
  },
});
