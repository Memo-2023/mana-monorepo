import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';
import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { Container } from '~/components/Container';

export default function ResetPasswordScreen() {
	const { theme } = useTheme();
	const { resetPassword: resetPasswordAuth } = useAuth();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);

	async function handleResetPassword() {
		if (!email) {
			Alert.alert('Fehler', 'Bitte E-Mail-Adresse eingeben');
			return;
		}

		setLoading(true);

		const { error } = await resetPasswordAuth(email.trim());

		if (error) {
			const errorMessage = error.message || 'Passwort-Zurücksetzung fehlgeschlagen';
			Alert.alert('Fehler', errorMessage);
		} else {
			Alert.alert(
				'E-Mail gesendet!',
				'Überprüfe deine E-Mail für den Link zum Zurücksetzen des Passworts.',
				[{ text: 'OK', onPress: () => router.back() }]
			);
		}

		setLoading(false);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<Container>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className="flex-1"
				>
					<View className="flex-1 justify-center">
						<View className="mb-8">
							<Text variant="h1" color="primary" align="center" className="mb-2">
								Passwort zurücksetzen
							</Text>
							<Text variant="body" color="secondary" align="center">
								Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen
							</Text>
						</View>

						<View className="space-y-4">
							<View>
								<Text variant="label" color="secondary" className="mb-1">
									E-Mail
								</Text>
								<TextInput
									style={{
										borderWidth: 1,
										borderColor: theme.colors.border,
										backgroundColor: theme.colors.input,
										borderRadius: 8,
										paddingHorizontal: 16,
										paddingVertical: 12,
										fontSize: 16,
										color: theme.colors.text.primary,
									}}
									onChangeText={setEmail}
									value={email}
									placeholder="deine@email.de"
									placeholderTextColor={theme.colors.text.tertiary}
									autoCapitalize="none"
									keyboardType="email-address"
									autoComplete="email"
								/>
							</View>

							<Button
								title={loading ? 'Senden...' : 'Link senden'}
								onPress={handleResetPassword}
								disabled={loading}
								className="mt-4"
							/>

							<View className="mt-6 flex-row justify-center">
								<Link href="/(auth)/login" asChild>
									<Text variant="body" style={{ color: theme.colors.primary.default }}>
										Zurück zur Anmeldung
									</Text>
								</Link>
							</View>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Container>
		</SafeAreaView>
	);
}
