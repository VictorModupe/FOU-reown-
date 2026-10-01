import { useApi } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";

type ProfileAvatarProps = {
  imageUrl?: string | null;
  name: string;
  size?: number;
};

export default function ProfileAvatar({ imageUrl, name, size = 88 }: ProfileAvatarProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const api = useApi();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setFailedImageUrl(null);
  }, [imageUrl]);

  const chooseImage = async () => {
    if (!isSignedIn || !user || isUpdating) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: "error", text1: "Photo access needed", text2: "Allow photo library access to change your profile picture." });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;

      setIsUpdating(true);
      await user.setProfileImage({ file: result.assets[0].uri });
      const refreshedUser = await user.reload();
      const { data } = await api.patch("/users/me/profile", {
        name: refreshedUser.fullName?.trim() || name,
        imageUrl: refreshedUser.imageUrl,
      });
      queryClient.setQueryData(["current-user", user.id], data.user);
      Toast.show({ type: "success", text1: "Profile picture updated" });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not update photo",
        text2: error?.response?.data?.error || error?.errors?.[0]?.longMessage || error?.message || "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => void chooseImage()}
      disabled={!isSignedIn || isUpdating}
      accessibilityRole="button"
      accessibilityLabel={isSignedIn ? `Change ${name || "your"} profile picture` : `${name || "User"} profile picture`}
      activeOpacity={isSignedIn ? 0.8 : 1}
      style={{ width: size, height: size }}
    >
      {imageUrl && failedImageUrl !== imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          contentFit="cover"
          transition={200}
          onError={() => setFailedImageUrl(imageUrl)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          className="items-center justify-center rounded-full bg-primary/15"
          style={{ width: size, height: size }}
        >
          <Ionicons name="person" size={size * 0.48} color="#4F2B50" />
        </View>
      )}

      {isUpdating ? (
        <View className="absolute inset-0 items-center justify-center rounded-full bg-black/45">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : isSignedIn ? (
        <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary">
          <Ionicons name="camera" size={15} color="#FFFFFF" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
