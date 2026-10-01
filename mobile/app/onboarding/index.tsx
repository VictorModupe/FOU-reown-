import { View, StyleSheet, TouchableOpacity, Text, ImageBackground } from "react-native";
import React from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function OnboardingScreen() {
    const handleContinueAsVendor = () => router.replace({ pathname: "/(routes)/signup", params: { role: "vendor" } });
    const handleContinueAsCustomer = () => router.replace({ pathname: "/(routes)/signup", params: { role: "customer" } });
    const handleContinueAsGuest = () => router.replace("/(customer-tabs)");

    return (
        <ImageBackground
            source={require("../../assets/images/auth-image.png")}
            style={styles.container}
            resizeMode="cover"
        >
            {/* Dark fade so the text stays readable over any image */}
            <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.75)"]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.contentContainer}>
                <Text style={styles.title}>Declutter, Earn, Reown</Text>
                <Text style={styles.subtitle}>
                    Discover many amazing thrift Products and Shop with us
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleContinueAsVendor}
                    accessibilityRole="button"
                >
                    <LinearGradient
                        colors={["#4F2B50", "#8264A9"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>Continue as a Seller</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleContinueAsCustomer}
                    accessibilityRole="button"
                >
                    <LinearGradient
                        colors={["#ebd9eb", "#c9b3e0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={[styles.buttonText, styles.buttonTextDark]}>
                            Continue as a Customer
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleContinueAsGuest} accessibilityRole="button" style={styles.guestLink}>
                    <Text style={styles.guestLinkText}>Browse as a guest</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 50,
        paddingHorizontal: 20,
        
    },
    title: {
        fontSize: 32,
        // fontWeight: "bold",
        color: "#F0E5F1",
        marginBottom: 10,
        textAlign: "center",
        fontFamily: "Kenao",
    },
    subtitle: {
        fontSize: 16,
        color: "#F0E5F1",
        marginBottom: 30,
        textAlign: "center",
        opacity: 0.8,
        fontFamily: "Kenao",
    },
    button: {
        width: "100%",
        marginTop: 20,
        borderRadius: 10,
        overflow: "hidden",
    },
    buttonGradient: {
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#F0E5F1",
        fontSize: 18,
        // fontWeight: "bold",
        fontFamily: "Kenao",
    },
    buttonTextDark: {
        color: "#4F2B50",
        fontFamily: "Kenao",
    },
    guestLink: {
        paddingVertical: 16,
    },
    guestLinkText: {
        color: "#F0E5F1",
        fontSize: 15,
        fontFamily: "Kenao",
        textDecorationLine: "underline",
    },
});