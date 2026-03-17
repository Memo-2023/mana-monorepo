import { Ionicons } from '@expo/vector-icons';
import { View, Text, FlatList } from 'react-native';

import { Artwork } from '~/components/Artwork';
import { ListItem } from '~/components/ListItem';
import { usePlayerStore } from '~/stores/playerStore';
import { formatDuration } from '~/services/audioService';
import { useTheme } from '~/utils/themeContext';

export default function QueueScreen() {
	const { colors } = useTheme();
	const queue = usePlayerStore((s) => s.getQueue());
	const currentSong = usePlayerStore((s) => s.currentSong);
	const playSong = usePlayerStore((s) => s.playSong);

	const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			{currentSong && (
				<View style={{ padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
					<Text
						style={{
							fontSize: 13,
							color: colors.textSecondary,
							fontWeight: '600',
							marginBottom: 8,
						}}
					>
						AKTUELLER SONG
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Artwork uri={currentSong.coverArtPath} size={48} />
						<View style={{ flex: 1, marginLeft: 12 }}>
							<Text
								style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}
								numberOfLines={1}
							>
								{currentSong.title}
							</Text>
							<Text style={{ fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
								{currentSong.artist || 'Unbekannt'}
							</Text>
						</View>
					</View>
				</View>
			)}

			<Text
				style={{
					fontSize: 13,
					color: colors.textSecondary,
					fontWeight: '600',
					padding: 16,
					paddingBottom: 8,
				}}
			>
				ALS NÄCHSTES
			</Text>

			<FlatList
				data={queue.slice(currentIndex + 1)}
				keyExtractor={(item, index) => `${item.id}-${index}`}
				contentContainerStyle={{ paddingBottom: 40 }}
				renderItem={({ item, index }) => (
					<ListItem
						title={item.title}
						subtitle={item.artist || 'Unbekannt'}
						trailing={formatDuration(item.duration)}
						left={<Artwork uri={item.coverArtPath} size={40} />}
						onPress={() => playSong(item, queue, currentIndex + 1 + index)}
					/>
				)}
			/>
		</View>
	);
}
