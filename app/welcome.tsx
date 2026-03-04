import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import {
  defaultBorderRadius,
  siteGutter,
  spacing,
  typography,
} from "./theme/tokens";

export default function WelcomeScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Welcome</Text>
          <Text style={styles.title}>Profile setup is loading next.</Text>
          <Text style={styles.subtitle}>
            This route now owns the app&apos;s initial launch experience.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: siteGutter,
    paddingVertical: spacing[32],
  },
  hero: {
    alignItems: "center",
    borderColor: theme.colors.black08,
    borderRadius: defaultBorderRadius,
    borderWidth: 1,
    backgroundColor: theme.colors.white,
    paddingHorizontal: siteGutter,
    paddingVertical: spacing[32],
  },
  eyebrow: {
    ...typography.labelText,
    color: theme.colors.blue,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    ...typography.headline2,
    color: theme.colors.iron,
    marginBottom: spacing[16],
    textAlign: "center",
  },
  subtitle: {
    ...typography.paragraph,
    color: theme.colors.black66,
    textAlign: "center",
  },
}));
