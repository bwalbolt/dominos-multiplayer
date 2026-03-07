import { Tabs } from "expo-router";

import { BottomNav } from "@/components/bottom-nav";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => {
        // Extract the options for the currently focused screen
        const activeRoute = props.state.routes[props.state.index];
        const { options } = props.descriptors[activeRoute.key];

        return (
          <BottomNav
            {...props}
            showNavShadow={(options as any).showNavShadow}
            navShadowColor={(options as any).navShadowColor}
          />
        );
      }}
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
