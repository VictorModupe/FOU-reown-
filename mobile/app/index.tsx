import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function IndexRedirect() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { data: currentUser, isLoading, refetch } = useCurrentUser();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/onboarding" />;
  if (isLoading) return null;

  if (currentUser) {
    return <Redirect href={currentUser.role === "vendor" ? "/(vendor-tabs)" : "/(customer-tabs)"} />;
  }

  // Signed in, but /users/me failed: don't send them to auth screens
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
        Couldn't load your account
      </Text>
      <TouchableOpacity onPress={() => refetch()} style={{ padding: 12 }}>
        <Text>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => signOut()} style={{ padding: 12 }}>
        <Text>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}