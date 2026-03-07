import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
  Text as SvgText,
} from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Button } from "@/components/Button";

import {
  defaultBorderRadius,
  siteGutter,
  spacing,
  typography,
} from "@/theme/tokens";

const AVATARS = [
  require("@/assets/images/avatar(2).png"),
  require("@/assets/images/avatar(9).png"),
  require("@/assets/images/avatar(6).png"),
  require("@/assets/images/avatar(4).png"),
  require("@/assets/images/avatar(20).png"),
  require("@/assets/images/avatar(22).png"),
  require("@/assets/images/avatar(21).png"),
  require("@/assets/images/avatar(23).png"),
  require("@/assets/images/avatar(19).png"),
  require("@/assets/images/avatar(16).png"),
  require("@/assets/images/avatar(12).png"),
  require("@/assets/images/avatar(17).png"),
  require("@/assets/images/avatar(5).png"),
  require("@/assets/images/avatar(7).png"),
  require("@/assets/images/avatar.png"),
  require("@/assets/images/avatar(1).png"),
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const isValid = displayName.trim().length > 0 && selectedAvatar !== null;

  return (
    <View style={styles.safeArea}>
      <Svg style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient
            id="welcome-bg-linear"
            x1="95%"
            y1="0%"
            x2="50%"
            y2="50%"
          >
            <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#544EE8" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
          </SvgLinearGradient>
          <RadialGradient id="welcome-bg-radial" cx="0%" cy="720px" r="70%">
            <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.2" />
            <Stop offset="50%" stopColor="#544EE8" stopOpacity="0.02" />
            <Stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#welcome-bg-linear)" />
        <Rect width="100%" height="100%" fill="url(#welcome-bg-radial)" />
      </Svg>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollRef}
          bounces={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: spacing[24] + insets.top,
              paddingBottom: spacing[32] + insets.bottom,
            },
          ]}
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dominoMarkContainer}>
              <Image
                source={require("@/assets/images/dominoes-icon.svg")}
                style={styles.dominoMark}
                contentFit="contain"
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleBase}>Welcome to </Text>
              {/* This invisible text pushes the layout of the title */}
              <View>
                <Text style={[styles.titleMask, { opacity: 0 }]}>
                  Dominoes!
                </Text>

                {/* SVG text floats exactly over the layout footprint left by the text above */}
                <Svg style={StyleSheet.absoluteFillObject}>
                  <Defs>
                    <SvgLinearGradient
                      id="welcome-title-grad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <Stop offset="0%" stopColor={theme.colors.blurple} />
                      <Stop offset="50%" stopColor={theme.colors.blue} />
                      <Stop offset="100%" stopColor={theme.colors.purple} />
                    </SvgLinearGradient>
                  </Defs>
                  <SvgText
                    fill="url(#welcome-title-grad)"
                    fontSize={40}
                    fontFamily={typography.headline2.fontFamily}
                    fontWeight={900}
                    y="40"
                    x="0"
                  >
                    Dominoes!
                  </SvgText>
                </Svg>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Let&apos;s get your profile set up to start playing.
            </Text>
          </View>

          {/* Avatar Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose your avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((source, index) => (
                <AvatarItem
                  key={index}
                  source={source}
                  index={index}
                  selectedAvatar={selectedAvatar}
                  onSelect={setSelectedAvatar}
                />
              ))}
            </View>
          </View>

          {/* Display Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pick a display name</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Image
                  source={require("@/assets/images/icons/User_Square.svg")}
                  style={styles.inputIcon}
                  contentFit="contain"
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="DominoMaster"
                  placeholderTextColor={styles.placeholder.color as string}
                  value={displayName}
                  onChangeText={setDisplayName}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isValid && (
                  <Image
                    source={require("@/assets/images/icons/Check.svg")}
                    style={styles.checkIcon}
                    contentFit="contain"
                  />
                )}
              </View>
            </View>
            <Text style={styles.helperText}>
              This name will be visible to other players.
            </Text>
          </View>

          {/* Bottom Action */}
          <View style={styles.bottomAction}>
            <Button
              label="Start Playing"
              variant="default"
              hasIcon={true}
              disabled={!isValid}
              onPress={() => {
                router.replace("/(tabs)" as any);
              }}
            />
            <Pressable
              onPress={() => Linking.openURL("https://example.com/terms")}
            >
              <Text style={styles.termsText}>
                By continuing, you agree to our{" "}
                <Text style={styles.termsLink}>Terms of Service</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: siteGutter,
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
  },
  header: {
    alignItems: "center",
    marginBottom: spacing[32],
  },
  dominoMarkContainer: {
    width: 47,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[24],
  },
  dominoMark: {
    width: 47,
    height: 40,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: spacing[16],
  },
  titleBase: {
    ...typography.headline2,
    color: theme.colors.iron,
  },
  titleMask: {
    ...typography.headline2,
    color: theme.colors.black,
  },
  subtitle: {
    ...typography.paragraph,
    color: theme.colors.black66,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing[32],
  },
  sectionTitle: {
    ...typography.labelText,
    color: theme.colors.iron,
    marginBottom: spacing[16],
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing[8],
  },
  avatarButton: {
    width: "23.3%", // Matches approximately 82.5 out of 354, with gaps in between
    aspectRatio: 1,
    borderRadius: defaultBorderRadius,
  },
  avatarSelectedContainer: {
    shadowColor: theme.colors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: theme.colors.white, // Ensure shadow casts correctly
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: defaultBorderRadius,
    borderWidth: 3,
    borderColor: "transparent",
    overflow: "hidden",
  },
  avatarSelectedImage: {
    borderColor: theme.colors.blue,
  },
  inputWrapper: {
    marginBottom: spacing[16],
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.black08,
    borderRadius: defaultBorderRadius,
    paddingHorizontal: spacing[16],
    height: 56,
  },
  inputIcon: {
    width: 24,
    height: 24,
    marginRight: spacing[8],
  },
  textInput: {
    flex: 1,
    ...typography.inputText,
    color: theme.colors.iron,
    paddingVertical: 0,
  },
  placeholder: {
    color: theme.colors.black24,
  },
  checkIcon: {
    width: 24,
    height: 24,
    marginLeft: spacing[8],
  },
  helperText: {
    ...typography.smallText,
    color: theme.colors.black45,
  },
  bottomAction: {
    marginTop: "auto",
    alignItems: "center",
  },
  termsText: {
    ...typography.smallText,
    color: theme.colors.black66,
    textAlign: "center",
    marginTop: spacing[16],
  },
  termsLink: {
    color: theme.colors.linkColor,
  },
}));

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AvatarItem({
  source,
  index,
  selectedAvatar,
  onSelect,
}: {
  source: any;
  index: number;
  selectedAvatar: number | null;
  onSelect: (index: number) => void;
}) {
  const isSelected = selectedAvatar === index;
  const hasSelection = selectedAvatar !== null;

  const animatedStyle = useAnimatedStyle(() => {
    let targetOpacity = 1;
    if (hasSelection && !isSelected) {
      targetOpacity = 0.6;
    }
    return {
      opacity: withTiming(targetOpacity, { duration: 300 }),
    };
  }, [hasSelection, isSelected]);

  return (
    <AnimatedPressable
      style={[
        styles.avatarButton,
        isSelected && styles.avatarSelectedContainer,
        animatedStyle,
      ]}
      onPress={() => onSelect(index)}
    >
      <Image
        source={source}
        style={[styles.avatarImage, isSelected && styles.avatarSelectedImage]}
        contentFit="cover"
      />
    </AnimatedPressable>
  );
}
