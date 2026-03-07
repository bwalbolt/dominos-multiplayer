import {
  defaultBorderRadius,
  designTokens,
  spacing,
  typography,
} from "@/theme/tokens";
import { Image, ImageSource } from "expo-image";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface DifficultyButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  iconSource: ImageSource | string;
}

export function DifficultyButton({
  label,
  selected,
  onPress,
  iconSource,
}: DifficultyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        selected ? styles.selectedContainer : styles.unselectedContainer,
      ]}
    >
      <Image source={iconSource} style={styles.icon} contentFit="contain" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 96,
    borderRadius: defaultBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[8],
  },
  selectedContainer: {
    backgroundColor: designTokens.colors.backgroundColor, // F5F7FF
    shadowColor: designTokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    opacity: 1,
  },
  unselectedContainer: {
    opacity: 0.6,
  },
  icon: {
    width: 40,
    height: 40,
  },
  label: {
    ...typography.headline5,
    color: designTokens.colors.iron,
    textAlign: "center",
  },
});
