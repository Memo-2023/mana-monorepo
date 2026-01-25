import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { resetPassword } from '../../services/auth';

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [resetSent, setResetSent] = useState(false);
	const router = useRouter();

	const handleResetPassword = async () => {
		if (!email) {
			Alert.alert('Error', 'Please enter your email address');
			return;
		}

		setIsLoading(true);
		try {
			await resetPassword(email);
			setResetSent(true);
		} catch (error: any) {
			console.error('Password reset error:', error);
			Alert.alert('Reset Failed', error.message || 'An error occurred while sending reset email');
		} finally {
			setIsLoading(false);
		}
	};

	if (resetSent) {
		return (
			<View style={styles.container}>
				<View style={styles.formContainer}>
					<Text style={styles.title}>Check Your Email</Text>
					<Text style={styles.message}>We've sent password reset instructions to {email}</Text>
					<TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
						<Text style={styles.buttonText}>Return to Login</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<View style={styles.formContainer}>
				<Text style={styles.title}>Reset Password</Text>
				<Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>

				<TextInput
					style={styles.input}
					placeholder="Email"
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					keyboardType="email-address"
					autoComplete="email"
				/>

				<TouchableOpacity
					style={[styles.button, isLoading && styles.buttonDisabled]}
					onPress={handleResetPassword}
					disabled={isLoading}
				>
					<Text style={styles.buttonText}>
						{isLoading ? 'Sending...' : 'Send Reset Instructions'}
					</Text>
				</TouchableOpacity>

				<View style={styles.links}>
					<Link href="/login" style={styles.link}>
						Back to Login
					</Link>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	formContainer: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
		maxWidth: 400,
		width: '100%',
		alignSelf: 'center',
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#1a1a1a',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		color: '#666666',
		marginBottom: 32,
		textAlign: 'center',
	},
	message: {
		fontSize: 16,
		color: '#666666',
		marginBottom: 32,
		textAlign: 'center',
		lineHeight: 24,
	},
	input: {
		borderWidth: 1,
		borderColor: '#dddddd',
		borderRadius: 8,
		padding: 12,
		marginBottom: 16,
		fontSize: 16,
		backgroundColor: '#f8f8f8',
	},
	button: {
		backgroundColor: '#007AFF',
		padding: 16,
		borderRadius: 8,
		marginTop: 16,
	},
	buttonDisabled: {
		backgroundColor: '#cccccc',
	},
	buttonText: {
		color: '#ffffff',
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '600',
	},
	links: {
		marginTop: 24,
		alignItems: 'center',
	},
	link: {
		color: '#007AFF',
		fontSize: 16,
	},
});
