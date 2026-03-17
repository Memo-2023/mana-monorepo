import { Ionicons } from '@expo/vector-icons';
import { View, Pressable } from 'react-native';

import { useTheme } from '~/utils/themeContext';
import { useAudio } from '~/contexts/AudioContext';
import { usePlayerStore } from '~/stores/playerStore';
import type { RepeatMode, ShuffleMode } from '~/types';

interface TransportControlsProps {
	size?: 'small' | 'large';
}

function getRepeatIcon(mode: RepeatMode): keyof typeof Ionicons.glyphMap {
	if (mode === 'one') return 'repeat';
	return 'repeat';
}

export function TransportControls({ size = 'large' }: TransportControlsProps) {
	const { colors } = useTheme();
	const { play, pause, playNext, playPrevious } = useAudio();
	const isPlaying = usePlayerStore((s) => s.isPlaying);
	const repeatMode = usePlayerStore((s) => s.repeatMode);
	const shuffleMode = usePlayerStore((s) => s.shuffleMode);
	const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

	const iconSize = size === 'large' ? 36 : 24;
	const playSize = size === 'large' ? 56 : 32;

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				gap: size === 'large' ? 32 : 20,
			}}
		>
			{size === 'large' && (
				<Pressable onPress={toggleShuffle}>
					<Ionicons
						name="shuffle"
						size={24}
						color={shuffleMode === 'on' ? colors.primary : colors.textSecondary}
					/>
				</Pressable>
			)}

			<Pressable onPress={playPrevious}>
				<Ionicons name="play-skip-back" size={iconSize} color={colors.text} />
			</Pressable>

			<Pressable
				onPress={isPlaying ? pause : play}
				style={{
					width: playSize,
					height: playSize,
					borderRadius: playSize / 2,
					backgroundColor: colors.primary,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Ionicons
					name={isPlaying ? 'pause' : 'play'}
					size={playSize * 0.5}
					color="#FFFFFF"
					style={{ marginLeft: isPlaying ? 0 : 2 }}
				/>
			</Pressable>

			<Pressable onPress={playNext}>
				<Ionicons name="play-skip-forward" size={iconSize} color={colors.text} />
			</Pressable>

			{size === 'large' && (
				<Pressable onPress={toggleRepeat}>
					<Ionicons
						name={getRepeatIcon(repeatMode)}
						size={24}
						color={repeatMode !== 'off' ? colors.primary : colors.textSecondary}
					/>
					{repeatMode === 'one' && (
						<View
							style={{
								position: 'absolute',
								top: -4,
								right: -6,
								backgroundColor: colors.primary,
								borderRadius: 6,
								width: 12,
								height: 12,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Ionicons name="remove" size={8} color="#FFFFFF" />
						</View>
					)}
				</Pressable>
			)}
		</View>
	);
}
