import {
  designTokens,
  gameEndLayout,
  pillBorderRadius,
  spacing,
  typography,
} from "@/theme/tokens";
import { Image } from "expo-image";
import type { ImageProps } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";
export type ButtonVariant = "default" | "secondary" | "play" | "tertiary";
export type ButtonSize = "default" | "compact";
export type ButtonIconPosition = "start" | "end";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hasIcon?: boolean;
  iconSource?: ImageProps["source"];
  iconTintColor?: string;
  iconPosition?: ButtonIconPosition;
}

export function Button({
  label,
  variant = "default",
  size = "default",
  onPress,
  disabled = false,
  style,
  hasIcon = false,
  iconSource,
  iconTintColor,
  iconPosition = "end",
}: ButtonProps) {
  const isDefault = variant === "default";
  const resolvedIconSource =
    iconSource ??
    (hasIcon ? require("@/assets/images/icons/Arrow_Right_SM.svg") : null);
  const resolvedIconTintColor =
    iconTintColor ??
    (isDefault || variant === "play"
      ? designTokens.colors.white
      : designTokens.colors.iron);

  // We explicitly measure button dimensions via onLayout.
  // DO NOT use StyleSheet.absoluteFillObject or 100% width/height on the Svg
  // as it causes the radial gradients to be cut off on some platforms.
  const [buttonSize, setButtonSize] = useState({ width: 0, height: 0 });

  const gradientIds = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2, 10);
    return {
      base: `btn-bg-base-${suffix}`,
      radialLeft: `btn-bg-radial-l-${suffix}`,
      radialRight: `btn-bg-radial-r-${suffix}`,
    };
  }, []);

  const content = (
    <View style={styles.contentContainer}>
      {resolvedIconSource && iconPosition === "start" && (
        <Image
          source={resolvedIconSource}
          style={[styles.icon, styles.iconStart]}
          contentFit="contain"
          tintColor={resolvedIconTintColor}
        />
      )}
      <Text
        style={[
          styles.label,
          styles[
            `${variant}Label` as
              | "defaultLabel"
              | "secondaryLabel"
              | "playLabel"
              | "tertiaryLabel"
          ],
        ]}
      >
        {label}
      </Text>
      {resolvedIconSource && iconPosition === "end" && (
        <Image
          source={resolvedIconSource}
          style={styles.icon}
          contentFit="contain"
          tintColor={resolvedIconTintColor}
        />
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width !== buttonSize.width || height !== buttonSize.height) {
          setButtonSize({ width, height });
        }
      }}
      style={({ pressed }) => [
        styles.buttonBase,
        styles[
          `${variant}Base` as
            | "defaultBase"
            | "secondaryBase"
            | "playBase"
            | "tertiaryBase"
        ],
        size === "compact" &&
          styles[
            `${variant}BaseCompact` as
              | "defaultBaseCompact"
              | "secondaryBaseCompact"
              | "playBaseCompact"
              | "tertiaryBaseCompact"
          ],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {isDefault && buttonSize.width > 0 && buttonSize.height > 0 && (
        <Svg
          width={buttonSize.width}
          height={buttonSize.height}
          style={[StyleSheet.absoluteFillObject, { position: "absolute" }]}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient
              id={gradientIds.base}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={designTokens.colors.blurple} />
              <Stop offset="50%" stopColor={designTokens.colors.purple} />
              <Stop offset="100%" stopColor={designTokens.colors.pink} />
            </LinearGradient>
            <RadialGradient
              id={gradientIds.radialLeft}
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
              id={gradientIds.radialRight}
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
            fill={`url(#${gradientIds.base})`}
          />
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gradientIds.radialLeft})`}
          />
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gradientIds.radialRight})`}
          />
        </Svg>
      )}

      {variant === "play" && buttonSize.width > 0 && buttonSize.height > 0 && (
        <Svg
          width={buttonSize.width}
          height={buttonSize.height}
          style={[StyleSheet.absoluteFillObject, { position: "absolute" }]}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient
              id={`${gradientIds.base}-play`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={designTokens.colors.blue} />
              <Stop offset="50%" stopColor={designTokens.colors.blurple} />
              <Stop offset="100%" stopColor={designTokens.colors.green} />
            </LinearGradient>
            <RadialGradient
              id={`${gradientIds.radialLeft}-play`}
              cx="0%"
              cy="100%"
              r="100%"
              fx="0%"
              fy="75%"
            >
              <Stop offset="0%" stopColor="#42C4FF" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id={`${gradientIds.radialRight}-play`}
              cx="75%"
              cy="0%"
              r="67%"
              fx="110%"
              fy="20%"
            >
              <Stop offset="0%" stopColor="#00EBD1" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gradientIds.base}-play)`}
          />
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gradientIds.radialLeft}-play)`}
          />
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gradientIds.radialRight}-play)`}
          />
        </Svg>
      )}

      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    width: 16,
    height: 16,
    marginLeft: spacing[8],
  },
  iconStart: {
    marginLeft: 0,
    marginRight: spacing[8],
  },
  label: {
    textAlign: "center",
  },
  // Variant base styles
  defaultBase: {
    height: 56,
    borderRadius: pillBorderRadius,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[32],
    borderWidth: 3,
    borderColor: designTokens.colors.white,
  },
  defaultBaseCompact: {
    height: gameEndLayout.compactButtonHeight,
    borderRadius: gameEndLayout.compactButtonRadius,
    paddingVertical: gameEndLayout.compactButtonVerticalPadding,
    paddingHorizontal: gameEndLayout.compactButtonHorizontalPadding,
  },
  secondaryBase: {
    height: 56,
    borderRadius: pillBorderRadius,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[32],
    backgroundColor: designTokens.colors.backgroundColor,
  },
  secondaryBaseCompact: {
    height: gameEndLayout.compactButtonHeight,
    borderRadius: gameEndLayout.compactButtonRadius,
    paddingVertical: gameEndLayout.compactButtonVerticalPadding,
    paddingHorizontal: gameEndLayout.compactButtonHorizontalPadding,
  },
  playBase: {
    height: 50,
    borderRadius: spacing[32],
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[32],
    borderWidth: 3,
    borderColor: designTokens.colors.white,
    backgroundColor: "transparent",
  },
  playBaseCompact: {
    height: gameEndLayout.compactButtonHeight,
    borderRadius: gameEndLayout.compactButtonRadius,
    paddingVertical: gameEndLayout.compactButtonVerticalPadding,
    paddingHorizontal: gameEndLayout.compactButtonHorizontalPadding,
  },
  tertiaryBase: {
    height: 48,
    borderRadius: spacing[32],
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[32],
    backgroundColor: designTokens.colors.black04,
  },
  tertiaryBaseCompact: {
    height: gameEndLayout.compactButtonHeight,
    borderRadius: gameEndLayout.compactButtonRadius,
    paddingVertical: gameEndLayout.compactButtonVerticalPadding,
    paddingHorizontal: gameEndLayout.compactButtonHorizontalPadding,
  },
  // Variant label styles
  defaultLabel: {
    ...typography.buttonTextLarge,
    color: designTokens.colors.white,
  },
  secondaryLabel: {
    ...typography.buttonTextLarge,
    color: designTokens.colors.iron,
  },
  playLabel: {
    ...typography.buttonText,
    color: designTokens.colors.white,
  },
  tertiaryLabel: {
    ...typography.buttonText,
    color: designTokens.colors.iron,
  },
});
