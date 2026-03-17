import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, TextInput } from 'react-native';

import { EmptyState } from '~/components/EmptyState';
import { SongList } from '~/components/SongList';
import { searchSongs } from '~/services/libraryService';
import type { Song } from '~/types';
import { useTheme } from '~/utils/themeContext';

export default function SearchScreen() {
	const { colors } = useTheme();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<Song[]>([]);
	const [hasSearched, setHasSearched] = useState(false);

	const handleSearch = useCallback(async (text: string) => {
		setQuery(text);
		if (text.trim().length < 2) {
			setResults([]);
			setHasSearched(false);
			return;
		}
		setHasSearched(true);
		const songs = await searchSongs(text.trim());
		setResults(songs);
	}, []);

	return (
		<View style={{ flex: 1 }}>
			<Stack.Screen options={{ title: 'Suche' }} />

			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					backgroundColor: colors.backgroundTertiary,
					borderRadius: 10,
					margin: 16,
					paddingHorizontal: 12,
				}}
			>
				<Ionicons name="search" size={18} color={colors.textTertiary} />
				<TextInput
					value={query}
					onChangeText={handleSearch}
					placeholder="Songs, Künstler, Alben..."
					placeholderTextColor={colors.textTertiary}
					style={{
						flex: 1,
						paddingVertical: 10,
						paddingHorizontal: 8,
						fontSize: 16,
						color: colors.text,
					}}
					autoCorrect={false}
					clearButtonMode="while-editing"
				/>
			</View>

			{!hasSearched ? (
				<EmptyState
					icon="search-outline"
					title="Suche"
					message="Suche nach Songs, Künstlern oder Alben."
				/>
			) : results.length === 0 ? (
				<EmptyState
					icon="search-outline"
					title="Keine Ergebnisse"
					message={`Keine Treffer für "${query}".`}
				/>
			) : (
				<SongList songs={results} emptyTitle="Keine Ergebnisse" />
			)}
		</View>
	);
}
