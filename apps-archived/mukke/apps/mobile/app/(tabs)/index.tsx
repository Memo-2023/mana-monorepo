import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AlbumGrid } from '~/components/AlbumGrid';
import { ArtistList } from '~/components/ArtistList';
import { GenreList } from '~/components/GenreList';
import { ImportButton } from '~/components/ImportButton';
import { SegmentedControl } from '~/components/SegmentedControl';
import { SongList } from '~/components/SongList';
import { SortMenu } from '~/components/SortMenu';
import { useLibraryStore } from '~/stores/libraryStore';
import type { LibraryTab } from '~/types';

const SEGMENTS: { key: LibraryTab; label: string }[] = [
	{ key: 'songs', label: 'Songs' },
	{ key: 'albums', label: 'Alben' },
	{ key: 'artists', label: 'Künstler' },
	{ key: 'genres', label: 'Genres' },
];

export default function LibraryScreen() {
	const {
		songs,
		albums,
		artists,
		genres,
		activeTab,
		sortField,
		sortDirection,
		setActiveTab,
		setSortField,
		setSortDirection,
		loadAll,
	} = useLibraryStore();

	useEffect(() => {
		loadAll();
	}, []);

	return (
		<View style={{ flex: 1 }}>
			<Stack.Screen
				options={{
					title: 'Bibliothek',
					headerRight: () => (
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							{activeTab === 'songs' && (
								<SortMenu
									currentField={sortField}
									currentDirection={sortDirection}
									onSort={(field, dir) => {
										setSortField(field);
										setSortDirection(dir);
									}}
								/>
							)}
							<ImportButton />
						</View>
					),
				}}
			/>

			<SegmentedControl segments={SEGMENTS} selected={activeTab} onSelect={setActiveTab} />

			{activeTab === 'songs' && <SongList songs={songs} />}
			{activeTab === 'albums' && <AlbumGrid albums={albums} />}
			{activeTab === 'artists' && <ArtistList artists={artists} />}
			{activeTab === 'genres' && <GenreList genres={genres} />}
		</View>
	);
}
