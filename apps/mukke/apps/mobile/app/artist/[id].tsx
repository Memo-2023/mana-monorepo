import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import { Artwork } from '~/components/Artwork';
import { SongList } from '~/components/SongList';
import { getSongsByArtist } from '~/services/libraryService';
import { usePlayerStore } from '~/stores/playerStore';
import type { Song } from '~/types';
import { useTheme } from '~/utils/themeContext';

export default function ArtistDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const artistName = decodeURIComponent(id || '');
	const { colors } = useTheme();
	const playSong = usePlayerStore((s) => s.playSong);
	const [songs, setSongs] = useState<Song[]>([]);

	useEffect(() => {
		if (artistName) {
			getSongsByArtist(artistName).then(setSongs);
		}
	}, [artistName]);

	const albumCount = new Set(songs.map((s) => s.album).filter(Boolean)).size;

	return (
		<View style={{ flex: 1 }}>
			{/* Artist Header */}
			<View style={{ alignItems: 'center', padding: 20, paddingBottom: 8 }}>
				<Artwork uri={null} size={120} rounded />
				<Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 }}>
					{artistName}
				</Text>
				<Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
					{songs.length} Songs · {albumCount} Alben
				</Text>
			</View>

			<SongList
				songs={songs}
				onSongPress={(song, index) => playSong(song, songs, index)}
				emptyTitle="Keine Songs"
			/>
		</View>
	);
}
