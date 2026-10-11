import React, { useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Keyboard, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useApi } from '@/lib/api';
import { toast } from 'sonner-native';

export default function SignupOtpScreen() {
	const [code, setCode] = useState<string[]>(Array(6).fill(''));
	const inputs = useRef<(TextInput | null)[]>([]);
	const { isLoaded, signUp, setActive } = useSignUp();
	const { role: requestedRole } = useLocalSearchParams<{ role?: string }>();
	const api = useApi();
	const [isVerifying, setIsVerifying] = useState(false);
	const [verificationComplete, setVerificationComplete] = useState(false);
	const [isResending, setIsResending] = useState(false);

	const updateCode = (value: string, index: number) => {
		const digits = value.replace(/\D/g, '').slice(0, 6 - index);
		const next = [...code];
		digits.split('').forEach((digit, offset) => {
			next[index + offset] = digit;
		});
		setCode(next);

		if (next.every(Boolean)) {
			Keyboard.dismiss();
		} else if (digits && index < 5) {
			inputs.current[Math.min(index + digits.length, 5)]?.focus();
		}
	};

	const handleKeyPress = (key: string, index: number) => {
		if (key === 'Backspace' && !code[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	};

	const completeAccountSetup = async () => {
		const role = requestedRole === 'vendor' ? 'vendor' : 'customer';
		const { data } = await api.post('/users/signup-role', { role });
		toast.success(role === 'vendor' ? 'Seller account created' : 'Customer account created');
		router.replace(data.role === 'vendor' ? '/(vendor-tabs)' : '/(customer-tabs)');
	};

	const verifyCode = async () => {
		if (verificationComplete) {
			setIsVerifying(true);
			try {
				await completeAccountSetup();
			} catch (error: any) {
				toast.error(error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Could not finish account setup');
			} finally {
				setIsVerifying(false);
			}
			return;
		}
		if (!isLoaded || !signUp) return;
		setIsVerifying(true);
		try {
			const result = await signUp.attemptEmailAddressVerification({ code: code.join('') });
			if (result.status !== 'complete' || !result.createdSessionId) throw new Error('Verification is incomplete.');
			await setActive({ session: result.createdSessionId });
			setVerificationComplete(true);
			await completeAccountSetup();
		} catch (error: any) {
			toast.error(error?.response?.data?.error || error?.response?.data?.message || error?.errors?.[0]?.longMessage || error?.message || 'Could not finish account setup');
		} finally {
			setIsVerifying(false);
		}
	};

	const resendCode = async () => {
		if (!isLoaded || !signUp || verificationComplete) return;
		setIsResending(true);
		try {
			await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
			setCode(Array(6).fill(''));
			inputs.current[0]?.focus();
			toast.success('A new verification code was sent');
		} catch (error: any) {
			toast.error(error?.errors?.[0]?.longMessage || error?.message || 'Could not resend the code');
		} finally {
			setIsResending(false);
		}
	};

	return (
		<ImageBackground source={require('../../../assets/images/auth-image.png')} resizeMode="cover" style={styles.background}>
			<View style={styles.overlay} />
			<SafeAreaView style={styles.container}>
			<Text style={styles.title}>{verificationComplete ? 'Finish account setup' : 'Verify your email'}</Text>
			<Text style={styles.subtitle}>{verificationComplete ? 'Your email is verified. Retry to finish setting up your account.' : 'Enter the 6-digit code sent to your email address.'}</Text>

			<View style={styles.inputs}>
				{!verificationComplete && code.map((digit, index) => (
					<TextInput
						key={index}
						ref={(input) => {
							inputs.current[index] = input;
						}}
						value={digit}
						onChangeText={(value) => updateCode(value, index)}
						onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
						keyboardType="number-pad"
						maxLength={6}
						selectTextOnFocus
						textAlign="center"
						style={styles.input}
					/>
				))}
			</View>
			<TouchableOpacity style={styles.button} onPress={verifyCode} disabled={isVerifying || (!verificationComplete && code.some((digit) => !digit))}>
				{isVerifying ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>{verificationComplete ? 'Retry account setup' : 'Verify email'}</Text>}
			</TouchableOpacity>
			{!verificationComplete ? <TouchableOpacity onPress={resendCode} disabled={isResending || isVerifying} style={styles.resendButton}>
				{isResending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.resendText}>Resend code</Text>}
			</TouchableOpacity> : null}
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
	resendButton: { alignItems: 'center', padding: 16 },
	resendText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
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
