import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '~/components/layout/Screen';
import { Text } from '~/components/ui/Text';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/Button';
import { Card } from '~/components/ui/Card';
import { createSpace } from '~/services/supabaseService';

export default function CreateSpaceScreen() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCreateSpace = async () => {
		// Validierung
		if (!name.trim()) {
			setError('Bitte gib einen Namen für den Space ein.');
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const { data, error } = await createSpace(name.trim(), description.trim() || undefined);

			if (error) {
				setError(`Fehler beim Erstellen des Space: ${error.message}`);
				return;
			}

			if (data) {
				// Erfolgreich erstellt, navigiere zurück zur Space-Übersicht
				router.replace('/spaces');
			}
		} catch (err: any) {
			setError(`Unerwarteter Fehler: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Neuen Space erstellen',
					headerShown: true,
				}}
			/>

			<Screen scrollable padded>
				<Card className="p-4">
					{error && (
						<View className="mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
							<Text className="text-red-800 dark:text-red-200">{error}</Text>
						</View>
					)}

					<Input
						label="Name"
						placeholder="Name des Space"
						value={name}
						onChangeText={setName}
						className="mb-4"
						autoFocus
					/>

					<Input
						label="Beschreibung (optional)"
						placeholder="Beschreibung des Space"
						value={description}
						onChangeText={setDescription}
						multiline
						numberOfLines={3}
						className="mb-6"
					/>

					<View className="flex-row justify-end space-x-4">
						<Button
							title="Abbrechen"
							onPress={() => router.back()}
							className="bg-gray-300 dark:bg-gray-700"
						/>
						<Button
							title={loading ? 'Wird erstellt...' : 'Space erstellen'}
							onPress={handleCreateSpace}
							disabled={loading || !name.trim()}
							className={loading || !name.trim() ? 'opacity-70' : ''}
						>
							{loading && (
								<ActivityIndicator size="small" color="#ffffff" style={{ marginLeft: 8 }} />
							)}
						</Button>
					</View>
				</Card>
			</Screen>
		</>
	);
}
