import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#D6BEDF" : "#4F2B50",
        tabBarInactiveTintColor: isDark ? "#B9ADB9" : "#796D7F",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isDark ? "rgba(35, 28, 38, 0.94)" : "rgba(251, 248, 253, 0.94)",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? "#514558" : "#DED4E4",
          height: 50 + insets.bottom,
          paddingTop: 6,
          marginHorizontal: 12,
          marginBottom: insets.bottom,
          borderRadius: 20,
          overflow: "hidden",
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
            // StyleSheet.absoluteFill is equal to this 👇
            // { position: "absolute", top: 0, right: 0, left: 0, bottom: 0 }
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
