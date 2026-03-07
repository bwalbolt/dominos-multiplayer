import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { designTokens, spacing, typography } from "@/theme/tokens";

export default function CasualGameSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 56) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={require("@/assets/images/icons/Arrow_Left.svg")}
            style={styles.backIcon}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Casual Game</Text>
        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.backgroundColor,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: designTokens.siteGutter,
    paddingBottom: spacing[16],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...typography.headline3,
    color: designTokens.colors.iron,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});
