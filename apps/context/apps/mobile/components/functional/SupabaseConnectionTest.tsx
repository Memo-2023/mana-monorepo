import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../Button';
import { testSupabaseConnection, testSupabaseAuth, fetchAllSpaces } from '../../utils/supabaseTest';

export const SupabaseConnectionTest = () => {
	const [connectionResult, setConnectionResult] = useState<any>(null);
	const [authResult, setAuthResult] = useState<any>(null);
	const [spacesResult, setSpacesResult] = useState<any>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const testConnection = async () => {
		setLoading(true);
		setConnectionResult(null);

		try {
			const result = await testSupabaseConnection();
			setConnectionResult(result);
		} catch (error: any) {
			setConnectionResult({
				success: false,
				message: `Fehler: ${error.message}`,
				error,
			});
		} finally {
			setLoading(false);
		}
	};

	const testAuth = async () => {
		if (!email || !password) {
			setAuthResult({
				success: false,
				message: 'Bitte E-Mail und Passwort eingeben',
			});
			return;
		}

		setLoading(true);
		setAuthResult(null);

		try {
			const result = await testSupabaseAuth(email, password);
			setAuthResult(result);
		} catch (error: any) {
			setAuthResult({
				success: false,
				message: `Fehler: ${error.message}`,
				error,
			});
		} finally {
			setLoading(false);
		}
	};

	const getSpaces = async () => {
		setLoading(true);
		setSpacesResult(null);

		try {
			const result = await fetchAllSpaces();
			setSpacesResult(result);
		} catch (error: any) {
			setSpacesResult({
				success: false,
				message: `Fehler: ${error.message}`,
				error,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="mb-6">
			<Text variant="h2" className="mb-4">
				Supabase-Verbindungstest
			</Text>

			<View className="mb-6">
				<Button title="Verbindung testen" onPress={testConnection} disabled={loading} />

				{loading && connectionResult === null && (
					<View className="mt-2 items-center">
						<ActivityIndicator size="small" color="#6366f1" />
					</View>
				)}

				{connectionResult && (
					<View
						className="mt-2 p-3 rounded-md"
						style={{
							backgroundColor: connectionResult.success ? '#dcfce7' : '#fee2e2',
						}}
					>
						<Text
							variant="body"
							className={connectionResult.success ? 'text-green-700' : 'text-red-700'}
						>
							{connectionResult.message}
						</Text>
						{connectionResult.data && (
							<Text variant="caption" className="mt-1">
								Daten: {JSON.stringify(connectionResult.data)}
							</Text>
						)}
					</View>
				)}
			</View>

			<View className="mb-6">
				<Text variant="h3" className="mb-2">
					Authentifizierung testen
				</Text>

				<Input
					placeholder="E-Mail"
					value={email}
					onChangeText={setEmail}
					keyboardType="email-address"
					autoCapitalize="none"
					className="mb-2"
				/>

				<Input
					placeholder="Passwort"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					className="mb-2"
				/>

				<Button title="Anmelden" onPress={testAuth} disabled={loading} />

				{loading && authResult === null && (
					<View className="mt-2 items-center">
						<ActivityIndicator size="small" color="#6366f1" />
					</View>
				)}

				{authResult && (
					<View
						className="mt-2 p-3 rounded-md"
						style={{
							backgroundColor: authResult.success ? '#dcfce7' : '#fee2e2',
						}}
					>
						<Text variant="body" className={authResult.success ? 'text-green-700' : 'text-red-700'}>
							{authResult.message}
						</Text>
						{authResult.user && (
							<Text variant="caption" className="mt-1">
								Benutzer-ID: {authResult.user.id}
							</Text>
						)}
					</View>
				)}
			</View>

			<View>
				<Button title="Spaces abrufen" onPress={getSpaces} disabled={loading} />

				{loading && spacesResult === null && (
					<View className="mt-2 items-center">
						<ActivityIndicator size="small" color="#6366f1" />
					</View>
				)}

				{spacesResult && (
					<View
						className="mt-2 p-3 rounded-md"
						style={{
							backgroundColor: spacesResult.success ? '#dcfce7' : '#fee2e2',
						}}
					>
						<Text
							variant="body"
							className={spacesResult.success ? 'text-green-700' : 'text-red-700'}
						>
							{spacesResult.message}
						</Text>
						{spacesResult.spaces && (
							<View className="mt-2">
								<Text variant="body" className="font-bold">
									Spaces:
								</Text>
								{spacesResult.spaces.map((space: any, index: number) => (
									<View
										key={space.id || index}
										className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded"
									>
										<Text variant="body">{space.name}</Text>
										{space.description && <Text variant="caption">{space.description}</Text>}
									</View>
								))}
							</View>
						)}
					</View>
				)}
			</View>
		</Card>
	);
};
