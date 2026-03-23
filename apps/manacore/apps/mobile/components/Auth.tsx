import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useTheme, useThemeColors } from '../utils/themeContext';

export default function Auth() {
	const { isDarkMode } = useTheme();
	const themeColors = useThemeColors();
	const { signIn, signUp, resetPassword } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [isSignUp, setIsSignUp] = useState(false);
	const [isResetPassword, setIsResetPassword] = useState(false);

	async function signInWithEmail() {
		setLoading(true);
		const { error } = await signIn(email, password);

		if (error) {
			Alert.alert('Fehler bei der Anmeldung', error.message || 'Anmeldung fehlgeschlagen');
		}
		setLoading(false);
	}

	async function signUpWithEmail() {
		setLoading(true);
		const { error } = await signUp(email, password);

		if (error) {
			Alert.alert('Fehler bei der Registrierung', error.message || 'Registrierung fehlgeschlagen');
		} else {
			Alert.alert(
				'Registrierung erfolgreich',
				'Sie wurden erfolgreich registriert und angemeldet.'
			);
		}
		setLoading(false);
	}

	async function handleResetPassword() {
		if (!email) {
			Alert.alert('Fehler', 'Bitte geben Sie Ihre E-Mail-Adresse ein');
			return;
		}

		setLoading(true);

		try {
			const { error } = await resetPassword(email);

			if (error) {
				Alert.alert('Fehler', error.message || 'Fehler beim Zurücksetzen des Passworts');
			} else {
				Alert.alert(
					'E-Mail gesendet',
					'Bitte überprüfen Sie Ihre E-Mail für den Link zum Zurücksetzen des Passworts.'
				);
				setIsResetPassword(false);
			}
		} catch (error: any) {
			Alert.alert(
				'Fehler',
				error.message || 'Netzwerkfehler. Bitte versuchen Sie es später erneut.'
			);
		}

		setLoading(false);
	}

	return (
		<View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
			<View
				style={[
					styles.formContainer,
					{
						backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
						borderColor: isDarkMode ? '#374151' : '#E5E7EB',
					},
				]}
			>
				<View style={styles.logoContainer}>
					<FontAwesome5 name="fire" size={40} color="#F59E0B" style={styles.logoIcon} />
					<Text style={[styles.logoText, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
						ManaCore
					</Text>
				</View>

				<Text style={[styles.header, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
					{isResetPassword ? 'Passwort zurücksetzen' : isSignUp ? 'Registrieren' : 'Anmelden'}
				</Text>

				<Text style={[styles.subHeader, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
					{isResetPassword
						? 'Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen'
						: isSignUp
							? 'Erstellen Sie ein neues Konto, um Mana zu teilen und zu verwalten'
							: 'Melden Sie sich an, um Ihre Mana zu verwalten'}
				</Text>

				<View style={styles.inputContainer}>
					<FontAwesome5
						name="envelope"
						size={16}
						color={isDarkMode ? '#9CA3AF' : '#6B7280'}
						style={styles.inputIcon}
					/>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
								borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
								color: isDarkMode ? '#F9FAFB' : '#1F2937',
							},
						]}
						placeholder="E-Mail"
						placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
					/>
				</View>

				{!isResetPassword && (
					<View style={styles.inputContainer}>
						<FontAwesome5
							name="lock"
							size={16}
							color={isDarkMode ? '#9CA3AF' : '#6B7280'}
							style={styles.inputIcon}
						/>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
									borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
									color: isDarkMode ? '#F9FAFB' : '#1F2937',
								},
							]}
							placeholder="Passwort"
							placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							autoCapitalize="none"
						/>
					</View>
				)}

				<TouchableOpacity
					style={[
						styles.button,
						{
							backgroundColor: themeColors.primary,
							opacity: loading ? 0.7 : 1,
						},
					]}
					onPress={() => {
						if (isResetPassword) {
							handleResetPassword();
						} else if (isSignUp) {
							signUpWithEmail();
						} else {
							signInWithEmail();
						}
					}}
					disabled={loading}
				>
					{loading ? (
						<View style={styles.loadingContainer}>
							<Text style={styles.buttonText}>Lädt</Text>
							<View style={styles.dotsContainer}>
								<Text style={styles.dots}>.</Text>
								<Text style={styles.dots}>.</Text>
								<Text style={styles.dots}>.</Text>
							</View>
						</View>
					) : (
						<Text style={styles.buttonText}>
							{isResetPassword ? 'Link senden' : isSignUp ? 'Registrieren' : 'Anmelden'}
						</Text>
					)}
				</TouchableOpacity>

				{Platform.OS === 'web' && !isSignUp && !isResetPassword && (
					<TouchableOpacity
						style={styles.forgotPasswordButton}
						onPress={() => setIsResetPassword(true)}
					>
						<Text style={[styles.forgotPasswordText, { color: themeColors.primary }]}>
							Passwort vergessen?
						</Text>
					</TouchableOpacity>
				)}

				<TouchableOpacity
					style={styles.switchButton}
					onPress={() => {
						if (isResetPassword) {
							setIsResetPassword(false);
						} else {
							setIsSignUp(!isSignUp);
						}
					}}
				>
					<Text style={[styles.switchText, { color: themeColors.primary }]}>
						{isResetPassword
							? 'Zurück zur Anmeldung'
							: isSignUp
								? 'Bereits ein Konto? Anmelden'
								: 'Kein Konto? Registrieren'}
					</Text>
				</TouchableOpacity>

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
						© {new Date().getFullYear()} ManaCore. Alle Rechte vorbehalten.
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	formContainer: {
		padding: 24,
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		maxWidth: 500,
		width: '100%',
		alignSelf: 'center',
	},
	logoContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	logoIcon: {
		marginRight: 12,
	},
	logoText: {
		fontSize: 28,
		fontWeight: 'bold',
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	subHeader: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 24,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
	},
	button: {
		height: 54,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
	},
	buttonText: {
		color: 'white',
		fontSize: 18,
		fontWeight: 'bold',
	},
	loadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	dotsContainer: {
		flexDirection: 'row',
		marginLeft: 4,
	},
	dots: {
		color: 'white',
		fontSize: 18,
		fontWeight: 'bold',
		marginLeft: 2,
	},
	switchButton: {
		marginTop: 24,
		alignItems: 'center',
	},
	switchText: {
		fontSize: 16,
	},
	forgotPasswordButton: {
		marginTop: 16,
		alignItems: 'center',
	},
	forgotPasswordText: {
		fontSize: 14,
	},
	footer: {
		marginTop: 40,
		alignItems: 'center',
	},
	footerText: {
		fontSize: 12,
	},
});
