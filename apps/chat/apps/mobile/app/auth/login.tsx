import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function LoginScreen() {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { signIn } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert('Fehler', 'Bitte gib deine E-Mail-Adresse und dein Passwort ein.');
			return;
		}

		try {
			setLoading(true);
			const { error } = await signIn(email, password);

			if (error) {
				Alert.alert('Anmeldung fehlgeschlagen', error.message || 'Unbekannter Fehler');
			} else {
				// Erfolgreich angemeldet, navigiere zur Hauptseite
				router.replace('/');
			}
		} catch (error) {
			console.error('Fehler bei der Anmeldung:', error);
			Alert.alert(
				'Fehler',
				'Bei der Anmeldung ist ein Fehler aufgetreten. Bitte versuche es später erneut.'
			);
		} finally {
			setLoading(false);
		}
	};

	// Magic Link ist derzeit nicht verfügbar (mana-core-auth unterstützt dies nicht)
	const handleMagicLink = async () => {
		Alert.alert(
			'Nicht verfügbar',
			'Magic Link Anmeldung ist derzeit nicht verfügbar. Bitte nutze E-Mail und Passwort.'
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.text }]}>Willkommen zurück</Text>
				<Text style={[styles.subtitle, { color: colors.text + 'CC' }]}>
					Melde dich an, um deine Konversationen fortzusetzen
				</Text>
			</View>

			<View style={styles.form}>
				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>E-Mail</Text>
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
							placeholder="deine@email.de"
							placeholderTextColor={colors.text + '60'}
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							keyboardType="email-address"
						/>
					</View>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Passwort</Text>
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
							placeholder="Passwort"
							placeholderTextColor={colors.text + '60'}
							value={password}
							onChangeText={setPassword}
							secureTextEntry={!showPassword}
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

				<TouchableOpacity
					style={styles.forgotPassword}
					onPress={() => router.push('/auth/reset-password')}
				>
					<Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
						Passwort vergessen?
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.loginButton,
						{ backgroundColor: colors.primary },
						loading && { opacity: 0.7 },
					]}
					onPress={handleLogin}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#FFFFFF" size="small" />
					) : (
						<Text style={styles.loginButtonText}>Anmelden</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.magicLinkButton,
						{ backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 },
						loading && { opacity: 0.7 },
					]}
					onPress={handleMagicLink}
					disabled={loading || isMagicLinkSent}
				>
					{loading ? (
						<ActivityIndicator color={colors.primary} size="small" />
					) : (
						<Text style={[styles.magicLinkButtonText, { color: colors.primary }]}>
							{isMagicLinkSent ? 'Magic Link gesendet' : 'Mit Magic Link anmelden'}
						</Text>
					)}
				</TouchableOpacity>

				<View style={styles.signupContainer}>
					<Text style={[styles.signupText, { color: colors.text + 'CC' }]}>Noch kein Konto?</Text>
					<Link href="/auth/register" asChild>
						<TouchableOpacity>
							<Text style={[styles.signupLink, { color: colors.primary }]}>Registrieren</Text>
						</TouchableOpacity>
					</Link>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
	},
	header: {
		marginTop: 40,
		marginBottom: 40,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
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
	forgotPassword: {
		alignSelf: 'flex-end',
		marginBottom: 24,
	},
	forgotPasswordText: {
		fontSize: 14,
		fontWeight: '600',
	},
	loginButton: {
		height: 56,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	magicLinkButton: {
		height: 56,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	magicLinkButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	loginButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	signupContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	signupText: {
		fontSize: 14,
		marginRight: 4,
	},
	signupLink: {
		fontSize: 14,
		fontWeight: '600',
	},
});
