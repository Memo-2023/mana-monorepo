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
import { loginUser } from '../../services/auth';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		setIsLoading(true);
		try {
			await loginUser(email, password);
			router.replace('/');
		} catch (error: any) {
			console.error('Login error:', error);
			Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
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
				<Text style={styles.title}>Welcome Back</Text>
				<Text style={styles.subtitle}>Sign in to continue</Text>

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
					autoComplete="password"
				/>

				<TouchableOpacity
					style={[styles.button, isLoading && styles.buttonDisabled]}
					onPress={handleLogin}
					disabled={isLoading}
				>
					<Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
				</TouchableOpacity>

				<View style={styles.links}>
					<Link href="/forgot-password" style={styles.link}>
						Forgot Password?
					</Link>
					<Link href="/register" style={styles.link}>
						Create Account
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 24,
	},
	link: {
		color: '#007AFF',
		fontSize: 16,
	},
});
