import Slider from '@react-native-community/slider';
import { View, Text } from 'react-native';

import { useTheme } from '~/utils/themeContext';
import { formatDuration } from '~/services/audioService';

interface ProgressBarProps {
	position: number;
	duration: number;
	onSeek: (position: number) => void;
}

export function ProgressBar({ position, duration, onSeek }: ProgressBarProps) {
	const { colors } = useTheme();

	return (
		<View style={{ width: '100%', paddingHorizontal: 20 }}>
			<Slider
				value={duration > 0 ? position / duration : 0}
				onSlidingComplete={(value) => onSeek(value * duration)}
				minimumValue={0}
				maximumValue={1}
				minimumTrackTintColor={colors.primary}
				maximumTrackTintColor={colors.backgroundTertiary}
				thumbTintColor={colors.primary}
			/>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 }}>
				<Text style={{ fontSize: 12, color: colors.textSecondary }}>
					{formatDuration(position)}
				</Text>
				<Text style={{ fontSize: 12, color: colors.textSecondary }}>
					-{formatDuration(Math.max(0, duration - position))}
				</Text>
			</View>
		</View>
	);
}
