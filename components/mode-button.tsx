import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";
import { designTokens } from "../theme/tokens";

export type ModeButtonColor = "blue" | "purple" | "green" | "pink";

export type ModeButtonProps = {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  colorTheme?: ModeButtonColor;
};

const getBaseColor = (colorTheme: ModeButtonColor) => {
  switch (colorTheme) {
    case "blue":
      return designTokens.colors.blue;
    case "purple":
      return designTokens.colors.purple;
    case "green":
      return designTokens.colors.green;
    case "pink":
      return designTokens.colors.pink;
  }
};

export function ModeButton({
  title,
  subtitle,
  icon,
  onPress,
  colorTheme = "blue",
}: ModeButtonProps) {
  const baseColor = getBaseColor(colorTheme);

  return (
    <View style={styles.shadowContainer}>
      <Pressable style={styles.innerContainer} onPress={onPress}>
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient
                id={`grad-${colorTheme}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor={baseColor} stopOpacity={0.32} />
                <Stop offset="50%" stopColor={baseColor} stopOpacity={0.06} />
                <Stop offset="100%" stopColor={baseColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill={`url(#grad-${colorTheme})`}
            />
          </Svg>
        </View>
        <View style={styles.innerShadowOverlay} pointerEvents="none" />
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    flex: 1,
    height: 114,
    backgroundColor: designTokens.colors.backgroundColor,
    borderRadius: designTokens.defaultBorderRadius,
    shadowColor: designTokens.colors.shadow,
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.backgroundColor,
    borderRadius: designTokens.defaultBorderRadius,
    paddingTop: designTokens.spacing[8],
    paddingBottom: designTokens.spacing[8],
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  innerShadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: designTokens.defaultBorderRadius,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  iconContainer: {
    height: 66,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...designTokens.typography.headline6,
    color: designTokens.colors.iron,
    textAlign: "center",
  },
  subtitle: {
    ...designTokens.typography.tinyText,
    color: designTokens.colors.black45,
    textAlign: "center",
  },
});
