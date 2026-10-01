import { useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { toast } from "sonner-native";
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgetPasswordScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendCode = async () => {
    if (!isLoaded || !signIn || !email.trim()) {
      toast.error("Enter the email linked to your account.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn.create({ identifier: email.trim() });
      const factor = signIn.supportedFirstFactors?.find(
        (item: any) => item.strategy === "reset_password_email_code"
      ) as { emailAddressId?: string } | undefined;
      if (!factor?.emailAddressId) throw new Error("This account cannot reset its password by email.");
      await signIn.prepareFirstFactor({ strategy: "reset_password_email_code", emailAddressId: factor.emailAddressId });
      setStep("code");
      toast.success("Verification code sent");
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.longMessage || error?.message || "Unable to send code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!signIn || code.trim().length < 6) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code: code.trim() });
      setStep("password");
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.longMessage || error?.message || "Invalid verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (!signIn || password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await signIn.resetPassword({ password });
      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error("Password reset needs one more verification step.");
      }
      await setActive({ session: result.createdSessionId });
      toast.success("Password updated");
      router.replace("/");
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.longMessage || error?.message || "Unable to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = step === "email" ? "Forgot password?" : step === "code" ? "Check your email" : "Create a new password";
  const subtitle = step === "email" ? "Enter your email and we will send you a reset code." : step === "code" ? `We sent a 6-digit code to ${email}.` : "Choose a strong password for your account.";

  return (
    <ImageBackground source={require("../../../assets/images/auth-image.png")} resizeMode="cover" className="flex-1">
      <View className="absolute inset-0 bg-black/55" />
      <SafeAreaView className="flex-1">
        <TouchableOpacity className="px-6 pt-2" onPress={() => router.replace("/(routes)/login")} accessibilityLabel="Back to login">
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
            <View className="rounded-3xl bg-black/35 p-6">
              <Text className="text-3xl font-bold text-white">{title}</Text>
              <Text className="mt-2 text-base leading-6 text-white/75">{subtitle}</Text>

              {step === "email" ? <TextInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#777" className="mt-7 rounded-xl bg-white px-4 py-4 text-base text-[#241b26]" /> : null}
              {step === "code" ? <TextInput keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} placeholder="6-digit code" placeholderTextColor="#777" className="mt-7 rounded-xl bg-white px-4 py-4 text-center text-2xl tracking-[8px] text-[#241b26]" /> : null}
              {step === "password" ? <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="New password" placeholderTextColor="#777" className="mt-7 rounded-xl bg-white px-4 py-4 text-base text-[#241b26]" /> : null}

              <TouchableOpacity onPress={step === "email" ? sendCode : step === "code" ? verifyCode : resetPassword} disabled={isSubmitting} className="mt-5 rounded-xl bg-[#c9b3e0] py-4">
                {isSubmitting ? <ActivityIndicator color="#4F2B50" /> : <Text className="text-center text-base font-bold text-[#4F2B50]">{step === "email" ? "Send reset code" : step === "code" ? "Verify code" : "Update password"}</Text>}
              </TouchableOpacity>

              {step !== "email" ? <TouchableOpacity className="mt-5" onPress={() => setStep("email")}><Text className="text-center font-semibold text-white underline">Use a different email</Text></TouchableOpacity> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}