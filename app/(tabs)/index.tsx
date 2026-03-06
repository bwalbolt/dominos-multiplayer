import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { colors, spacing, typography } from "@/theme/tokens";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen Placeholder</Text>
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
  text: {
    ...typography.headline4,
    color: colors.iron,
    textAlign: "center",
    paddingHorizontal: spacing[24],
  },
});
