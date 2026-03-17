import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Alert } from 'react-native';
import {
	useAudioRecorder,
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
} from 'expo-audio';
import { Trash, PaperPlaneRight } from 'phosphor-react-native';

interface Props {
	onSend: (uri: string, durationMs: number) => Promise<void>;
	onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: Props) {
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const [duration, setDuration] = useState(0);
	const [sending, setSending] = useState(false);
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		startRecording();
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
				Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
			])
		);
		pulse.start();
		return () => {
			pulse.stop();
			stopRecordingCleanup();
		};
	}, []);

	const startRecording = async () => {
		try {
			const { granted } = await requestRecordingPermissionsAsync();
			if (!granted) {
				Alert.alert('Permission required', 'Microphone access is needed to record voice messages.');
				onCancel();
				return;
			}
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
			await recorder.prepareToRecordAsync();
			recorder.record();
			timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
		} catch (err) {
			Alert.alert('Error', 'Could not start recording');
			onCancel();
		}
	};

	const stopRecordingCleanup = async () => {
		if (timerRef.current) clearInterval(timerRef.current);
		try {
			await recorder.stop();
		} catch {
			/* ignore */
		}
	};

	const handleSend = async () => {
		if (sending) return;
		setSending(true);
		if (timerRef.current) clearInterval(timerRef.current);
		try {
			await recorder.stop();
			const uri = recorder.uri;
			if (!uri) throw new Error('No recording URI');
			await onSend(uri, duration * 1000);
		} catch (err) {
			Alert.alert('Error', err instanceof Error ? err.message : 'Send failed');
		} finally {
			setSending(false);
		}
	};

	const handleDiscard = async () => {
		await stopRecordingCleanup();
		onCancel();
	};

	const formatDuration = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	};

	return (
		<View className="flex-row items-center gap-4 px-4 py-3 bg-background border-t border-border">
			{/* Discard */}
			<Pressable
				onPress={handleDiscard}
				className="w-10 h-10 rounded-full bg-destructive/10 items-center justify-center active:opacity-60"
			>
				<Trash size={18} color="#ef4444" />
			</Pressable>

			{/* Recording indicator */}
			<View className="flex-1 flex-row items-center gap-3">
				<Animated.View
					style={{ transform: [{ scale: pulseAnim }] }}
					className="w-3 h-3 rounded-full bg-destructive"
				/>
				<Text className="text-foreground font-mono text-sm">{formatDuration(duration)}</Text>
				<Text className="text-muted-foreground text-xs">Recording...</Text>
			</View>

			{/* Send */}
			<Pressable
				onPress={handleSend}
				disabled={sending || duration < 1}
				className={`w-10 h-10 rounded-full items-center justify-center ${duration >= 1 ? 'bg-primary' : 'bg-surface border border-border'} active:opacity-60`}
			>
				<PaperPlaneRight size={18} color={duration >= 1 ? '#fff' : '#6b7280'} weight="fill" />
			</Pressable>
		</View>
	);
}
