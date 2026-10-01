
import { useAuth, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import { useApi } from "@/lib/api";
import { router } from "expo-router";

// Lets the auth browser session close itself when the app is reopened from the redirect.
WebBrowser.maybeCompleteAuthSession();

export type SocialStrategy = "oauth_google" | "oauth_apple";
export type RequestedRole = "customer" | "vendor";

export default function useSocialAuth() {
  const [loadingStrategy, setLoadingStrategy] = useState<SocialStrategy | null>(null);
  const { startSSOFlow } = useSSO();
  const { isSignedIn, signOut } = useAuth();
  const api = useApi();

  // Faster browser start on Android.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleSocialAuth = useCallback(
    async (strategy: SocialStrategy, role?: RequestedRole) => {
      if (loadingStrategy) return;
      setLoadingStrategy(strategy);

      try {
        if (isSignedIn) await signOut();
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          // Needs a `scheme` in app.json; resolves to <scheme>://oauth-native-callback
          redirectUrl: AuthSession.makeRedirectUri({ path: "oauth-native-callback" }),
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          if (role) {
            const { data } = await api.post("/users/signup-role", { role });
            Toast.show({
              type: "success",
              text1: role === "vendor" ? "Seller account ready" : "Customer account ready",
            });
            router.replace(data.role === "vendor" ? "/(vendor-tabs)" : "/(customer-tabs)");
          }
        }
        if (!createdSessionId) {
          Toast.show({
            type: "error",
            text1: "Sign in incomplete",
            text2: "Finish the verification steps and try again.",
          });
        }
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Sign in failed",
          text2:
            error?.errors?.[0]?.longMessage ||
            error?.errors?.[0]?.message ||
            error?.message ||
            "Something went wrong. Please try again.",
        });
      } finally {
        setLoadingStrategy(null);
      }
    },
    [api, isSignedIn, loadingStrategy, signOut, startSSOFlow]
  );

  return { loadingStrategy, handleSocialAuth };
}