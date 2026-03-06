import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { loginWithPassword, loginWithToken, checkHomeserver } from '~/src/matrix/client';
import { useMatrixStore } from '~/src/matrix/store';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
	const [homeserver, setHomeserver] = useState('matrix.mana.how');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [ssoLoading, setSsoLoading] = useState(false);
	const [checkingServer, setCheckingServer] = useState(false);
	const [serverOk, setServerOk] = useState<boolean | null>(null);

	const { initialize } = useMatrixStore();

	const normalizeHs = (hs: string) => {
		let url = hs.trim();
		if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
		return url.replace(/\/$/, '');
	};

	const handleCheckServer = async () => {
		setCheckingServer(true);
		setServerOk(null);
		const result = await checkHomeserver(homeserver);
		setServerOk(result.ok);
		setError(result.ok ? null : (result.error ?? 'Server not reachable'));
		setCheckingServer(false);
	};

	const handleLogin = async () => {
		if (!homeserver.trim() || !username.trim() || !password.trim()) {
			setError('Please fill in all fields');
			return;
		}
		setLoading(true);
		setError(null);
		const result = await loginWithPassword(homeserver, username, password);
		if (result.success && result.credentials) {
			await initialize(result.credentials);
		} else {
			setError(result.error ?? 'Login failed');
			setLoading(false);
		}
	};

	const handleSSO = async () => {
		setSsoLoading(true);
		setError(null);
		try {
			const base = normalizeHs(homeserver);
			const redirectUri = Linking.createURL('sso-callback');
			const ssoUrl = `${base}/_matrix/client/v3/login/sso/redirect?redirectUrl=${encodeURIComponent(redirectUri)}`;

			const result = await WebBrowser.openAuthSessionAsync(ssoUrl, redirectUri);

			if (result.type === 'success') {
				const url = result.url;
				const parsed = new URL(url);
				const loginToken = parsed.searchParams.get('loginToken');
				if (!loginToken) {
					setError('SSO login failed: no token received');
					return;
				}

				// Exchange token for credentials
				await import('~/src/matrix/polyfills');
				const { createClient } = await import('matrix-js-sdk');
				const tempClient = createClient({ baseUrl: base });
				const response = await tempClient.login('m.login.token', {
					token: loginToken,
					initial_device_display_name: 'Manalink Mobile',
				});

				const loginResult = await loginWithToken(
					base,
					response.access_token,
					response.user_id,
					response.device_id,
				);
				if (loginResult.success && loginResult.credentials) {
					await initialize(loginResult.credentials);
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'SSO failed');
		} finally {
			setSsoLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				<ScrollView
					contentContainerClassName="flex-grow justify-center p-6"
					keyboardShouldPersistTaps="handled"
				>
					{/* Logo */}
					<View className="items-center mb-10">
						<View className="w-20 h-20 bg-primary rounded-3xl items-center justify-center mb-4">
							<Text className="text-white text-4xl">⬡</Text>
						</View>
						<Text className="text-foreground text-4xl font-bold tracking-tight">Manalink</Text>
						<Text className="text-muted-foreground text-sm mt-1">Secure Matrix messaging</Text>
					</View>

					<View className="gap-4">
						{/* Homeserver */}
						<View>
							<Text className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
								Homeserver
							</Text>
							<View className="flex-row items-center gap-2">
								<TextInput
									className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
									value={homeserver}
									onChangeText={(v) => { setHomeserver(v); setServerOk(null); }}
									autoCapitalize="none"
									autoCorrect={false}
									keyboardType="url"
									placeholder="matrix.example.com"
									placeholderTextColor="#6b7280"
									onBlur={handleCheckServer}
								/>
								{checkingServer && <ActivityIndicator size="small" color="#7c6bff" />}
								{serverOk === true && <Text className="text-green-500 text-lg">✓</Text>}
								{serverOk === false && <Text className="text-destructive text-lg">✗</Text>}
							</View>
						</View>

						{/* Username */}
						<View>
							<Text className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
								Username
							</Text>
							<TextInput
								className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
								value={username}
								onChangeText={setUsername}
								autoCapitalize="none"
								autoCorrect={false}
								placeholder="@user:matrix.org or just user"
								placeholderTextColor="#6b7280"
							/>
						</View>

						{/* Password */}
						<View>
							<Text className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
								Password
							</Text>
							<TextInput
								className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								placeholder="••••••••"
								placeholderTextColor="#6b7280"
								onSubmitEditing={handleLogin}
								returnKeyType="go"
							/>
						</View>

						{error && <Text className="text-destructive text-sm text-center">{error}</Text>}

						{/* Password login */}
						<Pressable
							onPress={handleLogin}
							disabled={loading || ssoLoading}
							className={({ pressed }) =>
								`bg-primary rounded-xl py-4 items-center mt-1 ${pressed || loading ? 'opacity-70' : ''}`
							}
						>
							{loading ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text className="text-white font-semibold text-base">Sign in</Text>
							)}
						</Pressable>

						{/* Divider */}
						<View className="flex-row items-center gap-3">
							<View className="flex-1 h-px bg-border" />
							<Text className="text-muted-foreground text-xs">or</Text>
							<View className="flex-1 h-px bg-border" />
						</View>

						{/* SSO */}
						<Pressable
							onPress={handleSSO}
							disabled={loading || ssoLoading}
							className={({ pressed }) =>
								`bg-surface border border-border rounded-xl py-4 items-center ${
									pressed || ssoLoading ? 'opacity-70' : ''
								}`
							}
						>
							{ssoLoading ? (
								<ActivityIndicator color="#7c6bff" />
							) : (
								<Text className="text-foreground font-medium text-base">
									Sign in with SSO
								</Text>
							)}
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
