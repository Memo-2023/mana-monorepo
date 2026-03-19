import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, Text, View, useWindowDimensions } from 'react-native';

import type { Album } from '~/types';
import { useTheme } from '~/utils/themeContext';

import { EmptyState } from './EmptyState';

interface AlbumGridProps {
	albums: Album[];
}

export function AlbumGrid({ albums }: AlbumGridProps) {
	const router = useRouter();
	const { colors } = useTheme();
	const { width } = useWindowDimensions();
	const itemSize = (width - 48) / 2;

	if (albums.length === 0) {
		return (
			<EmptyState
				icon="disc-outline"
				title="Keine Alben"
				message="Importierte Songs werden nach Alben gruppiert."
			/>
		);
	}

	return (
		<FlatList
			data={albums}
			keyExtractor={(item) => item.name}
			numColumns={2}
			contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
			columnWrapperStyle={{ gap: 12 }}
			ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
			renderItem={({ item }) => (
				<Pressable
					onPress={() => router.push(`/album/${encodeURIComponent(item.name)}`)}
					style={{ width: itemSize }}
				>
					{item.coverArtPath ? (
						<Image
							source={{ uri: item.coverArtPath }}
							style={{ width: itemSize, height: itemSize, borderRadius: 8 }}
						/>
					) : (
						<View
							style={{
								width: itemSize,
								height: itemSize,
								borderRadius: 8,
								backgroundColor: colors.backgroundTertiary,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Ionicons name="disc-outline" size={48} color={colors.textTertiary} />
						</View>
					)}
					<Text
						style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 6 }}
						numberOfLines={1}
					>
						{item.name}
					</Text>
					<Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
						{item.artist || 'Unbekannt'} · {item.songCount} Songs
					</Text>
				</Pressable>
			)}
		/>
	);
}
