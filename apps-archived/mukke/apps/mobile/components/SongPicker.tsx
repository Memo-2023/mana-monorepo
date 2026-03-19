import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { FlatList, Pressable, View, Text, Modal } from 'react-native';

import type { Song } from '~/types';
import { useTheme } from '~/utils/themeContext';
import { getAllSongs } from '~/services/libraryService';

import { Artwork } from './Artwork';

interface SongPickerProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (songs: Song[]) => void;
	excludeIds?: string[];
}

export function SongPicker({ visible, onClose, onSelect, excludeIds = [] }: SongPickerProps) {
	const { colors } = useTheme();
	const [songs, setSongs] = useState<Song[]>([]);
	const [selected, setSelected] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (visible) {
			getAllSongs().then((all) => {
				setSongs(all.filter((s) => !excludeIds.includes(s.id)));
			});
			setSelected(new Set());
		}
	}, [visible]);

	const toggleSelection = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleDone = () => {
		const selectedSongs = songs.filter((s) => selected.has(s.id));
		onSelect(selectedSongs);
		onClose();
	};

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: 16,
						borderBottomWidth: 0.5,
						borderBottomColor: colors.border,
					}}
				>
					<Pressable onPress={onClose}>
						<Text style={{ fontSize: 16, color: colors.primary }}>Abbrechen</Text>
					</Pressable>
					<Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
						Songs auswählen
					</Text>
					<Pressable onPress={handleDone}>
						<Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
							Fertig ({selected.size})
						</Text>
					</Pressable>
				</View>

				<FlatList
					data={songs}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => {
						const isSelected = selected.has(item.id);
						return (
							<Pressable
								onPress={() => toggleSelection(item.id)}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									paddingVertical: 10,
									paddingHorizontal: 16,
								}}
							>
								<Ionicons
									name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
									size={24}
									color={isSelected ? colors.primary : colors.textTertiary}
									style={{ marginRight: 12 }}
								/>
								<Artwork uri={item.coverArtPath} size={40} />
								<View style={{ flex: 1, marginLeft: 10 }}>
									<Text style={{ fontSize: 15, color: colors.text }} numberOfLines={1}>
										{item.title}
									</Text>
									<Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>
										{item.artist || 'Unbekannt'}
									</Text>
								</View>
							</Pressable>
						);
					}}
				/>
			</View>
		</Modal>
	);
}
