import { FlatList } from 'react-native';

import type { Song } from '~/types';
import { formatDuration } from '~/services/audioService';
import { usePlayerStore } from '~/stores/playerStore';

import { Artwork } from './Artwork';
import { EmptyState } from './EmptyState';
import { ListItem } from './ListItem';

interface SongListProps {
	songs: Song[];
	onSongPress?: (song: Song, index: number) => void;
	emptyTitle?: string;
	emptyMessage?: string;
}

export function SongList({
	songs,
	onSongPress,
	emptyTitle = 'Keine Songs',
	emptyMessage = 'Importiere Songs über den + Button.',
}: SongListProps) {
	const playSong = usePlayerStore((s) => s.playSong);

	const handlePress = (song: Song, index: number) => {
		if (onSongPress) {
			onSongPress(song, index);
		} else {
			playSong(song, songs, index);
		}
	};

	if (songs.length === 0) {
		return <EmptyState title={emptyTitle} message={emptyMessage} />;
	}

	return (
		<FlatList
			data={songs}
			keyExtractor={(item) => item.id}
			renderItem={({ item, index }) => (
				<ListItem
					title={item.title}
					subtitle={[item.artist, item.album].filter(Boolean).join(' · ')}
					trailing={formatDuration(item.duration)}
					left={<Artwork uri={item.coverArtPath} size={44} />}
					onPress={() => handlePress(item, index)}
				/>
			)}
			contentContainerStyle={{ paddingBottom: 100 }}
		/>
	);
}
