import ProfileAvatar from "@/components/ProfileAvatar";
import SafeScreen from "@/components/SafeScreen";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useApi } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function EditProfileScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const { data: account, isLoading: accountLoading } = useCurrentUser();
  const api = useApi();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    } else if (account?.name) {
      const [first = "", ...rest] = account.name.split(" ");
      setFirstName(first);
      setLastName(rest.join(" "));
    }
  }, [user?.id, user?.firstName, user?.lastName, account?.name]);

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.replace("/(routes)/login");
  }, [authLoaded, isSignedIn]);

  const displayEmail = user?.primaryEmailAddress?.emailAddress
    || user?.emailAddresses[0]?.emailAddress
    || account?.email
    || "Email unavailable";
  const accountRole = account?.role === "vendor"
    ? "Seller"
    : account?.role === "customer"
      ? "Customer"
      : account?.role === "admin"
        ? "Admin"
        : "Not assigned";
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const saveProfile = async () => {
    if (!user || !fullName || fullName.length < 2 || fullName.length > 80) {
      Toast.show({ type: "error", text1: "Check your name", text2: "Enter a name between 2 and 80 characters." });
      return;
    }

    setIsSaving(true);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() || undefined });
      const refreshedUser = await user.reload();
      const { data } = await api.patch("/users/me/profile", {
        name: refreshedUser.fullName?.trim() || fullName,
        imageUrl: refreshedUser.imageUrl,
      });
      queryClient.setQueryData(["current-user", user.id], data.user);
      Toast.show({ type: "success", text1: "Profile saved" });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not save profile",
        text2: error?.response?.data?.error || error?.errors?.[0]?.longMessage || error?.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!authLoaded || !userLoaded || accountLoading) {
    return <SafeScreen><View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#4F2B50" /></View></SafeScreen>;
  }
  if (!isSignedIn || !user) return <SafeScreen><View className="flex-1" /></SafeScreen>;

  return (
    <SafeScreen>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 36 }}>
          <View className="flex-row items-center px-6 pb-5 pt-5">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-surface"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={21} color="#4F2B50" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-text-primary">Edit profile</Text>
              <Text className="mt-1 text-sm text-text-secondary">Your account details</Text>
            </View>
          </View>

          <View className="items-center px-6 pb-7 pt-3">
            <ProfileAvatar imageUrl={user.imageUrl || account?.imageUrl} name={user.fullName || fullName} size={112} />
            <Text className="mt-3 text-sm font-semibold text-text-primary">Tap your photo to change it</Text>
            <Text className="mt-1 text-xs text-text-secondary">Choose and crop a square photo</Text>
          </View>

          <View className="mx-6 border-t border-surface-light pt-6">
            <Text className="mb-2 text-sm font-semibold text-text-primary">First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#8E8491"
              autoCapitalize="words"
              autoComplete="given-name"
              returnKeyType="next"
              className="mb-5 rounded-xl border border-surface-light bg-surface px-4 py-4 text-base text-text-primary"
              accessibilityLabel="First name"
            />

            <Text className="mb-2 text-sm font-semibold text-text-primary">Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#8E8491"
              autoCapitalize="words"
              autoComplete="family-name"
              returnKeyType="done"
              onSubmitEditing={() => void saveProfile()}
              className="mb-5 rounded-xl border border-surface-light bg-surface px-4 py-4 text-base text-text-primary"
              accessibilityLabel="Last name"
            />

            <Text className="mb-2 text-sm font-semibold text-text-primary">Account type</Text>
            <TextInput
              value={accountRole}
              editable={false}
              selectTextOnFocus
              className="mb-5 rounded-xl border border-surface-light bg-background-light px-4 py-4 text-base font-semibold text-text-secondary"
              accessibilityLabel={`Account type: ${accountRole}`}
            />

            <Text className="mb-2 text-sm font-semibold text-text-primary">Email address</Text>
            <View className="mb-2 flex-row items-center rounded-xl border border-surface-light bg-background-light px-4 py-4">
              <Text className="flex-1 text-base text-text-secondary">{displayEmail}</Text>
              <Ionicons name="lock-closed-outline" size={18} color="#796D7F" />
            </View>
            <Text className="mb-7 text-xs leading-5 text-text-tertiary">Email is managed by your secure sign-in provider. Changing it requires a separate verification step.</Text>

            <TouchableOpacity
              onPress={() => void saveProfile()}
              disabled={isSaving || !fullName}
              className={`min-h-14 flex-row items-center justify-center rounded-xl ${isSaving || !fullName ? "bg-primary/50" : "bg-primary"}`}
              accessibilityRole="button"
            >
              {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-base font-bold text-white">Save changes</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
