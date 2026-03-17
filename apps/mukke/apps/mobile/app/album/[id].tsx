import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import { Artwork } from '~/components/Artwork';
import { SongList } from '~/components/SongList';
import { getSongsByAlbum } from '~/services/libraryService';
import { usePlayerStore } from '~/stores/playerStore';
import type { Song } from '~/types';
import { useTheme } from '~/utils/themeContext';

export default function AlbumDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const albumName = decodeURIComponent(id || '');
	const { colors } = useTheme();
	const playSong = usePlayerStore((s) => s.playSong);
	const [songs, setSongs] = useState<Song[]>([]);

	useEffect(() => {
		if (albumName) {
			getSongsByAlbum(albumName).then(setSongs);
		}
	}, [albumName]);

	const coverArt = songs.find((s) => s.coverArtPath)?.coverArtPath || null;
	const artist = songs[0]?.albumArtist || songs[0]?.artist || 'Unbekannt';
	const year = songs[0]?.year;

	return (
		<View style={{ flex: 1 }}>
			{/* Album Header */}
			<View style={{ alignItems: 'center', padding: 20, paddingBottom: 8 }}>
				<Artwork uri={coverArt} size={180} />
				<Text
					style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12 }}
					numberOfLines={2}
				>
					{albumName}
				</Text>
				<Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
					{artist}
					{year ? ` · ${year}` : ''} · {songs.length} Songs
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
