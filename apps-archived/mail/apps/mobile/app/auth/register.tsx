import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useAppTheme } from '~/theme/ThemeProvider';

export default function RegisterScreen() {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { signUp } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleRegister = async () => {
		if (!email || !password || !confirmPassword) {
			Alert.alert('Error', 'Please fill in all fields.');
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert('Error', 'Passwords do not match.');
			return;
		}

		if (password.length < 8) {
			Alert.alert('Error', 'Password must be at least 8 characters.');
			return;
		}

		try {
			setLoading(true);
			const { error } = await signUp(email, password);

			if (error) {
				Alert.alert('Registration Failed', error.message || 'Unknown error');
			} else {
				router.replace('/');
			}
		} catch (error) {
			console.error('Registration error:', error);
			Alert.alert('Error', 'An error occurred during registration. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<ScrollView
				contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
						<Ionicons name="mail" size={40} color="#fff" />
					</View>
					<Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
					<Text style={[styles.subtitle, { color: colors.text + 'AA' }]}>
						Sign up to start using Mail
					</Text>
				</View>

				<View style={styles.form}>
					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>Email</Text>
						<View
							style={[
								styles.inputWrapper,
								{
									backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
									borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA',
								},
							]}
						>
							<Ionicons name="mail-outline" size={20} color={colors.text + '80'} />
							<TextInput
								style={[styles.input, { color: colors.text }]}
								placeholder="you@example.com"
								placeholderTextColor={colors.text + '60'}
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								keyboardType="email-address"
								autoComplete="email"
							/>
						</View>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>Password</Text>
						<View
							style={[
								styles.inputWrapper,
								{
									backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
									borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA',
								},
							]}
						>
							<Ionicons name="lock-closed-outline" size={20} color={colors.text + '80'} />
							<TextInput
								style={[styles.input, { color: colors.text }]}
								placeholder="Password"
								placeholderTextColor={colors.text + '60'}
								value={password}
								onChangeText={setPassword}
								secureTextEntry={!showPassword}
								autoComplete="new-password"
							/>
							<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
								<Ionicons
									name={showPassword ? 'eye-off-outline' : 'eye-outline'}
									size={20}
									color={colors.text + '80'}
								/>
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
						<View
							style={[
								styles.inputWrapper,
								{
									backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
									borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA',
								},
							]}
						>
							<Ionicons name="lock-closed-outline" size={20} color={colors.text + '80'} />
							<TextInput
								style={[styles.input, { color: colors.text }]}
								placeholder="Confirm Password"
								placeholderTextColor={colors.text + '60'}
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								secureTextEntry={!showPassword}
								autoComplete="new-password"
							/>
						</View>
					</View>

					<TouchableOpacity
						style={[
							styles.registerButton,
							{ backgroundColor: colors.primary },
							loading && { opacity: 0.7 },
						]}
						onPress={handleRegister}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#FFFFFF" size="small" />
						) : (
							<Text style={styles.registerButtonText}>Create Account</Text>
						)}
					</TouchableOpacity>

					<View style={styles.loginContainer}>
						<Text style={[styles.loginText, { color: colors.text + 'AA' }]}>
							Already have an account?
						</Text>
						<Link href="/auth/login" asChild>
							<TouchableOpacity>
								<Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
							</TouchableOpacity>
						</Link>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 24,
		justifyContent: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	iconContainer: {
		width: 80,
		height: 80,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
	},
	form: {
		width: '100%',
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	input: {
		flex: 1,
		fontSize: 16,
		marginLeft: 12,
	},
	registerButton: {
		height: 56,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
		marginTop: 8,
	},
	registerButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	loginContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	loginText: {
		fontSize: 14,
		marginRight: 4,
	},
	loginLink: {
		fontSize: 14,
		fontWeight: '600',
	},
});
