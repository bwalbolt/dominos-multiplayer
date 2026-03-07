import { Image } from "expo-image";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { GameCard } from "@/components/game-card";
import { ModeButton } from "@/components/mode-button";
import { designTokens, spacing, typography } from "@/theme/tokens";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFillObject}>
          <Defs>
            <SvgLinearGradient
              id="welcome-bg-linear"
              x1="95%"
              y1="0%"
              x2="50%"
              y2="50%"
            >
              <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.35" />
              <Stop offset="50%" stopColor="#544EE8" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
            </SvgLinearGradient>
            <RadialGradient id="welcome-bg-radial" cx="0%" cy="720px" r="70%">
              <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.1" />
              <Stop offset="50%" stopColor="#544EE8" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#welcome-bg-linear)" />
          <Rect width="100%" height="100%" fill="url(#welcome-bg-radial)" />
        </Svg>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 56) }]}>
          <View style={styles.headerProfile}>
            <Image
              source={require("@/assets/images/avatar(4).png")}
              style={styles.headerAvatar}
            />
            <View style={styles.headerNameContainer}>
              <Text style={styles.headerName}>Clicky McClickerson</Text>
              <Text style={styles.headerLevel}>Lvl. 12</Text>
            </View>
          </View>

          <View style={styles.headerBalanceContainer}>
            <View style={styles.balancePill}>
              <Image
                source={require("@/assets/images/icons/coin-icon.svg")}
                style={styles.coinIcon}
              />
              <Text style={styles.balanceText}>4,250</Text>
              <View style={styles.plusButton}>
                <Image
                  source={require("@/assets/images/icons/plus-icon.svg")}
                  style={styles.plusIcon}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Active Games Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Games</Text>
          <View style={styles.activeGamesList}>
            <GameCard
              name="Sarah M."
              timeAgo="5 mins ago"
              avatarSource={require("@/assets/images/avatar(17).png")}
              myScore={45}
              opponentScore={60}
            />
            <GameCard
              name="Computer (Easy)"
              timeAgo="25 mins ago"
              avatarSource={require("@/assets/images/avatar(9).png")}
              myScore={75}
              opponentScore={20}
            />
            <GameCard
              name="John Doe"
              timeAgo="2 days ago"
              avatarSource={require("@/assets/images/avatar(7).png")}
              myScore={110}
              opponentScore={130}
              isWaiting
            />
          </View>
        </View>

        {/* Get Started Section */}
        <View style={[styles.section, { marginTop: spacing[32] }]}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <ModeButton
                title="Casual Game"
                subtitle="No timer"
                icon={
                  <Image
                    source={require("@/assets/images/casual-icon.svg")}
                    style={styles.casualIcon}
                    contentFit="contain"
                  />
                }
                colorTheme="blue"
              />
              <View style={{ width: spacing[16] }} />
              <ModeButton
                title="Ranked Play"
                subtitle="Competitive"
                icon={
                  <Image
                    source={require("@/assets/images/ranked-icon.svg")}
                    style={styles.rankedIcon}
                    contentFit="contain"
                  />
                }
                colorTheme="purple"
              />
            </View>
            <View style={{ height: spacing[16] }} />
            <View style={styles.gridRow}>
              <ModeButton
                title="Daily Bonus"
                subtitle="Free rewards"
                icon={
                  <Image
                    source={require("@/assets/images/daily-icon.svg")}
                    style={styles.dailyIcon}
                    contentFit="contain"
                  />
                }
                colorTheme="green"
              />
              <View style={{ width: spacing[16] }} />
              <ModeButton
                title="Shop"
                subtitle="New skins!"
                icon={
                  <Image
                    source={require("@/assets/images/shop-icon.svg")}
                    style={styles.shopIcon}
                    contentFit="contain"
                  />
                }
                colorTheme="pink"
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing[24],
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: spacing[8],
  },
  headerNameContainer: {
    marginLeft: spacing[4],
  },
  headerName: {
    ...typography.headline6,
    color: designTokens.colors.iron,
  },
  headerLevel: {
    ...typography.tinyText,
    color: designTokens.colors.black45,
    marginTop: spacing[2],
  },
  headerBalanceContainer: {
    justifyContent: "center",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.colors.backgroundColor,
    borderRadius: 9999,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderWidth: 1,
    borderColor: designTokens.colors.black08,
  },
  coinIcon: {
    width: 19,
    height: 18,
  },
  balanceText: {
    ...typography.smallText,
    fontWeight: designTokens.fontWeights.bold,
    color: designTokens.colors.black66,
    marginLeft: 6,
    marginRight: 6,
  },
  plusButton: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: designTokens.colors.black08,
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    width: 7,
    height: 7,
  },
  scrollContent: {
    paddingHorizontal: designTokens.siteGutter,
    paddingBottom: spacing[32],
  },
  section: {},
  sectionTitle: {
    ...typography.labelText,
    color: designTokens.colors.black66,
    marginBottom: spacing[8],
  },
  activeGamesList: {
    rowGap: spacing[8],
  },
  gridContainer: {},
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  casualIcon: { width: 40, height: 49 },
  rankedIcon: { width: 35, height: 50 },
  dailyIcon: { width: 46, height: 50 },
  shopIcon: { width: 55, height: 50 },
});
