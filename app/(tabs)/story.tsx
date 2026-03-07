import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { colors, spacing, typography } from "@/theme/tokens";

export default function StoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Story Mode</Text>
      <Text style={styles.text}>(Coming Soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundColor,
  },
  headline: {
    ...typography.headline2,
    color: colors.iron,
    textAlign: "center",
    paddingHorizontal: spacing[24],
  },
  text: {
    ...typography.headline5,
    color: colors.iron,
    textAlign: "center",
    paddingHorizontal: spacing[24],
  },
});
