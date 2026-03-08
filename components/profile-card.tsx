import { useState } from "react";
import { Image, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import {
  colors,
  defaultBorderRadius,
  spacing,
  typography,
} from "@/theme/tokens";

export function ProfileCard() {
  const [badgeSize, setBadgeSize] = useState({ width: 0, height: 0 });
  const [xpFillSize, setXpFillSize] = useState({ width: 0, height: 0 });

  return (
    <View style={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <Image
            source={require("@/assets/images/avatar(4).png")}
            style={styles.avatar}
          />
        </View>
        <View
          style={styles.levelBadge}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== badgeSize.width || height !== badgeSize.height) {
              setBadgeSize({ width, height });
            }
          }}
        >
          {badgeSize.width > 0 && badgeSize.height > 0 && (
            <Svg
              width={badgeSize.width}
              height={badgeSize.height}
              style={[StyleSheet.absoluteFillObject, { position: "absolute" }]}
              pointerEvents="none"
            >
              <Defs>
                <LinearGradient
                  id="level-grad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <Stop offset="0%" stopColor="#FACC15" />
                  <Stop offset="100%" stopColor="#F97316" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#level-grad)" />
            </Svg>
          )}
          <Text style={styles.levelText}>Level 12</Text>
        </View>
      </View>

      {/* Name and Title */}
      <View style={styles.nameSection}>
        <Text style={styles.name}>Clicky McClickerson</Text>
        <Text style={styles.title}>Novice</Text>
      </View>

      {/* XP Bar */}
      <View style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>Experience Progress</Text>
          <Text style={styles.xpValue}>1,250 / 2,000</Text>
        </View>
        <View style={styles.xpTrack}>
          <View
            style={[styles.xpFill, { width: "62.5%" }]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              if (width !== xpFillSize.width || height !== xpFillSize.height) {
                setXpFillSize({ width, height });
              }
            }}
          >
            {xpFillSize.width > 0 && xpFillSize.height > 0 && (
              <Svg
                width={xpFillSize.width}
                height={xpFillSize.height}
                style={[
                  StyleSheet.absoluteFillObject,
                  { position: "absolute" },
                ]}
                pointerEvents="none"
              >
                <Defs>
                  <LinearGradient
                    id="xp-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <Stop offset="0%" stopColor={colors.blurple} />
                    <Stop offset="50%" stopColor={colors.blue} />
                    <Stop offset="100%" stopColor={colors.green} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#xp-grad)" />
              </Svg>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing[32],
  },
  avatarWrapper: {
    width: 112,
    height: 112,
    borderRadius: 16,
    backgroundColor: colors.black08,
    borderWidth: 4,
    borderColor: colors.white24,
    padding: spacing[4],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: defaultBorderRadius,
  },
  levelBadge: {
    position: "absolute",
    bottom: -10,
    borderWidth: 1,
    borderColor: colors.white24,
    borderRadius: 9999,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[16],
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  levelText: {
    ...typography.smallText,
    color: colors.white,
  },
  nameSection: {
    alignItems: "center",
    marginBottom: spacing[16],
  },
  name: {
    ...typography.headline3,
    color: colors.white,
    marginBottom: spacing[4],
  },
  title: {
    ...typography.headline6,
    color: colors.white,
    fontWeight: "400",
  },
  xpCard: {
    width: "75%",
    backgroundColor: colors.black08,
    borderColor: colors.white08,
    borderWidth: 1,
    borderRadius: spacing[16],
    padding: spacing[16],
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[8],
  },
  xpLabel: {
    ...typography.tinyText,
    color: colors.white,
  },
  xpValue: {
    ...typography.tinyText,
    color: colors.white,
  },
  xpTrack: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderRadius: 9999,
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
  },
  xpFill: {
    height: "100%",
    borderRadius: 9999,
    overflow: "hidden",
  },
});
