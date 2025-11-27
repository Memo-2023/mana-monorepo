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
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { AppleSignInButton } from '../../components/auth/AppleSignInButton';
import { spacing } from '~/utils/spacing';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
	const colors = useThemeColors();

	const { signIn, signInWithGoogle, signInWithApple, isLoading, error, clearError } =
		useAuthStore();

	const validateForm = () => {
		const newErrors: { email?: string; password?: string } = {};

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

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleLogin = async () => {
		if (!validateForm()) return;

		try {
			clearError();
			await signIn(email, password);
			router.replace('/(tabs)');
		} catch (err: any) {
			Alert.alert('Login fehlgeschlagen', err.message || 'Ein Fehler ist aufgetreten');
		}
	};

	const handleGoogleSignIn = async (idToken: string) => {
		try {
			clearError();
			await signInWithGoogle(idToken);
			router.replace('/(tabs)');
		} catch (err: any) {
			// Error is already handled in GoogleSignInButton
			throw err;
		}
	};

	const handleAppleSignIn = async (identityToken: string) => {
		try {
			clearError();
			await signInWithApple(identityToken);
			router.replace('/(tabs)');
		} catch (err: any) {
			// Error is already handled in AppleSignInButton
			throw err;
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
								Willkommen zurück
							</Text>
							<Text style={{ textAlign: 'center', color: colors.mutedForeground }}>
								Melde dich an, um fortzufahren
							</Text>
						</View>

						<Card padding="lg" variant="elevated">
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

							<Pressable style={{ marginBottom: spacing.lg }}>
								<Link href="/(auth)/forgot-password" asChild>
									<Text style={{ textAlign: 'right', fontSize: 14, color: colors.primary }}>
										Passwort vergessen?
									</Text>
								</Link>
							</Pressable>

							<Button onPress={handleLogin} loading={isLoading} fullWidth size="lg">
								Anmelden
							</Button>

							{/* Social Sign-In Divider */}
							<View
								style={{ marginVertical: spacing.xl, flexDirection: 'row', alignItems: 'center' }}
							>
								<View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
								<Text
									style={{
										marginHorizontal: spacing.lg,
										color: colors.mutedForeground,
										fontSize: 14,
									}}
								>
									oder
								</Text>
								<View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
							</View>

							{/* Social Sign-In Buttons */}
							<View style={{ gap: spacing.content.small }}>
								<GoogleSignInButton
									onSignIn={handleGoogleSignIn}
									onSignInSuccess={() => console.log('Google sign-in successful')}
									onSignInError={(error) => console.error('Google sign-in error:', error)}
								/>
								<AppleSignInButton
									onSignIn={handleAppleSignIn}
									onSignInSuccess={() => console.log('Apple sign-in successful')}
									onSignInError={(error) => console.error('Apple sign-in error:', error)}
								/>
							</View>

							<View
								style={{
									marginTop: spacing.xl,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ color: colors.mutedForeground }}>Noch kein Konto? </Text>
								<Link href="/(auth)/register" asChild>
									<Pressable>
										<Text style={{ fontWeight: '600', color: colors.primary }}>Registrieren</Text>
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
