import { useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Play, Pause } from 'phosphor-react-native';

interface Props {
	uri: string;
	duration?: number;
	isOwn: boolean;
}

function formatDuration(ms: number): string {
	const secs = Math.floor(ms / 1000);
	const m = Math.floor(secs / 60);
	const s = secs % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoiceMessage({ uri, duration, isOwn }: Props) {
	const player = useAudioPlayer(uri);
	const status = useAudioPlayerStatus(player);
	const [initialized, setInitialized] = useState(false);

	const currentTimeMs = (status.currentTime ?? 0) * 1000;
	const durationMs = (status.duration ?? 0) * 1000 || duration || 0;
	const playing = status.playing;
	const progress = durationMs > 0 ? currentTimeMs / durationMs : 0;

	const handleToggle = useCallback(async () => {
		if (!initialized) {
			await setAudioModeAsync({ playsInSilentMode: true });
			setInitialized(true);
		}

		if (playing) {
			player.pause();
		} else {
			player.play();
		}
	}, [player, playing, initialized]);

	const iconColor = isOwn ? '#fff' : '#7c6bff';
	const barColor = isOwn ? 'rgba(255,255,255,0.5)' : '#2a2a2a';
	const fillColor = isOwn ? '#fff' : '#7c6bff';

	return (
		<View className="flex-row items-center gap-3 px-3 py-2.5 min-w-[160px]">
			<Pressable
				onPress={handleToggle}
				className={`w-8 h-8 rounded-full items-center justify-center active:opacity-60 ${isOwn ? 'bg-white/20' : 'bg-primary/10'}`}
			>
				{status.isBuffering ? (
					<ActivityIndicator size={14} color={iconColor} />
				) : playing ? (
					<Pause size={14} color={iconColor} weight="fill" />
				) : (
					<Play size={14} color={iconColor} weight="fill" />
				)}
			</Pressable>

			{/* Waveform / progress bar */}
			<View
				className="flex-1 h-1 rounded-full overflow-hidden"
				style={{ backgroundColor: barColor }}
			>
				<View
					style={{ width: `${progress * 100}%`, backgroundColor: fillColor }}
					className="h-full rounded-full"
				/>
			</View>

			<Text className={`text-xs tabular-nums ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
				{formatDuration(playing || currentTimeMs > 0 ? currentTimeMs : durationMs)}
			</Text>
		</View>
	);
}
