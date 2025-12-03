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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useAppTheme } from '~/theme/ThemeProvider';

export default function ResetPasswordScreen() {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { resetPassword } = useAuth();

	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleResetPassword = async () => {
		if (!email) {
			Alert.alert('Error', 'Please enter your email address.');
			return;
		}

		try {
			setLoading(true);
			const { error } = await resetPassword(email);

			if (error) {
				Alert.alert('Error', error.message || 'Unknown error');
			} else {
				setSent(true);
			}
		} catch (error) {
			console.error('Reset password error:', error);
			Alert.alert('Error', 'An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={styles.successContent}>
					<View style={[styles.iconContainer, { backgroundColor: '#22c55e' }]}>
						<Ionicons name="checkmark" size={40} color="#fff" />
					</View>
					<Text style={[styles.title, { color: colors.text }]}>Check Your Email</Text>
					<Text style={[styles.subtitle, { color: colors.text + 'AA' }]}>
						We've sent a password reset link to {email}
					</Text>
					<TouchableOpacity
						style={[styles.button, { backgroundColor: colors.primary }]}
						onPress={() => router.replace('/auth/login')}
					>
						<Text style={styles.buttonText}>Back to Sign In</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<ScrollView
				contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
				keyboardShouldPersistTaps="handled"
			>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color={colors.text} />
				</TouchableOpacity>

				<View style={styles.header}>
					<View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
						<Ionicons name="key" size={40} color="#fff" />
					</View>
					<Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
					<Text style={[styles.subtitle, { color: colors.text + 'AA' }]}>
						Enter your email and we'll send you a reset link
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

					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: colors.primary },
							loading && { opacity: 0.7 },
						]}
						onPress={handleResetPassword}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#FFFFFF" size="small" />
						) : (
							<Text style={styles.buttonText}>Send Reset Link</Text>
						)}
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 24,
	},
	backButton: {
		marginTop: 40,
		marginBottom: 20,
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
		paddingHorizontal: 20,
	},
	form: {
		width: '100%',
	},
	inputContainer: {
		marginBottom: 24,
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
	button: {
		height: 56,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	successContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
