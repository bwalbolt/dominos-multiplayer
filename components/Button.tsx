import { pillBorderRadius, spacing, typography } from "@/theme/tokens";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import Svg, {
    Defs,
    LinearGradient,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
export type ButtonVariant = "default" | "secondary" | "play" | "tertiary";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hasIcon?: boolean;
}

export function Button({
  label,
  variant = "default",
  onPress,
  disabled = false,
  style,
  hasIcon = false,
}: ButtonProps) {
  const { theme } = useUnistyles();
  const isDefault = variant === "default";

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
      {hasIcon && (
        <Image
          source={
            isDefault || variant === "play"
              ? require("@/assets/images/icons/Arrow_Right_SM.svg") // White arrow
              : require("@/assets/images/icons/Arrow_Right_SM.svg") // TODO: Provide dark arrow if needed
          }
          style={styles.icon}
          contentFit="contain"
          tintColor={isDefault || variant === "play" ? "#FFFFFF" : "#4E3D42"}
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
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {isDefault && buttonSize.width > 0 && buttonSize.height > 0 ? (
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
              <Stop offset="0%" stopColor={theme.colors.blurple} />
              <Stop offset="50%" stopColor={theme.colors.purple} />
              <Stop offset="100%" stopColor={theme.colors.pink} />
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
      ) : null}

      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
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
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    width: 16,
    height: 16,
    marginLeft: spacing[8],
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
    borderColor: theme.colors.white,
  },
  secondaryBase: {
    height: 56,
    borderRadius: pillBorderRadius,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[32],
    backgroundColor: theme.colors.backgroundColor,
  },
  playBase: {
    height: 48,
    borderRadius: spacing[32],
    paddingVertical: 12,
    paddingHorizontal: spacing[32],
    borderWidth: 3,
    borderColor: theme.colors.white,
    backgroundColor: "transparent",
  },
  tertiaryBase: {
    height: 48,
    borderRadius: spacing[32],
    paddingVertical: 12,
    paddingHorizontal: spacing[32],
    backgroundColor: theme.colors.black08,
  },
  // Variant label styles
  defaultLabel: {
    ...typography.buttonTextLarge,
    color: theme.colors.white,
  },
  secondaryLabel: {
    ...typography.buttonTextLarge,
    color: theme.colors.iron,
  },
  playLabel: {
    ...typography.buttonText,
    color: theme.colors.white,
  },
  tertiaryLabel: {
    ...typography.buttonText,
    color: theme.colors.iron,
  },
}));
