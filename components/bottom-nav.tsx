import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { colors, spacing } from "@/theme/tokens";

const ICONS: Record<string, { active: any; inactive: any }> = {
  index: {
    active: require("@/assets/images/icons/nav-home-active.svg"),
    inactive: require("@/assets/images/icons/nav-home.svg"),
  },
  story: {
    active: require("@/assets/images/icons/nav-story-active.svg"),
    inactive: require("@/assets/images/icons/nav-story.svg"),
  },
  quests: {
    active: require("@/assets/images/icons/nav-quests-active.svg"),
    inactive: require("@/assets/images/icons/nav-quests.svg"),
  },
  more: {
    active: require("@/assets/images/icons/nav-more-active.svg"),
    inactive: require("@/assets/images/icons/nav-more.svg"),
  },
};

export type CustomBottomTabBarProps = BottomTabBarProps & {
  showNavShadow?: boolean;
  navShadowColor?: string;
};

export function BottomNav({
  state,
  descriptors,
  navigation,
  showNavShadow = true,
  navShadowColor = "#274E56",
}: CustomBottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {showNavShadow && (
        <View style={styles.shadowContainer} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient
                id="nav-shadow-gradient"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
              >
                <Stop
                  offset="0%"
                  stopColor={navShadowColor}
                  stopOpacity={0.16}
                />
                <Stop
                  offset="100%"
                  stopColor={navShadowColor}
                  stopOpacity={0}
                />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#nav-shadow-gradient)" />
          </Svg>
        </View>
      )}
      <View
        style={[
          styles.navBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing[16] },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const iconAssets = ICONS[route.name];

          if (!iconAssets) {
            return null; // Don't render if icon is missing
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onPress}
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={isFocused ? iconAssets.active : iconAssets.inactive}
                  style={styles.icon}
                  contentFit="contain"
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    // We don't want the container to block touches below it, but we need it for positioning.
    pointerEvents: "box-none",
  },
  shadowContainer: {
    position: "absolute",
    bottom: "100%", // Sitting right on top of the navBar
    width: "80%", // 80% viewport width per figma
    height: 40, // 20px tall visually, but we need 2x height for the radial gradient to simulate a vertical ellipse properly
    transform: [{ translateY: 20 }], // Shift down half so the top 20px bleeds above the nav
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: colors.backgroundColor,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)", // From Figma
    paddingHorizontal: spacing[8],
    paddingTop: spacing[8],
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    // Shadow from Figma constraints if applicable, or generic subtle shadow
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 30, // Default bounding box for inactive
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
});
