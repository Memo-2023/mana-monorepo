import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/Text';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

export default function RegisterScreen() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<{
		username?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});
	const colors = useThemeColors();

	const { signUp, isLoading, clearError } = useAuthStore();

	const validateForm = () => {
		const newErrors: typeof errors = {};

		if (!username) {
			newErrors.username = 'Benutzername ist erforderlich';
		} else if (username.length < 3) {
			newErrors.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
		}

		if (!email) {
			newErrors.email = 'E-Mail ist erforderlich';
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			newErrors.email = 'Ungültige E-Mail-Adresse';
		}

		if (!password) {
			newErrors.password = 'Passwort ist erforderlich';
		} else if (password.length < 6) {
			newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
		}

		if (!confirmPassword) {
			newErrors.confirmPassword = 'Passwort-Bestätigung ist erforderlich';
		} else if (password !== confirmPassword) {
			newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleRegister = async () => {
		if (!validateForm()) return;

		try {
			clearError();
			await signUp(email, password, username);
			Alert.alert(
				'Registrierung erfolgreich!',
				'Bitte überprüfe deine E-Mail, um dein Konto zu bestätigen.',
				[{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
			);
		} catch (err: any) {
			Alert.alert('Registrierung fehlgeschlagen', err.message || 'Ein Fehler ist aufgetreten');
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
					<View
						style={{
							flex: 1,
							justifyContent: 'center',
							paddingHorizontal: 24,
							paddingVertical: 32,
						}}
					>
						<View style={{ marginBottom: spacing.xxl }}>
							<Text
								style={{
									marginBottom: spacing.sm,
									textAlign: 'center',
									fontSize: 32,
									fontWeight: 'bold',
									color: colors.foreground,
								}}
							>
								Konto erstellen
							</Text>
							<Text style={{ textAlign: 'center', color: colors.mutedForeground }}>
								Registriere dich, um loszulegen
							</Text>
						</View>

						<Card padding="lg" variant="elevated">
							<Input
								label="Benutzername"
								placeholder="deinbenutzername"
								value={username}
								onChangeText={setUsername}
								error={errors.username}
								leftIcon="person-outline"
								autoComplete="username"
							/>

							<Input
								label="E-Mail"
								type="email"
								placeholder="deine@email.de"
								value={email}
								onChangeText={setEmail}
								error={errors.email}
								leftIcon="mail-outline"
								autoComplete="email"
							/>

							<Input
								label="Passwort"
								type="password"
								placeholder="••••••••"
								value={password}
								onChangeText={setPassword}
								error={errors.password}
								leftIcon="lock-closed-outline"
							/>

							<Input
								label="Passwort bestätigen"
								type="password"
								placeholder="••••••••"
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								error={errors.confirmPassword}
								leftIcon="lock-closed-outline"
							/>

							<Button onPress={handleRegister} loading={isLoading} fullWidth size="lg">
								Registrieren
							</Button>

							<View
								style={{
									marginTop: spacing.xl,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ color: colors.mutedForeground }}>Bereits ein Konto? </Text>
								<Link href="/(auth)/login" asChild>
									<Pressable>
										<Text style={{ fontWeight: '600', color: colors.primary }}>Anmelden</Text>
									</Pressable>
								</Link>
							</View>
						</Card>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
