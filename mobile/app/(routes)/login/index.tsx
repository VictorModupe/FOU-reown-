import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useForm } from "react-hook-form";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { toast } from 'sonner-native';
import useSocialAuth from "@/hooks/useSocialAuth";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface LoginFormData {
    email: string;
    password: string;
}
export default function LoginScreen() {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { role: requestedRole } = useLocalSearchParams<{ role?: string }>();
    const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
    const { isLoaded, signIn, setActive } = useSignIn();
    const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
    const { loadingStrategy, handleSocialAuth } = useSocialAuth();
    const api = useApi();
    const queryClient = useQueryClient();
    const accountType = requestedRole === "vendor" ? "vendor" : requestedRole === "customer" ? "customer" : undefined;

    const loginForm = useForm<LoginFormData>({
        mode: "onChange",
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoaded || !isSignedIn || isUserLoading || !currentUser || accountType) return;
        router.replace(currentUser.role === "vendor" ? "/(vendor-tabs)" : "/(customer-tabs)");
    }, [accountType, authLoaded, currentUser, isSignedIn, isUserLoading, router]);

    if (!authLoaded || (isSignedIn && isUserLoading)) return null;

    const onLoginSubmit = async ({ email, password }: LoginFormData) => {
        if (!isLoaded || !signIn) return;
        setIsSubmitting(true);
        try {
            if (isSignedIn) await signOut();
            const result = await signIn.create({ identifier: email.trim(), password });
            if (result.status !== "complete" || !result.createdSessionId) {
                const verificationMessage = result.status === "needs_second_factor"
                    ? "This account has extra security enabled. Complete the second verification step or use an account without MFA for testing."
                    : "This account needs email verification before you can sign in. Complete verification and try again.";
                throw new Error(verificationMessage);
            }
            await setActive({ session: result.createdSessionId });
            if (accountType) {
                const { data } = await api.post("/users/signup-role", { role: accountType });
                await queryClient.invalidateQueries({ queryKey: ["current-user"] });
                router.replace(data.role === "vendor" ? "/(vendor-tabs)" : "/(customer-tabs)");
                toast.success("Account ready");
                return;
            }
            toast.success("Login successful");
        } catch (error: any) {
            const clerkError = error?.errors?.[0];
            const identifierNotFound = ["form_identifier_not_found", "identifier_not_found"].includes(clerkError?.code);
            toast.error(
                identifierNotFound
                    ? "We couldn't find an account with that email. Check the address or sign up to create an account."
                    : clerkError?.longMessage || error?.message || "Unable to sign in"
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleSignUpNavigation = () => {
        router.push({ pathname: "/(routes)/signup", params: { role: accountType || "customer" } });
    }
    return (
        <ImageBackground
            source={require('../../../assets/images/auth-image.png')}
            resizeMode="cover"
            className="flex-1"
        >
            <View className="absolute inset-0 bg-black/45" />
            <SafeAreaView className='flex-1'>
                <TouchableOpacity
                    className="px-6 pt-2"
                    onPress={() => router.replace("/onboarding")}
                    accessibilityRole="button"
                    accessibilityLabel="Back to onboarding"
                >
                    <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className='flex-1'>
                    <ScrollView
                        className="flex-1 px-6"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View className="mt-8 mb-8">
                            <Text className="text-3xl font-kenao text-white mb-2">
                                Welcome Back
                            </Text>
                            <Text className="text-purple-300 text-base font-kenao">
                                Sign in to your Account
                            </Text>
                        </View>
                        {/* Form Fields*/}
                        <View className="gap-6 mt-8">
                            {/* Email Field */}
                            <View className="mt-6">
                                <Text className="text-white text-base font-kenao mb-3">Email</Text>
                                <Controller
                                    control={loginForm.control}
                                    name="email"
                                    rules={{
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^@]+@[^@]+\.[^@]+$/,
                                            message: "Please enter a valid Email"
                                        }
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View
                                            className={`flex-row items-center bg-gray-50 border rounded-xl px-4 py-4 ${loginForm.formState.errors.email
                                                ? "border-red-500"
                                                : "border-gray-200"
                                                }`} >

                                            <MaterialCommunityIcons
                                                name="email-outline"
                                                size={20}
                                                color="#4F2B50"
                                            />
                                            <TextInput
                                                className="flex-1 ml-3 text-gray-800 font-kenao"
                                                placeholder="Enter your Email Address"
                                                placeholderTextColor="#0b010b"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                textContentType="username"
                                                importantForAutofill="yes"
                                                editable={!isSubmitting}
                                            />
                                            {loginForm.formState.errors.email && (
                                                <Text className="text-red-500 text-sm font-kenao mt-1">
                                                    {loginForm.formState.errors.email.message}
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                />
                            </View>

                            {/* Password Fields */}
                            <View className="mt-6">
                                <Text className="text-white text-base font-kenao mb-3">
                                    Password
                                </Text>
                                <Controller
                                    control={loginForm.control}
                                    name="password"
                                    rules={{
                                        required: "Password is required",
                                        minLength: {
                                            value: 8,
                                            message: "Password must be at least 8 characters"
                                        }
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View
                                            className={`flex-row items-center bg-gray-50 border rounded-xl px-4 py-4 ${loginForm.formState.errors.password
                                                ? "border-red-500"
                                                : "border-gray-200"
                                                }`} >

                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={20}
                                                color={"#4F2B50"}
                                            />
                                            <TextInput
                                                className="flex-1 ml-3 text-gray-800 font-kenao"
                                                placeholder="Enter your Password"
                                                placeholderTextColor="#0b010b"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                secureTextEntry={!showPassword}
                                                keyboardType="default"
                                                autoCapitalize="none"
                                                autoComplete="password"
                                                textContentType="password"
                                                importantForAutofill="yes"
                                                editable={!isSubmitting}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowPassword(!showPassword)}
                                                accessibilityRole="button"
                                                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                            >
                                                <Ionicons
                                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                                    size={20}
                                                    color={"#4F2B50"}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                                {loginForm.formState.errors.password && (
                                    <Text className="text-red-500 text-sm font-kenao mt-1">
                                        {loginForm.formState.errors.password.message}
                                    </Text>
                                )}
                            </View>
                            {/* Forgot Password */}
                            <TouchableOpacity className="self-end mt-2" onPress={() => router.push("../forgot-password")}
                                disabled={isSubmitting}
                            >
                                <Text className='text-[#8264A9] font-kenao'>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            className={`rounded-xl py-4 mt-8 ${loginForm.formState.isValid ? "bg-[#8264A9]" : "bg-gray-400"}`}
                            onPress={loginForm.handleSubmit(onLoginSubmit)}
                            disabled={!loginForm.formState.isValid || isSubmitting}
                        >
                            <Text className="text-white text-center text-lg font-kenao">
                                {isSubmitting ? "Signing In ..." : "Sign In"}
                            </Text>
                        </TouchableOpacity>
                        {/* Divider */}

                        <View className='my-8'>
                            <View className="flex-row items-center my-8">
                                <View className="flex-1 h-px bg-gray-300" />
                                <Text className="mx-4 text-purple-300 font-kenao">Or continue with</Text>
                                <View className="flex-1 h-px bg-gray-300" />
                            </View>

                            <View className="w-full gap-3 mt-4 mb-8">
                                {/* Google Login Button */}
                                <TouchableOpacity
                                    className="w-full flex-row items-center justify-center bg-purple-300 rounded-xl py-3 px-4"
                                    onPress={() => handleSocialAuth("oauth_google", accountType)}
                                    disabled={isSubmitting || loadingStrategy !== null}
                                >
                                    <Ionicons name="logo-google" size={20} color="#4F2B50" />
                                    <Text className="ml-2 text-gray-700 font-kenao text-sm">
                                        Google
                                    </Text>
                                </TouchableOpacity>

                                {/* Apple Login Button */}
                                <TouchableOpacity
                                    className="w-full flex-row items-center justify-center bg-black rounded-xl py-3 px-4"
                                    onPress={() => handleSocialAuth("oauth_apple", accountType)}
                                    disabled={isSubmitting || loadingStrategy !== null}
                                >
                                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                                    <Text className="ml-2 text-white font-kenao text-sm">
                                        Apple
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Sign Up Redirect Link */}
                            <View className="flex-row justify-center items-center mt-4 mb-12">
                                <Text className="text-white/75 font-kenao text-sm">
                                    Don&apos;t have an Account?{" "}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleSignUpNavigation}
                                    disabled={isSubmitting}
                                >
                                    <Text className="text-[#8264A9] font-kenao text-sm">
                                        Sign Up
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
};