import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { ProfileCard } from "@/components/profile-card";
import { StatCard } from "@/components/stat-card";
import { colors, siteGutter, spacing, typography } from "@/theme/tokens";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const [headerSize, setHeaderSize] = useState({ width: 0, height: 0 });

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.profileHeader,
            { paddingTop: insets.top + spacing[8] },
          ]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== headerSize.width || height !== headerSize.height) {
              setHeaderSize({ width, height });
            }
          }}
        >
          {headerSize.width > 0 && headerSize.height > 0 && (
            <Svg
              width={headerSize.width}
              height={headerSize.height}
              style={[StyleSheet.absoluteFillObject, { position: "absolute" }]}
              pointerEvents="none"
            >
              <Defs>
                <LinearGradient
                  id="profile-grad-base"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor={colors.blurple} />
                  <Stop offset="50%" stopColor={colors.purple} />
                  <Stop offset="100%" stopColor={colors.pink} />
                </LinearGradient>
                <RadialGradient
                  id="profile-grad-radial-l"
                  cx="0%"
                  cy="75%"
                  r="47%"
                  fx="0%"
                  fy="75%"
                >
                  <Stop offset="0%" stopColor="#8588FC" stopOpacity="0.78" />
                  <Stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient
                  id="profile-grad-radial-r"
                  cx="110%"
                  cy="20%"
                  r="67%"
                  fx="110%"
                  fy="20%"
                >
                  <Stop offset="22%" stopColor="#B466FF" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#B466FF" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#profile-grad-base)"
              />
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#profile-grad-radial-l)"
              />
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#profile-grad-radial-r)"
              />
            </Svg>
          )}

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <ProfileCard />
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.statsRow}>
            <View style={styles.statWrapper}>
              <StatCard
                title="Total Wins"
                value="48"
                todaysWins={3}
                iconType="trophy"
              />
            </View>
            <View style={styles.statWrapper}>
              <StatCard title="Win Rate" value="62" unit="%" iconType="stats" />
            </View>
          </View>

          {/* Recent Matches will go here */}
          <View style={{ height: 300 }} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundColor,
  },
  contentContainer: {
    paddingBottom: 112, // Enough space for BottomNav + padding
  },
  profileHeader: {
    paddingHorizontal: siteGutter,
    paddingBottom: spacing[24],
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[32],
  },
  headerTitle: {
    ...typography.headline4,
    color: colors.white,
  },
  bottomSection: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[24],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[8],
  },
  statWrapper: {
    flex: 1,
  },
});
