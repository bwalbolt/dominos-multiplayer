import { Tabs } from "expo-router";

import { BottomNav } from "@/components/bottom-nav";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="story" options={{ title: "Story" }} />
      <Tabs.Screen name="quests" options={{ title: "Quests" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
