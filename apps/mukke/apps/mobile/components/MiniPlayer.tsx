import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View, Text } from 'react-native';

import { useTheme } from '~/utils/themeContext';
import { useAudio } from '~/contexts/AudioContext';
import { usePlayerStore } from '~/stores/playerStore';

import { Artwork } from './Artwork';

export function MiniPlayer() {
	const { colors } = useTheme();
	const router = useRouter();
	const { play, pause, playNext } = useAudio();
	const currentSong = usePlayerStore((s) => s.currentSong);
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const position = usePlayerStore((s) => s.position);
	const duration = usePlayerStore((s) => s.duration);

	if (!currentSong) return null;

	const progress = duration > 0 ? position / duration : 0;

	return (
		<Pressable
			onPress={() => router.push('/player')}
			style={{
				position: 'absolute',
				bottom: 49,
				left: 0,
				right: 0,
				backgroundColor: colors.card,
				borderTopWidth: 0.5,
				borderTopColor: colors.border,
			}}
		>
			{/* Progress indicator */}
			<View style={{ height: 2, backgroundColor: colors.backgroundTertiary }}>
				<View
					style={{
						height: 2,
						backgroundColor: colors.primary,
						width: `${progress * 100}%`,
					}}
				/>
			</View>

			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					paddingHorizontal: 12,
					paddingVertical: 8,
				}}
			>
				<Artwork uri={currentSong.coverArtPath} size={40} />

				<View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
					<Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }} numberOfLines={1}>
						{currentSong.title}
					</Text>
					<Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
						{currentSong.artist || 'Unbekannt'}
					</Text>
				</View>

				<Pressable onPress={isPlaying ? pause : play} style={{ padding: 8 }}>
					<Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.text} />
				</Pressable>

				<Pressable onPress={playNext} style={{ padding: 8 }}>
					<Ionicons name="play-skip-forward" size={20} color={colors.text} />
				</Pressable>
			</View>
		</Pressable>
	);
}
