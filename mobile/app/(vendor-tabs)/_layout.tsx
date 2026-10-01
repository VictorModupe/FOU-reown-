import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const vendorAccent = isDark ? "#75D7BE" : "#087F68";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: vendorAccent,
        tabBarInactiveTintColor: isDark ? "#A9BDB8" : "#687B75",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isDark ? "rgba(22, 39, 35, 0.96)" : "rgba(239, 248, 244, 0.96)",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? "#3C5A50" : "#C7DED5",
          height: 64 + insets.bottom,
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
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
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
