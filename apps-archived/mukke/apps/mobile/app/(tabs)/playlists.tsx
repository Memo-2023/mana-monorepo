import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, View, Text } from 'react-native';

import { EmptyState } from '~/components/EmptyState';
import { ListItem } from '~/components/ListItem';
import { usePlaylistStore } from '~/stores/playlistStore';
import { useTheme } from '~/utils/themeContext';

export default function PlaylistsScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { playlists, loadPlaylists } = usePlaylistStore();

	useEffect(() => {
		loadPlaylists();
	}, []);

	return (
		<View style={{ flex: 1 }}>
			<Stack.Screen
				options={{
					title: 'Playlists',
					headerRight: () => (
						<Pressable onPress={() => router.push('/playlist/new')} style={{ padding: 8 }}>
							<Ionicons name="add" size={28} color={colors.primary} />
						</Pressable>
					),
				}}
			/>

			{playlists.length === 0 ? (
				<EmptyState
					icon="list-outline"
					title="Keine Playlists"
					message="Erstelle eine Playlist über den + Button."
				/>
			) : (
				<FlatList
					data={playlists}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 100 }}
					renderItem={({ item }) => (
						<ListItem
							title={item.name}
							subtitle={item.description || undefined}
							left={
								<View
									style={{
										width: 48,
										height: 48,
										borderRadius: 8,
										backgroundColor: colors.primary + '20',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Ionicons name="musical-notes" size={24} color={colors.primary} />
								</View>
							}
							onPress={() => router.push(`/playlist/${item.id}`)}
							showChevron
						/>
					)}
				/>
			)}
		</View>
	);
}
