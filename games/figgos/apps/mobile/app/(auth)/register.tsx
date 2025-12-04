import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { useTheme } from '../../utils/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ErrorMessage from '../../components/ErrorMessage';

export default function Register() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const { signUp } = useAuth();
	const router = useRouter();
	const { theme, isDark } = useTheme();

	// Clear error message when inputs change
	const handleInputChange =
		(setter: React.Dispatch<React.SetStateAction<string>>) => (text: string) => {
			setter(text);
			if (errorMessage) setErrorMessage('');
		};

	const handleRegister = async () => {
		// Dismiss keyboard
		Keyboard.dismiss();

		// Validate inputs
		if (!email.trim()) {
			setErrorMessage('Bitte gib deine E-Mail-Adresse ein.');
			return;
		}

		if (!password) {
			setErrorMessage('Bitte gib ein Passwort ein.');
			return;
		}

		if (!confirmPassword) {
			setErrorMessage('Bitte bestätige dein Passwort.');
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setErrorMessage('Bitte gib eine gültige E-Mail-Adresse ein.');
			return;
		}

		if (password !== confirmPassword) {
			setErrorMessage('Die Passwörter stimmen nicht überein.');
			return;
		}

		if (password.length < 6) {
			setErrorMessage('Das Passwort muss mindestens 6 Zeichen lang sein.');
			return;
		}

		// Check password strength
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumbers = /\d/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar))) {
			setErrorMessage(
				'Dein Passwort sollte Groß- und Kleinbuchstaben sowie Zahlen oder Sonderzeichen enthalten.'
			);
			return;
		}

		setLoading(true);
		setErrorMessage('');

		try {
			const { error } = await signUp(email, password);

			if (error) {
				// Handle specific error cases with user-friendly messages
				if (error.message.includes('already registered')) {
					setErrorMessage(
						'Diese E-Mail-Adresse wird bereits verwendet. Bitte wähle eine andere oder melde dich an.'
					);
				} else if (error.message.includes('rate limit')) {
					setErrorMessage('Zu viele Registrierungsversuche. Bitte versuche es später erneut.');
				} else if (error.message.includes('network')) {
					setErrorMessage('Netzwerkfehler. Bitte überprüfe deine Internetverbindung.');
				} else if (error.message.includes('weak password')) {
					setErrorMessage('Dein Passwort ist zu schwach. Bitte wähle ein stärkeres Passwort.');
				} else {
					setErrorMessage(error.message || 'Ein unbekannter Fehler ist aufgetreten.');
				}
			} else {
				Alert.alert(
					'Registrierung erfolgreich',
					'Bitte überprüfe deine E-Mail, um dein Konto zu bestätigen.',
					[{ text: 'OK', onPress: () => router.replace('/login') }]
				);
			}
		} catch (e) {
			setErrorMessage('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.');
			console.error('Registration error:', e);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<View style={styles.logoContainer}>
				<FontAwesome name="cube" size={80} color={theme.colors.primary} />
				<Text style={[styles.title, { color: theme.colors.text }]}>WTFigure</Text>
				<Text style={[styles.subtitle, { color: theme.colors.text }]}>
					Erstelle und teile deine Action-Figuren
				</Text>
			</View>

			<View style={styles.formContainer}>
				<ErrorMessage message={errorMessage} visible={!!errorMessage} />

				<TextInput
					style={[
						styles.input,
						{
							backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
							color: theme.colors.text,
							borderColor: errorMessage && !email ? theme.colors.error : theme.colors.border,
						},
					]}
					placeholder="E-Mail"
					placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
					value={email}
					onChangeText={handleInputChange(setEmail)}
					autoCapitalize="none"
					keyboardType="email-address"
					testID="email-input"
				/>

				<TextInput
					style={[
						styles.input,
						{
							backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
							color: theme.colors.text,
							borderColor: errorMessage && !password ? theme.colors.error : theme.colors.border,
						},
					]}
					placeholder="Passwort"
					placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
					value={password}
					onChangeText={handleInputChange(setPassword)}
					secureTextEntry
					testID="password-input"
				/>

				<TextInput
					style={[
						styles.input,
						{
							backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
							color: theme.colors.text,
							borderColor:
								errorMessage && !confirmPassword ? theme.colors.error : theme.colors.border,
						},
					]}
					placeholder="Passwort bestätigen"
					placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
					value={confirmPassword}
					onChangeText={handleInputChange(setConfirmPassword)}
					secureTextEntry
					testID="confirm-password-input"
				/>

				<Text style={[styles.passwordHint, { color: theme.colors.text + '80' }]}>
					Passwort muss mindestens 6 Zeichen lang sein und Groß- und Kleinbuchstaben sowie Zahlen
					oder Sonderzeichen enthalten.
				</Text>

				<TouchableOpacity
					style={[styles.button, { backgroundColor: theme.colors.primary }]}
					onPress={handleRegister}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>Registrieren</Text>
					)}
				</TouchableOpacity>

				<View style={styles.footerContainer}>
					<Text style={[styles.footerText, { color: theme.colors.text }]}>Bereits ein Konto?</Text>
					<TouchableOpacity onPress={() => router.push('/login')}>
						<Text style={[styles.footerLink, { color: theme.colors.primary }]}>Anmelden</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	passwordHint: {
		fontSize: 12,
		marginBottom: 15,
		marginTop: -5,
	},
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 40,
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		marginTop: 10,
	},
	subtitle: {
		fontSize: 16,
		marginTop: 5,
		textAlign: 'center',
	},
	formContainer: {
		width: '100%',
		maxWidth: 400,
		alignSelf: 'center',
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderRadius: 10,
		marginBottom: 15,
		paddingHorizontal: 15,
		fontSize: 16,
	},
	button: {
		height: 50,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 10,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	footerContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 20,
	},
	footerText: {
		marginRight: 5,
	},
	footerLink: {
		fontWeight: 'bold',
	},
});
