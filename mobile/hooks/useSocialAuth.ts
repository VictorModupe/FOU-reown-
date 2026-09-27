
import { useAuth, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

// Lets the auth browser session close itself when the app is reopened from the redirect.
WebBrowser.maybeCompleteAuthSession();

export type SocialStrategy = "oauth_google" | "oauth_apple";
export type RequestedRole = "customer" | "vendor";

export default function useSocialAuth() {
  const [loadingStrategy, setLoadingStrategy] = useState<SocialStrategy | null>(null);
  const { startSSOFlow } = useSSO();
  const { isSignedIn, signOut } = useAuth();

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
          // Only passed on sign-UP. It is a request; your backend decides the real role.
          ...(role ? { unsafeMetadata: { role } } : {}),
        });

        if (createdSessionId && setActive) {
          // (auth)/_layout sees the signed-in state and redirects to the right dashboard.
          await setActive({ session: createdSessionId });
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
    [isSignedIn, loadingStrategy, signOut, startSSOFlow]
  );

  return { loadingStrategy, handleSocialAuth };
}