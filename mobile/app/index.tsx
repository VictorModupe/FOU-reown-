import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import useCurrentUser from "@/hooks/useCurrentUser";
import { authTestMode } from "@/lib/authConfig";

export default function IndexRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const { data: currentUser, isLoading } = useCurrentUser();

  // if (authTestMode) return <Redirect href="/(routes)/login" />;
  if (!isLoaded || (isSignedIn && isLoading)) return null;
  if (isSignedIn && currentUser) {
    return <Redirect href={currentUser.role === "vendor" ? "/(vendor-tabs)" : "/(customer-tabs)"} />;
  }

  return <Redirect href="/onboarding" />;
}
