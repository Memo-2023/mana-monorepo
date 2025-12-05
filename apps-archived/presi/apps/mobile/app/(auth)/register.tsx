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
import { useRouter, Link } from 'expo-router';
import { registerUser } from '../../services/auth';

export default function RegisterScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleRegister = async () => {
		if (!email || !password || !confirmPassword) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert('Error', 'Passwords do not match');
			return;
		}

		if (password.length < 6) {
			Alert.alert('Error', 'Password should be at least 6 characters long');
			return;
		}

		setIsLoading(true);
		try {
			await registerUser(email, password);
			router.replace('/');
		} catch (error: any) {
			console.error('Registration error:', error);
			Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<View style={styles.formContainer}>
				<Text style={styles.title}>Create Account</Text>
				<Text style={styles.subtitle}>Sign up to get started</Text>

				<TextInput
					style={styles.input}
					placeholder="Email"
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					keyboardType="email-address"
					autoComplete="email"
				/>

				<TextInput
					style={styles.input}
					placeholder="Password"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoComplete="password-new"
				/>

				<TextInput
					style={styles.input}
					placeholder="Confirm Password"
					value={confirmPassword}
					onChangeText={setConfirmPassword}
					secureTextEntry
					autoComplete="password-new"
				/>

				<TouchableOpacity
					style={[styles.button, isLoading && styles.buttonDisabled]}
					onPress={handleRegister}
					disabled={isLoading}
				>
					<Text style={styles.buttonText}>
						{isLoading ? 'Creating Account...' : 'Create Account'}
					</Text>
				</TouchableOpacity>

				<View style={styles.links}>
					<Link href="/login" style={styles.link}>
						Already have an account? Sign In
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
