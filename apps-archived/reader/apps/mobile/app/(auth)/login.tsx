import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '~/hooks/useAuth';
import { useTheme } from '~/hooks/useTheme';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { signIn } = useAuth();
	const { colors } = useTheme();

	const handleLogin = async () => {
		if (!email || !password) {
			setError('Bitte fülle alle Felder aus');
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setError('Bitte gib eine gültige E-Mail-Adresse ein');
			return;
		}

		setLoading(true);
		setError(null);

		const { error } = await signIn(email, password);

		if (error) {
			setError(error);
			setLoading(false);
		} else {
			router.replace('/(tabs)');
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			className={`flex-1 ${colors.surface}`}
		>
			<View className="flex-1 justify-center px-8">
				<View className="mb-8">
					<Text className={`mb-2 text-4xl font-bold ${colors.text}`}>Willkommen zurück</Text>
					<Text className={`${colors.textSecondary}`}>Melde dich an, um fortzufahren</Text>
				</View>

				{error && (
					<View className={`mb-4 rounded-lg border border-red-200 ${colors.errorLight} p-3`}>
						<Text className="text-red-700">{error}</Text>
					</View>
				)}

				<View className="space-y-4">
					<View className="mb-4">
						<Text className={`mb-1 text-sm font-medium ${colors.textSecondary}`}>E-Mail</Text>
						<TextInput
							value={email}
							onChangeText={setEmail}
							placeholder="deine@email.de"
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							textContentType="emailAddress"
							autoComplete="email"
							accessibilityLabel="E-Mail eingeben"
							className={`rounded-lg border ${colors.borderSecondary} px-4 py-3 text-base focus:border-blue-500 ${colors.text}`}
						/>
					</View>

					<View className="mb-4">
						<Text className={`mb-1 text-sm font-medium ${colors.textSecondary}`}>Passwort</Text>
						<TextInput
							value={password}
							onChangeText={setPassword}
							placeholder="Dein Passwort"
							secureTextEntry
							textContentType="none"
							autoComplete="off"
							accessibilityLabel="Passwort eingeben"
							className={`rounded-lg border ${colors.borderSecondary} px-4 py-3 text-base focus:border-blue-500 ${colors.text}`}
						/>
					</View>

					<Pressable
						onPress={handleLogin}
						disabled={loading}
						accessibilityRole="button"
						accessibilityLabel="Anmelden"
						className={`mt-2 rounded-lg px-4 py-3 ${loading ? 'bg-gray-400' : colors.primary}`}
					>
						{loading ? (
							<ActivityIndicator color="white" />
						) : (
							<Text className="text-center text-base font-semibold text-white">Anmelden</Text>
						)}
					</Pressable>

					<View className="mt-4 flex-row justify-center">
						<Text className={`${colors.textSecondary}`}>Noch kein Konto? </Text>
						<Link href="/(auth)/register" asChild>
							<Pressable>
								<Text className="font-medium text-blue-600">Registrieren</Text>
							</Pressable>
						</Link>
					</View>

					<Link href="/(auth)/forgot-password" asChild>
						<Pressable className="mt-2">
							<Text className={`text-center ${colors.textSecondary}`}>Passwort vergessen?</Text>
						</Pressable>
					</Link>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}
