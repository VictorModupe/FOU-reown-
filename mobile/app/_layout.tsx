import { Stack } from "expo-router";
import "../global.css";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import Providers from "@/config/providers";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Kenao: require("../assets/fonts/Kenao.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
      taskUrls={{
        "choose-organization": "/(routes)/login",
        "reset-password": "/(routes)/login",
      }}>
      <ThemeProvider>
        <ThemeRoot />
      </ThemeProvider>
      <Toast config={toastConfig} topOffset={56} />
    </ClerkProvider>
  );
}

const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={[styles.toast, styles.successToast]}>
      <View style={styles.icon}><Text style={styles.iconText}>✓</Text></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{text1}</Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={[styles.toast, styles.errorToast]}>
      <View style={[styles.icon, styles.errorIcon]}><Text style={styles.iconText}>!</Text></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{text1}</Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  toast: { alignSelf: "center", width: "90%", flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, borderWidth: 1, shadowColor: "#1d1620", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
  successToast: { backgroundColor: "#fffaf2", borderColor: "#f0d7a7" },
  errorToast: { backgroundColor: "#fff6f5", borderColor: "#efb8b2" },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#4f2b50" },
  errorIcon: { backgroundColor: "#b83232" },
  iconText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  copy: { flex: 1, marginLeft: 11 },
  title: { color: "#241b26", fontSize: 15, fontWeight: "800" },
  message: { color: "#241b26", fontSize: 13, marginTop: 2 },
});

function ThemeRoot() {
  const { themeVariables } = useTheme();
  const { isLoaded } = useAuth();

  if (!isLoaded) return null;

  return (
    <View className="flex-1" style={themeVariables}>
      <GestureHandlerRootView style={styles.root}>
        <Providers>
          <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding/index" />
          </Stack>
        </Providers>
      </GestureHandlerRootView>
    </View>
  );
}