import { setAudioModeAsync } from 'expo-audio';

export { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export async function configureAudioMode(): Promise<void> {
	await setAudioModeAsync({
		playsInSilentMode: true,
		shouldPlayInBackground: true,
	});
}

export function formatDuration(seconds: number | null | undefined): string {
	if (!seconds || seconds <= 0) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}
