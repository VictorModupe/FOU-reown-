import React, { useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Keyboard, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

export default function SignupOtpScreen() {
	const [code, setCode] = useState<string[]>(Array(6).fill(''));
	const inputs = useRef<(TextInput | null)[]>([]);
	const { isLoaded, signUp, setActive } = useSignUp();
	const [isVerifying, setIsVerifying] = useState(false);

	const updateCode = (value: string, index: number) => {
		const digit = value.replace(/\D/g, '').slice(-1);
		const next = [...code];
		next[index] = digit;
		setCode(next);

		if (digit && index < 5) {
			inputs.current[index + 1]?.focus();
		} else if (digit && index === 5) {
			Keyboard.dismiss();
		}
	};

	const handleKeyPress = (key: string, index: number) => {
		if (key === 'Backspace' && !code[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	};

	const verifyCode = async () => {
		if (!isLoaded || !signUp) return;
		setIsVerifying(true);
		try {
			const result = await signUp.attemptEmailAddressVerification({ code: code.join('') });
			if (result.status !== 'complete' || !result.createdSessionId) throw new Error('Verification is incomplete.');
			await setActive({ session: result.createdSessionId });
			toast.success('Vendor account created');
			router.replace('/(vendor-tabs)');
		} catch (error: any) {
			toast.error(error?.errors?.[0]?.longMessage || error?.message || 'Invalid verification code');
		} finally {
			setIsVerifying(false);
		}
	};

	return (
		<ImageBackground source={require('../../../assets/images/auth-image.png')} resizeMode="cover" style={styles.background}>
			<View style={styles.overlay} />
			<SafeAreaView style={styles.container}>
			<Text style={styles.title}>Verify your email</Text>
			<Text style={styles.subtitle}>Enter the 6-digit code sent to your email address.</Text>

			<View style={styles.inputs}>
				{code.map((digit, index) => (
					<TextInput
						key={index}
						ref={(input) => {
							inputs.current[index] = input;
						}}
						value={digit}
						onChangeText={(value) => updateCode(value, index)}
						onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
						keyboardType="number-pad"
						maxLength={1}
						selectTextOnFocus
						textAlign="center"
						style={styles.input}
					/>
				))}
			</View>
			<TouchableOpacity style={styles.button} onPress={verifyCode} disabled={isVerifying || code.some((digit) => !digit)}>
				{isVerifying ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>Verify email</Text>}
			</TouchableOpacity>
			</SafeAreaView>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		justifyContent: 'center',
	},
	background: { flex: 1 },
	overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#FFFFFF',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: 'rgba(255,255,255,0.75)',
		marginBottom: 32,
	},
	inputs: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	button: {
		marginTop: 32,
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: 'center',
		backgroundColor: '#8264A9',
	},
	buttonText: {
		color: '#121212',
		fontSize: 16,
		fontWeight: '700',
	},
	input: {
		width: 48,
		height: 56,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.45)',
		borderRadius: 10,
		fontSize: 24,
		color: '#FFF',
	},
});
