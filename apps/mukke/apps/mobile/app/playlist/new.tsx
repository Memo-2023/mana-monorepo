import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

import { usePlaylistStore } from '~/stores/playlistStore';
import { useTheme } from '~/utils/themeContext';

export default function NewPlaylistScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	const handleCreate = async () => {
		if (!name.trim()) return;
		const playlist = await createPlaylist(name.trim(), description.trim() || undefined);
		router.dismiss();
		router.push(`/playlist/${playlist.id}`);
	};

	return (
		<View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
			<Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 8 }}>Name</Text>
			<TextInput
				value={name}
				onChangeText={setName}
				placeholder="Playlist Name"
				placeholderTextColor={colors.textTertiary}
				style={{
					backgroundColor: colors.card,
					borderRadius: 10,
					padding: 14,
					fontSize: 16,
					color: colors.text,
					marginBottom: 20,
				}}
				autoFocus
			/>

			<Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 8 }}>
				Beschreibung (optional)
			</Text>
			<TextInput
				value={description}
				onChangeText={setDescription}
				placeholder="Beschreibung..."
				placeholderTextColor={colors.textTertiary}
				style={{
					backgroundColor: colors.card,
					borderRadius: 10,
					padding: 14,
					fontSize: 16,
					color: colors.text,
					marginBottom: 32,
					minHeight: 80,
				}}
				multiline
				textAlignVertical="top"
			/>

			<Pressable
				onPress={handleCreate}
				disabled={!name.trim()}
				style={{
					backgroundColor: name.trim() ? colors.primary : colors.backgroundTertiary,
					borderRadius: 12,
					paddingVertical: 14,
					alignItems: 'center',
				}}
			>
				<Text
					style={{
						fontSize: 17,
						fontWeight: '600',
						color: name.trim() ? '#FFFFFF' : colors.textTertiary,
					}}
				>
					Erstellen
				</Text>
			</Pressable>
		</View>
	);
}
