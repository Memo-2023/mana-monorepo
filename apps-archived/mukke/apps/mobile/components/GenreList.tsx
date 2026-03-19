import { Ionicons } from '@expo/vector-icons';
import { FlatList, View } from 'react-native';

import type { Genre } from '~/types';
import { useTheme } from '~/utils/themeContext';
import { usePlayerStore } from '~/stores/playerStore';
import { getSongsByGenre } from '~/services/libraryService';

import { EmptyState } from './EmptyState';
import { ListItem } from './ListItem';

interface GenreListProps {
	genres: Genre[];
}

export function GenreList({ genres }: GenreListProps) {
	const { colors } = useTheme();
	const playSong = usePlayerStore((s) => s.playSong);

	if (genres.length === 0) {
		return (
			<EmptyState
				icon="albums-outline"
				title="Keine Genres"
				message="Genre-Tags werden beim Import aus den Metadaten gelesen."
			/>
		);
	}

	const handlePress = async (genre: Genre) => {
		const songs = await getSongsByGenre(genre.name);
		if (songs.length > 0) {
			playSong(songs[0], songs, 0);
		}
	};

	return (
		<FlatList
			data={genres}
			keyExtractor={(item) => item.name}
			contentContainerStyle={{ paddingBottom: 100 }}
			renderItem={({ item }) => (
				<ListItem
					title={item.name}
					subtitle={`${item.songCount} Songs`}
					left={
						<View
							style={{
								width: 44,
								height: 44,
								borderRadius: 8,
								backgroundColor: colors.primary + '20',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Ionicons name="musical-notes" size={22} color={colors.primary} />
						</View>
					}
					onPress={() => handlePress(item)}
				/>
			)}
		/>
	);
}
