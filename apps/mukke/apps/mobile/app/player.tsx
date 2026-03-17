import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Artwork } from '~/components/Artwork';
import { ProgressBar } from '~/components/ProgressBar';
import { TransportControls } from '~/components/TransportControls';
import { useAudio } from '~/contexts/AudioContext';
import { usePlayerStore } from '~/stores/playerStore';
import { useLibraryStore } from '~/stores/libraryStore';
import { useTheme } from '~/utils/themeContext';

export default function PlayerScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { seekTo } = useAudio();
	const currentSong = usePlayerStore((s) => s.currentSong);
	const position = usePlayerStore((s) => s.position);
	const duration = usePlayerStore((s) => s.duration);
	const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

	if (!currentSong) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<Text style={{ color: colors.textSecondary }}>Kein Song wird abgespielt</Text>
			</View>
		);
	}

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: colors.background,
				paddingTop: insets.top + 8,
				paddingBottom: insets.bottom + 16,
			}}
		>
			{/* Header */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					paddingHorizontal: 20,
					marginBottom: 24,
				}}
			>
				<Pressable onPress={() => router.back()} style={{ padding: 4 }}>
					<Ionicons name="chevron-down" size={28} color={colors.text} />
				</Pressable>
				<Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
					WIRD ABGESPIELT
				</Text>
				<Pressable onPress={() => router.push('/queue')} style={{ padding: 4 }}>
					<Ionicons name="list" size={24} color={colors.text} />
				</Pressable>
			</View>

			{/* Artwork */}
			<View
				style={{ alignItems: 'center', paddingHorizontal: 40, flex: 1, justifyContent: 'center' }}
			>
				<Artwork uri={currentSong.coverArtPath} size={300} />
			</View>

			{/* Song Info */}
			<View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<View style={{ flex: 1, minWidth: 0 }}>
						<Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }} numberOfLines={1}>
							{currentSong.title}
						</Text>
						<Text
							style={{ fontSize: 16, color: colors.textSecondary, marginTop: 4 }}
							numberOfLines={1}
						>
							{currentSong.artist || 'Unbekannt'}
						</Text>
					</View>
					<Pressable onPress={() => toggleFavorite(currentSong.id)} style={{ padding: 8 }}>
						<Ionicons
							name={currentSong.favorite ? 'heart' : 'heart-outline'}
							size={24}
							color={currentSong.favorite ? colors.primary : colors.textSecondary}
						/>
					</Pressable>
				</View>
			</View>

			{/* Progress */}
			<ProgressBar position={position} duration={duration} onSeek={seekTo} />

			{/* Transport */}
			<View style={{ paddingVertical: 24 }}>
				<TransportControls size="large" />
			</View>
		</View>
	);
}
