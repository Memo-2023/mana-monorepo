import { useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
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
	const soundRef = useRef<Audio.Sound | null>(null);
	const [playing, setPlaying] = useState(false);
	const [loading, setLoading] = useState(false);
	const [position, setPosition] = useState(0);
	const [totalDuration, setTotalDuration] = useState(duration ?? 0);

	const progress = totalDuration > 0 ? position / totalDuration : 0;

	const handleToggle = async () => {
		if (loading) return;

		if (playing) {
			await soundRef.current?.pauseAsync();
			setPlaying(false);
			return;
		}

		if (soundRef.current) {
			await soundRef.current.playAsync();
			setPlaying(true);
			return;
		}

		setLoading(true);
		try {
			await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
			const { sound } = await Audio.Sound.createAsync(
				{ uri },
				{ shouldPlay: true },
				(status) => {
					if (!status.isLoaded) return;
					setPosition(status.positionMillis);
					if (status.durationMillis) setTotalDuration(status.durationMillis);
					if (status.didJustFinish) {
						setPlaying(false);
						setPosition(0);
					}
				},
			);
			soundRef.current = sound;
			setPlaying(true);
		} finally {
			setLoading(false);
		}
	};

	const iconColor = isOwn ? '#fff' : '#7c6bff';
	const barColor = isOwn ? 'rgba(255,255,255,0.5)' : '#2a2a2a';
	const fillColor = isOwn ? '#fff' : '#7c6bff';

	return (
		<View className="flex-row items-center gap-3 px-3 py-2.5 min-w-[160px]">
			<Pressable
				onPress={handleToggle}
				className={({ pressed }) => `w-8 h-8 rounded-full items-center justify-center ${pressed ? 'opacity-60' : ''} ${isOwn ? 'bg-white/20' : 'bg-primary/10'}`}
			>
				{loading ? (
					<ActivityIndicator size={14} color={iconColor} />
				) : playing ? (
					<Pause size={14} color={iconColor} weight="fill" />
				) : (
					<Play size={14} color={iconColor} weight="fill" />
				)}
			</Pressable>

			{/* Waveform / progress bar */}
			<View className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: barColor }}>
				<View style={{ width: `${progress * 100}%`, backgroundColor: fillColor }} className="h-full rounded-full" />
			</View>

			<Text className={`text-xs tabular-nums ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
				{formatDuration(playing || position > 0 ? position : totalDuration)}
			</Text>
		</View>
	);
}
