import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '~/contexts/AuthContext';

export default function LoginScreen() {
	const { signIn } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!email || !password) {
			setError('Please enter email and password');
			return;
		}

		setLoading(true);
		setError(null);

		const result = await signIn(email, password);

		if (result.error) {
			setError(result.error.message || 'Login failed');
		}

		setLoading(false);
	};

	return (
		<SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1 justify-center px-6"
			>
				<View className="items-center mb-12">
					<Text className="text-4xl font-bold text-primary">Figgos</Text>
					<Text className="text-base text-muted mt-2">Collect your fantasy figures</Text>
				</View>

				<View className="space-y-4">
					<TextInput
						className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg px-4 py-3 text-textColor dark:text-dark-textColor"
						placeholder="Email"
						placeholderTextColor="#B2BEC3"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
					/>

					<TextInput
						className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg px-4 py-3 text-textColor dark:text-dark-textColor mt-3"
						placeholder="Password"
						placeholderTextColor="#B2BEC3"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
					/>

					{error && <Text className="text-red-500 text-center mt-2">{error}</Text>}

					<Pressable
						onPress={handleLogin}
						disabled={loading}
						className={({ pressed }) =>
							`bg-primary rounded-lg py-3 mt-4 ${pressed ? 'opacity-80' : ''} ${loading ? 'opacity-50' : ''}`
						}
					>
						<Text className="text-white text-center font-semibold text-base">
							{loading ? 'Signing in...' : 'Sign In'}
						</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
