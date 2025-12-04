import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Keyboard,
	ImageBackground,
	Platform,
	Pressable,
	Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { useTheme } from '../../utils/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Validate email format
const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password: string): string | null => {
	if (password.length < 6) return 'Das Passwort muss mindestens 6 Zeichen lang sein';
	if (!/[A-Z]/.test(password)) return 'Das Passwort muss mindestens einen Großbuchstaben enthalten';
	if (!/[a-z]/.test(password))
		return 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten';
	if (!/[0-9]/.test(password)) return 'Das Passwort muss mindestens eine Zahl enthalten';
	return null;
};

type AuthMode = 'initial' | 'login' | 'register';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [mode, setMode] = useState<AuthMode>('initial');
	const [isResetPassword, setIsResetPassword] = useState(false);

	const { signIn, signUp } = useAuth();
	const router = useRouter();
	const { theme, isDark } = useTheme();

	// Clear error messages when inputs change
	const handleEmailChange = (text: string) => {
		setEmail(text);
		setEmailError(null);
	};

	const handlePasswordChange = (text: string) => {
		setPassword(text);
		setPasswordError(null);
	};

	const handleConfirmPasswordChange = (text: string) => {
		setConfirmPassword(text);
		setPasswordError(null);
	};

	// Handle password reset
	const handleResetPassword = async () => {
		setEmailError(null);

		if (!email) {
			setEmailError('Bitte gib deine E-Mail-Adresse ein');
			return;
		}

		if (!validateEmail(email)) {
			setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
			return;
		}

		setLoading(true);
		try {
			// This is a placeholder - Supabase doesn't have a direct method for this
			// You would need to implement this in your backend or use Supabase's email templates
			Alert.alert(
				'Funktion nicht verfügbar',
				'Die Passwort-Zurücksetzen-Funktion ist noch nicht implementiert.'
			);
			setMode('login');
			setIsResetPassword(false);
		} catch (error) {
			console.error('Password reset error:', error);
			Alert.alert('Fehler', 'Ein unbekannter Fehler ist aufgetreten');
		} finally {
			setLoading(false);
		}
	};

	// Handle login
	const handleLogin = async () => {
		// Dismiss keyboard
		Keyboard.dismiss();

		setEmailError(null);
		setPasswordError(null);

		// Validate inputs
		if (!email.trim()) {
			setEmailError('Bitte gib deine E-Mail-Adresse ein');
			return;
		}

		if (!password) {
			setPasswordError('Bitte gib dein Passwort ein');
			return;
		}

		// Validate email format
		if (!validateEmail(email)) {
			setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
			return;
		}

		setLoading(true);

		try {
			console.log('Attempting login with email:', email);
			const { error } = await signIn(email, password);

			if (error) {
				console.error('Login error:', error);
				// Handle specific error cases with user-friendly messages
				if (error.message.includes('Invalid login credentials')) {
					setPasswordError('E-Mail oder Passwort ist falsch');
				} else if (error.message.includes('Email not confirmed')) {
					setEmailError('Deine E-Mail wurde noch nicht bestätigt');
				} else if (error.message.includes('rate limit')) {
					setEmailError('Zu viele Anmeldeversuche. Bitte versuche es später erneut');
				} else if (error.message.includes('network')) {
					setEmailError('Netzwerkfehler. Bitte überprüfe deine Internetverbindung');
				} else {
					setEmailError(error.message || 'Ein unbekannter Fehler ist aufgetreten');
				}
			} else {
				console.log('Login successful');
				router.replace('/(tabs)');
			}
		} catch (e) {
			console.error('Unexpected login error:', e);
			setEmailError('Ein unerwarteter Fehler ist aufgetreten');
		} finally {
			setLoading(false);
		}
	};

	// Handle signup
	const handleSignUp = async () => {
		// Dismiss keyboard
		Keyboard.dismiss();

		setEmailError(null);
		setPasswordError(null);

		// Validate inputs
		if (!email.trim()) {
			setEmailError('Bitte gib deine E-Mail-Adresse ein');
			return;
		}

		if (!password) {
			setPasswordError('Bitte gib ein Passwort ein');
			return;
		}

		if (!confirmPassword) {
			setPasswordError('Bitte bestätige dein Passwort');
			return;
		}

		// Validate email format
		if (!validateEmail(email)) {
			setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
			return;
		}

		if (password !== confirmPassword) {
			setPasswordError('Die Passwörter stimmen nicht überein');
			return;
		}

		const passwordValidationError = validatePassword(password);
		if (passwordValidationError) {
			setPasswordError(passwordValidationError);
			return;
		}

		setLoading(true);

		try {
			console.log('Attempting signup with email:', email);
			const { error } = await signUp(email, password);

			if (error) {
				console.error('Signup error:', error);
				// Handle specific error cases with user-friendly messages
				if (error.message.includes('already registered')) {
					setEmailError('Diese E-Mail-Adresse wird bereits verwendet');
				} else if (error.message.includes('rate limit')) {
					setEmailError('Zu viele Registrierungsversuche. Bitte versuche es später erneut');
				} else if (error.message.includes('network')) {
					setEmailError('Netzwerkfehler. Bitte überprüfe deine Internetverbindung');
				} else if (error.message.includes('weak password')) {
					setPasswordError('Dein Passwort ist zu schwach. Bitte wähle ein stärkeres Passwort');
				} else {
					setEmailError(error.message || 'Ein unbekannter Fehler ist aufgetreten');
				}
			} else {
				console.log('Signup successful');
				Alert.alert(
					'Registrierung erfolgreich',
					'Bitte überprüfe deine E-Mail, um dein Konto zu bestätigen.',
					[
						{
							text: 'OK',
							onPress: () => {
								setMode('login');
								setEmail('');
								setPassword('');
								setConfirmPassword('');
							},
						},
					]
				);
			}
		} catch (e) {
			console.error('Unexpected signup error:', e);
			setEmailError('Ein unerwarteter Fehler ist aufgetreten');
		} finally {
			setLoading(false);
		}
	};

	// Dynamic styles that depend on the theme
	const dynamicStyles = {
		loginButton: {
			backgroundColor: '#555', // More neutral color for login button
		},
		signUpButton: {
			backgroundColor: theme.colors.primary,
		},
		backButton: {
			backgroundColor: theme.colors.text + '80', // With opacity
		},
	};

	return (
		<View style={styles.mainContainer}>
			<ImageBackground
				source={require('../../assets/actionfigures/YourCharacter.png')}
				style={styles.backgroundImage}
				resizeMode="contain"
				imageStyle={{ top: 0 }}
			>
				<KeyboardAwareScrollView
					style={styles.container}
					contentContainerStyle={styles.scrollContent}
					extraScrollHeight={100}
					enableOnAndroid
					keyboardShouldPersistTaps="handled"
				>
					{/* Title removed as requested */}

					<BlurView intensity={80} tint="dark" style={styles.contentContainer}>
						<Text style={styles.subtitle}>
							{mode === 'initial' && 'Erstelle ein Konto oder melde dich an'}
							{mode === 'login' && !isResetPassword && 'Melde dich mit deinem Konto an'}
							{mode === 'login' &&
								isResetPassword &&
								'Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen'}
							{mode === 'register' && 'Erstelle ein neues Konto'}
						</Text>

						{mode !== 'initial' && (
							<View style={styles.inputContainer}>
								<TextInput
									style={[styles.input, emailError && styles.inputError]}
									placeholder="E-Mail"
									placeholderTextColor="#888"
									value={email}
									onChangeText={handleEmailChange}
									autoCapitalize="none"
									keyboardType="email-address"
									testID="email-input"
								/>
								{emailError && <Text style={styles.errorText}>{emailError}</Text>}

								{!isResetPassword && (
									<>
										<TextInput
											style={[styles.input, passwordError && styles.inputError]}
											placeholder="Passwort"
											placeholderTextColor="#888"
											value={password}
											onChangeText={handlePasswordChange}
											secureTextEntry
											testID="password-input"
										/>
										{passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

										{mode === 'register' && (
											<>
												<TextInput
													style={[styles.input, passwordError && styles.inputError]}
													placeholder="Passwort bestätigen"
													placeholderTextColor="#888"
													value={confirmPassword}
													onChangeText={handleConfirmPasswordChange}
													secureTextEntry
													testID="confirm-password-input"
												/>
											</>
										)}
									</>
								)}
							</View>
						)}

						{mode === 'login' && !isResetPassword && (
							<Pressable
								style={styles.forgotPasswordContainer}
								onPress={() => setIsResetPassword(true)}
							>
								<Text style={styles.forgotPasswordText}>Passwort vergessen</Text>
								<Text style={styles.forgotPasswordArrow}>→</Text>
							</Pressable>
						)}

						<View style={styles.buttonContainer}>
							{mode === 'initial' ? (
								<>
									<TouchableOpacity
										style={[styles.button, dynamicStyles.signUpButton]}
										onPress={() => setMode('register')}
									>
										<View style={styles.buttonContent}>
											<Text style={styles.buttonText}>Konto erstellen</Text>
											<FontAwesome
												name="user-plus"
												size={18}
												color="#fff"
												style={styles.buttonIcon}
											/>
										</View>
									</TouchableOpacity>

									<TouchableOpacity
										style={[styles.button, dynamicStyles.loginButton]}
										onPress={() => setMode('login')}
									>
										<View style={styles.buttonContent}>
											<Text style={styles.buttonText}>Anmelden</Text>
											<FontAwesome
												name="arrow-right"
												size={18}
												color="#fff"
												style={styles.buttonIcon}
											/>
										</View>
									</TouchableOpacity>
								</>
							) : (
								<>
									<TouchableOpacity
										style={[
											styles.button,
											mode === 'register'
												? dynamicStyles.signUpButton
												: mode === 'login' && email && password && !isResetPassword
													? dynamicStyles.signUpButton // Highlight when login fields are filled
													: dynamicStyles.loginButton,
										]}
										onPress={
											mode === 'register'
												? handleSignUp
												: isResetPassword
													? handleResetPassword
													: handleLogin
										}
										disabled={loading}
									>
										{loading ? (
											<ActivityIndicator color="#fff" />
										) : (
											<View style={styles.buttonContent}>
												<Text style={styles.buttonText}>
													{mode === 'register'
														? 'Konto erstellen'
														: isResetPassword
															? 'Passwort zurücksetzen'
															: 'Anmelden'}
												</Text>
												<FontAwesome
													name={
														mode === 'register'
															? 'user-plus'
															: isResetPassword
																? 'key'
																: 'arrow-right'
													}
													size={18}
													color="#fff"
													style={styles.buttonIcon}
												/>
											</View>
										)}
									</TouchableOpacity>

									<TouchableOpacity
										style={[styles.button, dynamicStyles.backButton]}
										onPress={() => {
											setMode('initial');
											setEmail('');
											setPassword('');
											setConfirmPassword('');
											setEmailError(null);
											setPasswordError(null);
											setIsResetPassword(false);
										}}
									>
										<View style={styles.buttonContent}>
											<Text style={styles.buttonText}>Zurück</Text>
											<FontAwesome
												name="arrow-left"
												size={18}
												color="#fff"
												style={styles.buttonIcon}
											/>
										</View>
									</TouchableOpacity>
								</>
							)}
						</View>

						<Text style={styles.legalText}>
							Mit der Anmeldung stimmst du unseren <Text style={styles.legalLink}>AGB</Text> und der{' '}
							<Text style={styles.legalLink}>Datenschutzerklärung</Text> zu.
						</Text>
					</BlurView>
				</KeyboardAwareScrollView>
			</ImageBackground>
		</View>
	);
}

const styles = StyleSheet.create({
	mainContainer: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'flex-start',
		backgroundColor: '#000',
	},
	backgroundImage: {
		flex: 1,
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingTop: 0, // Image at the very top
	},
	container: {
		flex: 1,
		backgroundColor: 'transparent',
		width: '100%',
		maxWidth: 480,
		aspectRatio: Platform.OS === 'ios' ? undefined : 0.7,
		alignSelf: 'center',
		marginHorizontal: 'auto',
	},
	scrollContent: {
		flexGrow: 1,
		width: '100%',
	},
	headerContainer: {
		marginTop: Platform.OS === 'ios' ? 20 : 30,
		paddingHorizontal: Platform.OS === 'ios' ? 20 : 40,
	},
	contentContainer: {
		width: '100%',
		padding: Platform.OS === 'ios' ? 16 : 20,
		paddingBottom: Platform.OS === 'ios' ? 16 : 8,
		marginTop: 'auto',
		overflow: 'hidden',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
	},
	title: {
		fontSize: 36,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
		color: '#fff',
	},
	subtitle: {
		fontSize: 18,
		textAlign: 'center',
		color: '#fff',
		marginBottom: 20,
		opacity: 0.9,
	},
	inputContainer: {
		marginBottom: 20,
	},
	input: {
		height: 55,
		borderColor: '#333',
		borderWidth: 1,
		marginBottom: 8,
		paddingHorizontal: 15,
		borderRadius: 10,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		color: '#fff',
		fontSize: 18,
	},
	inputError: {
		borderColor: '#ff4444',
	},
	errorText: {
		color: '#ff4444',
		fontSize: 12,
		marginBottom: 10,
		marginLeft: 5,
	},
	buttonContainer: {
		gap: 15,
	},
	button: {
		height: 50,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loginButton: {
		backgroundColor: '#4a90e2', // Default color, will be overridden
	},
	signUpButton: {
		backgroundColor: '#ff69b4', // Default color, will be overridden
	},
	backButton: {
		backgroundColor: '#555', // Default color, will be overridden
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonIcon: {
		marginLeft: 10,
	},
	legalText: {
		color: '#fff',
		fontSize: 12,
		textAlign: 'center',
		marginTop: 20,
		marginBottom: 10,
		opacity: 0.8,
	},
	legalLink: {
		textDecorationLine: 'underline',
	},
	forgotPasswordContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
		paddingHorizontal: 4,
	},
	forgotPasswordText: {
		color: '#fff',
		fontSize: 14,
		opacity: 0.9,
	},
	forgotPasswordArrow: {
		color: '#fff',
		fontSize: 14,
		marginLeft: 8,
		opacity: 0.9,
	},
});
