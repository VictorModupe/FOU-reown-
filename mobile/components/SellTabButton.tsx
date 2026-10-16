import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function SellTabButton({ onLongPress, style, testID }: BottomTabBarButtonProps) {
  const { isDark } = useTheme();
  const accent = isDark ? "#D6BEDF" : "#4F2B50";
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Pressable
      accessibilityLabel="Sell a product"
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={() => router.push("/product/create")}
      style={[style, styles.button]}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.iconButton,
          { backgroundColor: accent, shadowColor: accent, transform: [{ scale: pulse }] },
        ]}
      >
        <Ionicons name="pricetag" size={25} color="#FFFFFF" />
      </Animated.View>
      <Text style={[styles.label, { color: accent }]}>Sell</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -8 }],
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
  },
});
