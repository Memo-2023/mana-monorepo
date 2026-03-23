import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { Input } from '../ui/Input';
import { Button } from '../Button';
import { useAuth } from '../../context/AuthProvider';

type RegisterFormProps = {
	onSuccess?: () => void;
};

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
	const router = useRouter();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { signUp } = useAuth();

	const handleRegister = async () => {
		// Reset states
		setError(null);
		setSuccessMessage(null);

		// Validate inputs
		if (!name || !email || !password || !confirmPassword) {
			setError('Bitte fülle alle Felder aus.');
			return;
		}

		if (password !== confirmPassword) {
			setError('Die Passwörter stimmen nicht überein.');
			return;
		}

		if (password.length < 6) {
			setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
			return;
		}

		setLoading(true);

		try {
			// Verwende die signUp-Funktion aus dem AuthProvider
			const { data, error: authError } = await signUp(email, password);

			if (!authError) {
				// Handle successful registration
				if (onSuccess) {
					onSuccess();
				} else {
					router.replace('/');
				}
			} else {
				setError(authError?.message || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.');
			}
		} catch (err: any) {
			setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
			console.error('Registration error:', err);
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

			{successMessage && (
				<View className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
					<Text className="text-green-800 dark:text-green-200">{successMessage}</Text>
				</View>
			)}

			<Input
				label="Name"
				placeholder="Dein Name"
				value={name}
				onChangeText={setName}
				className="mb-4"
			/>

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
				className="mb-4"
			/>

			<Input
				label="Passwort bestätigen"
				placeholder="Passwort wiederholen"
				secureTextEntry
				value={confirmPassword}
				onChangeText={setConfirmPassword}
				className="mb-6"
			/>

			<Button
				title={loading ? 'Registrieren...' : 'Registrieren'}
				onPress={handleRegister}
				disabled={loading || !name || !email || !password || !confirmPassword}
				className={loading || !name || !email || !password || !confirmPassword ? 'opacity-70' : ''}
			>
				{loading && <ActivityIndicator size="small" color="#ffffff" style={{ marginLeft: 8 }} />}
			</Button>

			<View className="mt-4 items-center">
				<Text className="text-gray-600 dark:text-gray-400">
					Bereits ein Konto?{' '}
					<Text
						className="text-indigo-600 dark:text-indigo-400 font-semibold"
						onPress={() => router.push('/login')}
					>
						Anmelden
					</Text>
				</Text>
			</View>
		</View>
	);
};
