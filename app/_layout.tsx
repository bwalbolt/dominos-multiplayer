import { Stack } from "expo-router";

import "@/theme/unistyles";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
