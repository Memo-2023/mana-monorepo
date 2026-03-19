import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';

import type { Artist } from '~/types';

import { Artwork } from './Artwork';
import { EmptyState } from './EmptyState';
import { ListItem } from './ListItem';

interface ArtistListProps {
	artists: Artist[];
}

export function ArtistList({ artists }: ArtistListProps) {
	const router = useRouter();

	if (artists.length === 0) {
		return (
			<EmptyState
				icon="person-outline"
				title="Keine Künstler"
				message="Importierte Songs werden nach Künstlern gruppiert."
			/>
		);
	}

	return (
		<FlatList
			data={artists}
			keyExtractor={(item) => item.name}
			contentContainerStyle={{ paddingBottom: 100 }}
			renderItem={({ item }) => (
				<ListItem
					title={item.name}
					subtitle={`${item.songCount} Songs · ${item.albumCount} Alben`}
					left={<Artwork uri={null} size={44} rounded />}
					onPress={() => router.push(`/artist/${encodeURIComponent(item.name)}`)}
					showChevron
				/>
			)}
		/>
	);
}
