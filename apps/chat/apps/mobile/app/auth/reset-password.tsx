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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function ResetPasswordScreen() {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { resetPassword } = useAuth();

	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);

	const handleResetPassword = async () => {
		if (!email) {
			Alert.alert('Fehler', 'Bitte gib deine E-Mail-Adresse ein.');
			return;
		}

		try {
			setLoading(true);
			const { error } = await resetPassword(email);

			if (error) {
				Alert.alert('Fehler', error.message);
			} else {
				Alert.alert(
					'E-Mail gesendet',
					'Eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts wurde an deine E-Mail-Adresse gesendet.',
					[
						{
							text: 'OK',
							onPress: () => router.replace('/auth/login'),
						},
					]
				);
			}
		} catch (error) {
			console.error('Fehler beim Zurücksetzen des Passworts:', error);
			Alert.alert(
				'Fehler',
				'Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten. Bitte versuche es später erneut.'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.text }]}>Passwort zurücksetzen</Text>
				<Text style={[styles.subtitle, { color: colors.text + 'CC' }]}>
					Gib deine E-Mail-Adresse ein, um einen Link zum Zurücksetzen deines Passworts zu erhalten
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

				<TouchableOpacity
					style={[
						styles.resetButton,
						{ backgroundColor: colors.primary },
						loading && { opacity: 0.7 },
					]}
					onPress={handleResetPassword}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#FFFFFF" size="small" />
					) : (
						<Text style={styles.resetButtonText}>Link senden</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<Text style={[styles.backButtonText, { color: colors.text }]}>Zurück zur Anmeldung</Text>
				</TouchableOpacity>
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
	resetButton: {
		height: 56,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	resetButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	backButton: {
		alignItems: 'center',
		padding: 12,
	},
	backButtonText: {
		fontSize: 16,
		fontWeight: '500',
	},
});
