import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { Input } from '../ui/Input';
import { Button } from '../Button';
import { useAuth } from '../../context/AuthProvider';

type LoginFormProps = {
	onSuccess?: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { signIn } = useAuth();

	const handleLogin = async () => {
		// Reset error state
		setError(null);
		setLoading(true);

		try {
			// Verwende die signIn-Funktion aus dem AuthProvider
			const { error: authError } = await signIn(email, password);

			if (!authError) {
				// Handle successful login
				if (onSuccess) {
					onSuccess();
				} else {
					router.replace('/');
				}
			} else {
				setError(
					authError?.message || 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.'
				);
			}
		} catch (err: any) {
			setError('Anmeldung fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.');
			console.error('Login error:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="w-full">
			{error && (
				<View className="mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
					<Text className="text-red-800 dark:text-red-200">{error}</Text>
				</View>
			)}

			<Input
				label="E-Mail"
				placeholder="deine@email.de"
				keyboardType="email-address"
				autoCapitalize="none"
				value={email}
				onChangeText={setEmail}
				className="mb-4"
			/>

			<Input
				label="Passwort"
				placeholder="Dein Passwort"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
				className="mb-6"
			/>

			<Button
				title={loading ? 'Anmelden...' : 'Anmelden'}
				onPress={handleLogin}
				disabled={loading || !email || !password}
				className={loading || !email || !password ? 'opacity-70' : ''}
			>
				{loading && <ActivityIndicator size="small" color="#ffffff" style={{ marginLeft: 8 }} />}
			</Button>

			<View className="mt-4 items-center">
				<Text className="text-gray-600 dark:text-gray-400">
					Noch kein Konto?{' '}
					<Text
						className="text-indigo-600 dark:text-indigo-400 font-semibold"
						onPress={() => router.push('/register')}
					>
						Registrieren
					</Text>
				</Text>
			</View>
		</View>
	);
};
