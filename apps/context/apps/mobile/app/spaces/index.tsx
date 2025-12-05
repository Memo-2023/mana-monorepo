import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Screen } from '~/components/layout/Screen';
import { Text } from '~/components/ui/Text';
import { SpaceCard } from '~/components/spaces/SpaceCard';
import { SearchBar } from '~/components/functional/SearchBar';
import { EmptyState } from '~/components/layout/EmptyState';
import { Button } from '~/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { getSpaces, Space } from '~/services/supabaseService';

// Definiere den Typ für einen Space mit zusätzlichen Informationen für die UI
type UISpace = {
	id: string;
	name: string;
	description: string | null;
	documentCount: number;
	tags: string[];
};

export default function SpacesScreen() {
	const router = useRouter();
	const [spaces, setSpaces] = useState<UISpace[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [refreshing, setRefreshing] = useState(false);

	// Funktion zum Laden der Spaces
	const loadSpaces = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const spaces = await getSpaces();

			// Transformiere die Daten in das UI-Format
			const uiSpaces: UISpace[] = spaces.map((space) => ({
				id: space.id,
				name: space.name,
				description: space.description,
				documentCount: 0, // Wird später durch eine separate Abfrage aktualisiert
				tags: space.settings?.tags || [],
			}));

			setSpaces(uiSpaces);
		} catch (err: any) {
			setError('Fehler beim Laden der Spaces: ' + err.message);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	// Lade die Spaces beim ersten Rendern
	useEffect(() => {
		loadSpaces();
	}, [loadSpaces]);

	// Funktion zum Aktualisieren der Spaces (Pull-to-Refresh)
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadSpaces();
	}, [loadSpaces]);

	// Funktion zum Filtern der Spaces nach Suchbegriff
	const filteredSpaces = spaces.filter(
		(space) =>
			space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(space.description && space.description.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	const hasSpaces = filteredSpaces.length > 0;

	return (
		<>
			<Stack.Screen options={{ title: 'Spaces', headerShown: true }} />
			<Screen
				scrollable
				padded
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#6366f1']}
						tintColor="#6366f1"
					/>
				}
			>
				<SearchBar placeholder="Spaces durchsuchen..." onSearch={setSearchQuery} />

				{error && (
					<View className="mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
						<Text className="text-red-800 dark:text-red-200">{error}</Text>
					</View>
				)}

				<View className="flex-row justify-between items-center mb-4">
					<Text variant="h2">Alle Spaces</Text>
					<Button title="Neu" onPress={() => router.push('/spaces/create')} />
				</View>

				{loading ? (
					<View className="flex-1 justify-center items-center py-8">
						<ActivityIndicator size="large" color="#6366f1" />
					</View>
				) : hasSpaces ? (
					<View>
						{filteredSpaces.map((space) => (
							<SpaceCard key={space.id} {...space} />
						))}
					</View>
				) : (
					<EmptyState
						title={searchQuery ? 'Keine Spaces gefunden' : 'Noch keine Spaces vorhanden'}
						description={
							searchQuery
								? 'Es wurden keine Spaces gefunden, die deiner Suche entsprechen.'
								: 'Erstelle deinen ersten Space, um deine Dokumente zu organisieren.'
						}
						icon={<Ionicons name="folder-outline" size={48} color="#6366f1" />}
						actionLabel="Space erstellen"
						onAction={() => router.push('/spaces/create')}
					/>
				)}
			</Screen>
		</>
	);
}
