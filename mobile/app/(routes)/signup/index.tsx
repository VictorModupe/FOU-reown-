import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { toast } from 'sonner-native';
import useSocialAuth from "@/hooks/useSocialAuth";


interface SignUpFormData {
    name: string;
    email: string;
    password: string;
}

export default function SignUpScreen() {
    // All hooks must be called inside the component
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { role: requestedRole } = useLocalSearchParams<{ role?: string }>();
    const accountType = requestedRole === "customer" ? "customer" : "vendor";
    const { isLoaded, signUp } = useSignUp();
    const { loadingStrategy, handleSocialAuth } = useSocialAuth();

    const signupForm = useForm<SignUpFormData>({
        mode: 'onChange',
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSignInNavigation = () => {
        router.push({ pathname: '/(routes)/login', params: { role: accountType } });
    };

    const onSignUpSubmit = async ({ name, email, password }: SignUpFormData) => {
        if (!isLoaded || !signUp) return;
        setIsSubmitting(true);
        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName: name,
            });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            router.replace({ pathname: "/(routes)/signup-otp", params: { role: accountType } });
        } catch (error: any) {
            toast.error(error?.errors?.[0]?.longMessage || error?.message || "Unable to create account");
        } finally {
            setIsSubmitting(false);
        }
    };

    // const { errors, isValid } = form.formState;

    return (
        <ImageBackground
            source={require('../../../assets/images/auth-image.png')}
            resizeMode="cover"
            className="flex-1"
        >
            <View className="absolute inset-0 bg-black/45" />
            <SafeAreaView className="flex-1">
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
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View className="mt-8 mb-8">
                        <Text className="text-3xl font-kenao text-white mb-2">
                            Create your account
                        </Text>
                        <Text className="text-white/75 text-base font-kenao">
                            {accountType === "vendor" ? "Create your seller account" : "Create your customer account"}
                        </Text>
                    </View>

                    {/* Form fields */}
                    <View className="gap-6 mt-8">
                        {/* Full name */}
                        <View>
                            <Text className="text-white text-base font-kenao mb-3">Name</Text>
                            <Controller
                                control={signupForm.control}
                                name="name"
                                rules={{
                                    required: 'Full name is required',
                                    minLength: {
                                        value: 4,
                                        message: 'Name must be at least 4 characters',
                                    },
                                }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View
                                        className={`flex-row items-center bg-gray-50 border rounded-xl px-4 py-4 ${signupForm.formState.errors.name ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                    >
                                        <Ionicons name="person-outline" size={20} color="#4F2B50" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-800 font-kenao"
                                            placeholder="Enter your full name"
                                            placeholderTextColor="#6b7280"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            keyboardType="default"
                                            autoCapitalize="words"
                                        />
                                    </View>
                                )}
                            />
                            {signupForm.formState.errors.name && (
                                <Text className="text-red-600 text-sm font-kenao mt-1">
                                    {signupForm.formState.errors.name.message}
                                </Text>
                            )}
                        </View>

                        {/* Email */}
                        <View>
                            <Text className="text-white text-base font-kenao mb-3">Email</Text>
                            <Controller
                                control={signupForm.control}
                                name="email"
                                rules={{
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                                        message: 'Please enter a valid email',
                                    },
                                }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View className={`flex-row items-center bg-gray-50 border rounded-xl px-4 py-4 ${signupForm.formState.errors.email ? 'border-red-500' : 'border-gray-200'}`}>
                                        <MaterialCommunityIcons
                                            name="email-outline"
                                            size={20}
                                            color="#4F2B50"
                                        />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-800 font-kenao"
                                            placeholder="Enter your email address"
                                            placeholderTextColor="#6b7280"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                )}
                            />
                            {signupForm.formState.errors.email && (
                                <Text className="text-red-600 text-sm font-kenao mt-1">
                                    {signupForm.formState.errors.email.message}
                                </Text>
                            )}
                        </View>

                        {/* Password */}
                        <View>
                            <Text className="text-white text-base font-kenao mb-3">
                                Password
                            </Text>
                            <Controller
                                control={signupForm.control}
                                name="password"
                                rules={{
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View
                                        className={`flex-row items-center bg-gray-50 border rounded-xl px-4 py-4 ${signupForm.formState.errors.password ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                    >
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={20}
                                            color="#4F2B50"
                                        />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-800 font-kenao"
                                            placeholder="Create a password"
                                            placeholderTextColor="#000000"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            secureTextEntry={!showPassword}
                                            editable={!isSubmitting}
                                        />
                                        {signupForm.formState.errors.password && (
                                            <Text className="text-red-500 text-small font-kenao ml-2">
                                                {signupForm.formState.errors.password.message}
                                            </Text>
                                        )}
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            disabled={isSubmitting}
                                        >
                                            <Ionicons
                                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                                size={20}
                                                color="#4F2B50"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {/* {signupForm.formState.errors.password && (
                                <Text className="text-red-600 text-sm font-kenao mt-1">
                                    {signupForm.formState.errors.password.message}
                                </Text>
                            )} */}
                        </View>
                    </View>

                    {/* Submit button */}
                    <TouchableOpacity
                        className={`rounded-xl py-4 mt-8 ${signupForm.formState.isValid ? 'bg-[#8264A9]' : 'bg-gray-400'
                            }`}
                        onPress={signupForm.handleSubmit(onSignUpSubmit)}
                        disabled={!signupForm.formState.isValid || isSubmitting}
                    >
                        <Text className="text-white text-center text-lg font-kenao">
                            {isSubmitting
                                ? 'Creating Account...'
                                : 'Create Account'}
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-8">
                        <View className="flex-1 h-px bg-gray-300" />
                        <Text className="mx-4 text-purple-300 font-kenao">Or continue with</Text>
                        <View className="flex-1 h-px bg-gray-300" />
                    </View>

                    {/* Social buttons */}
                    <View className="gap-3 mb-8">
                        <TouchableOpacity
                            className="w-full flex-row items-center justify-center bg-white rounded-xl py-3 px-4"
                            onPress={() => handleSocialAuth("oauth_google", accountType)}
                            disabled={isSubmitting || loadingStrategy !== null}
                        >
                            <Ionicons name="logo-google" size={20} color="#8264A9" />
                            <Text className="ml-2 text-gray-700 font-kenao-medium text-sm">
                                Google
                            </Text>
                        </TouchableOpacity>

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
                    

                    {/* Sign in link */}
                    <View className="flex-row justify-center items-center mt-4 mb-12">
                        <Text className="text-white/75 font-kenao text-sm">
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={handleSignInNavigation} disabled={isSubmitting}>
                            <Text className="text-[#e6cfff] font-kenao text-sm">
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}
