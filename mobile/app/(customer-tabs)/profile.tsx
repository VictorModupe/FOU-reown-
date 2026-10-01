import SafeScreen from "@/components/SafeScreen";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useAuth, useUser } from "@clerk/clerk-expo";

import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import useCurrentUser from "@/hooks/useCurrentUser";

const MENU_ITEMS = [
  { id: 1, icon: "person-outline", title: "Edit Profile", color: "#3B82F6", action: "/(profile)/edit-profile" },
  { id: 2, icon: "list-outline", title: "Orders", color: "#10B981", action: "/orders" },
  { id: 3, icon: "location-outline", title: "Addresses", color: "#F59E0B", action: "/addresses" },
  { id: 4, icon: "heart-outline", title: "Wishlist", color: "#EF4444", action: "/wishlist" },
  { id: 5, icon: "pricetag-outline", title: "My Offers", color: "#8B5CF6", action: "/offers" },
] as const;

const ProfileScreen = () => {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { data: account } = useCurrentUser();
  const { isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const displayName = user?.fullName?.trim() || account?.name || "User is Not Loggedin";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || account?.email || "Email unavailable for this user";

  const handleMenuPress = (action: (typeof MENU_ITEMS)[number]["action"]) => router.push(action);

  const handleSignOut = async () => {
    queryClient.clear();
    await signOut();
    Toast.show({
      type: "success",
      text1: "Signed out",
      text2: "You have been signed out successfully.",
    });
    router.replace("/(routes)/login");
  };

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View className="px-6 pb-8">
          <View className="bg-surface rounded-3xl p-6">
            <View className="flex-row items-center">
              <ProfileAvatar imageUrl={user?.imageUrl || account?.imageUrl} name={displayName} />

              <View className="flex-1 ml-4">
                <Text className="text-text-primary text-2xl font-bold mb-1">
                  {displayName}
                </Text>
                <Text className="text-text-secondary text-sm">
                  {displayEmail}
                </Text>
                <Text className="text-text-secondary text-xs mt-1">
                  {isSignedIn ? "Signed in" : "Please sign in as a user to access your profile and orders."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* MENU ITEMS */}
        <View className="mx-6 mb-6">
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="mb-3 min-h-[76px] flex-row items-center gap-4 rounded-2xl bg-surface px-5 py-4"
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.action)}
            >
              <View
                className="rounded-full w-12 h-12 items-center justify-center"
                style={{ backgroundColor: item.color + "20" }}
              >
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>

              <Text className="text-text-primary font-bold text-base flex-1">{item.title}</Text>

              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>


        {/* NOTIFICATIONS BTN */}
        {/* <View className="mb-3 mx-6 bg-surface rounded-2xl p-4">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
            onPress={() => router.push("/offers")}
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              <Text className="text-text-primary font-semibold ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View> */}

        <View className="mb-3 mx-6 bg-surface rounded-2xl p-4">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            activeOpacity={0.7}
            onPress={toggleTheme}
          >
            {/* Left side: Icon and Label */}
            <View className="flex-row items-center gap-3">
              {/* Icon with a subtle background container matching your menu items */}
              <View
                className="rounded-full w-10 h-10 items-center justify-center"
                style={{ backgroundColor: isDark ? "#F59E0B20" : "#3B82F620" }}
              >
                <Ionicons
                  name={isDark ? "moon-outline" : "sunny-outline"}
                  size={20}
                  color={isDark ? "#F59E0B" : "#3B82F6"}
                />
              </View>
              <Text className="text-text-primary font-bold text-base">Appearance</Text>
            </View>

            {/* Right side: Current status and chevron */}
            <View className="flex-row items-center gap-2">
              <Text className="text-text-secondary text-sm">
                {isDark ? "Dark" : "Light"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#6B7280" />
            </View>
          </TouchableOpacity>
        </View>


        {/* PRIVACY AND SECURTIY LINK */}
        {/* <View className="mb-3 mx-6 bg-surface rounded-2xl p-4">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
            onPress={() => router.push("/privacy-security")}
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={22} color="#F0E5F1" />
              <Text className="text-text-primary font-semibold ml-3">Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View> */}

        {/* SIGNOUT BTN */}
        {isSignedIn ? <TouchableOpacity
          className="mx-6 mb-3 bg-surface rounded-2xl py-5 flex-row items-center justify-center border-2 border-red-500"
          activeOpacity={0.8}
          onPress={() => void handleSignOut()}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text className="text-red-500 font-bold text-base ml-2">Sign Out</Text>
        </TouchableOpacity> : <TouchableOpacity
          className="mx-6 mb-3 bg-primary rounded-2xl py-5 flex-row items-center justify-center"
          activeOpacity={0.8}
          onPress={() => router.push("/(routes)/login")}
        >
          <Ionicons name="log-in-outline" size={22} color="#121212" />
          <Text className="text-background font-bold text-base ml-2">Please Sign In</Text>
        </TouchableOpacity>}

        <Text className="mx-6 mb-3 text-center text-text-secondary text-xs">Version 21.5.0 FOU</Text>
      </ScrollView>
    </SafeScreen>
  );
};

export default ProfileScreen;

// REACT NATIVE IMAGE VS EXPO IMAGE:

// React Native Image (what we have used so far):
// import { Image } from "react-native";
//
// <Image source={{ uri: url }} />

// Basic image component
// No built-in caching optimization
// Requires source={{ uri: string }}

// Expo Image (from expo-image):
// import { Image } from "expo-image";

// <Image source={url} />

// Caching - automatic disk/memory caching
// Placeholder - blur hash, thumbnail while loading
// Transitions - crossfade, fade animations
// Better performance - optimized native rendering
// Simpler syntax: source={url} or source={{ uri: url }}
// Supports contentFit instead of resizeMode

// Example with expo-image:
// <Image   source={user?.imageUrl}  placeholder={blurhash}  transition={200}  contentFit="cover"  className="size-20 rounded-full"/>

// Recommendation: For production apps, expo-image is better — faster, cached, smoother UX.
// React Native's Image works fine for simple cases though.
