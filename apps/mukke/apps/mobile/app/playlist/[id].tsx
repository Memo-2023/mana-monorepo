import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';

import { EmptyState } from '~/components/EmptyState';
import { SongList } from '~/components/SongList';
import { SongPicker } from '~/components/SongPicker';
import {
	getPlaylistById,
	getPlaylistSongs,
	addSongToPlaylist,
	removeSongFromPlaylist,
} from '~/services/playlistService';
import { usePlayerStore } from '~/stores/playerStore';
import type { Playlist, Song } from '~/types';
import { useTheme } from '~/utils/themeContext';

export default function PlaylistDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { colors } = useTheme();
	const playSong = usePlayerStore((s) => s.playSong);
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [songs, setSongs] = useState<Song[]>([]);
	const [showPicker, setShowPicker] = useState(false);

	const loadData = async () => {
		if (!id) return;
		const [p, s] = await Promise.all([getPlaylistById(id), getPlaylistSongs(id)]);
		setPlaylist(p);
		setSongs(s);
	};

	useEffect(() => {
		loadData();
	}, [id]);

	const handleAddSongs = async (selected: Song[]) => {
		if (!id) return;
		for (const song of selected) {
			await addSongToPlaylist(id, song.id);
		}
		await loadData();
	};

	const handleLongPress = (song: Song) => {
		Alert.alert('Song entfernen', `"${song.title}" aus der Playlist entfernen?`, [
			{ text: 'Abbrechen', style: 'cancel' },
			{
				text: 'Entfernen',
				style: 'destructive',
				onPress: async () => {
					if (id) {
						await removeSongFromPlaylist(id, song.id);
						await loadData();
					}
				},
			},
		]);
	};

	return (
		<View style={{ flex: 1 }}>
			<Stack.Screen
				options={{
					title: playlist?.name || 'Playlist',
					headerRight: () => (
						<Pressable onPress={() => setShowPicker(true)} style={{ padding: 8 }}>
							<Ionicons name="add" size={28} color={colors.primary} />
						</Pressable>
					),
				}}
			/>

			{playlist && (
				<View style={{ padding: 16, alignItems: 'center' }}>
					<View
						style={{
							width: 120,
							height: 120,
							borderRadius: 12,
							backgroundColor: colors.primary + '20',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Ionicons name="musical-notes" size={48} color={colors.primary} />
					</View>
					<Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12 }}>
						{playlist.name}
					</Text>
					{playlist.description && (
						<Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
							{playlist.description}
						</Text>
					)}
					<Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4 }}>
						{songs.length} Songs
					</Text>
				</View>
			)}

			<SongList
				songs={songs}
				onSongPress={(song, index) => playSong(song, songs, index)}
				emptyTitle="Playlist ist leer"
				emptyMessage="Füge Songs über den + Button hinzu."
			/>

			<SongPicker
				visible={showPicker}
				onClose={() => setShowPicker(false)}
				onSelect={handleAddSongs}
				excludeIds={songs.map((s) => s.id)}
			/>
		</View>
	);
}
