import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';

import { usePlayerStore } from '~/stores/playerStore';
import { updatePlayStats, updateSongDuration } from '~/services/libraryService';

interface AudioContextType {
	play: () => void;
	pause: () => void;
	seekTo: (position: number) => void;
	playNext: () => void;
	playPrevious: () => void;
}

const AudioCtx = createContext<AudioContextType>({
	play: () => {},
	pause: () => {},
	seekTo: () => {},
	playNext: () => {},
	playPrevious: () => {},
});

export const useAudio = () => useContext(AudioCtx);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const player = useAudioPlayer(null);
	const status = useAudioPlayerStatus(player);
	const { currentSong, isPlaying, setPlaying, setPosition, setDuration, nextSong, previousSong } =
		usePlayerStore();
	const hasCountedPlay = useRef(false);
	const lastSongId = useRef<string | null>(null);

	// Configure audio mode for background playback
	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: true,
		});
	}, []);

	// Load song when currentSong changes
	useEffect(() => {
		if (!currentSong) return;
		if (lastSongId.current === currentSong.id) return;
		lastSongId.current = currentSong.id;
		hasCountedPlay.current = false;

		player.replace({ uri: currentSong.filePath });

		// Set lock screen metadata
		player.setActiveForLockScreen(true, {
			title: currentSong.title,
			artist: currentSong.artist || undefined,
			albumTitle: currentSong.album || undefined,
			artworkSource: currentSong.coverArtPath ? { uri: currentSong.coverArtPath } : undefined,
		});

		player.play();
	}, [currentSong?.id]);

	// Sync play/pause state
	useEffect(() => {
		if (!currentSong) return;
		if (isPlaying && !status.playing) {
			player.play();
		} else if (!isPlaying && status.playing) {
			player.pause();
		}
	}, [isPlaying]);

	// Update position and duration from player status
	useEffect(() => {
		if (status.currentTime !== undefined) {
			setPosition(status.currentTime);
		}
		if (status.duration && status.duration > 0) {
			setDuration(status.duration);
			// Save duration to DB if not yet stored
			if (currentSong && !currentSong.duration) {
				updateSongDuration(currentSong.id, status.duration);
			}
		}
	}, [status.currentTime, status.duration]);

	// Count play after 10 seconds
	useEffect(() => {
		if (currentSong && status.currentTime > 10 && !hasCountedPlay.current) {
			hasCountedPlay.current = true;
			updatePlayStats(currentSong.id);
		}
	}, [status.currentTime]);

	// Auto-advance when track ends
	useEffect(() => {
		if (status.didJustFinish) {
			const next = nextSong();
			if (!next) {
				setPlaying(false);
			}
		}
	}, [status.didJustFinish]);

	const play = useCallback(() => {
		player.play();
		setPlaying(true);
	}, [player]);

	const pause = useCallback(() => {
		player.pause();
		setPlaying(false);
	}, [player]);

	const seekTo = useCallback(
		(position: number) => {
			player.seekTo(position);
			setPosition(position);
		},
		[player]
	);

	const playNext = useCallback(() => {
		const song = nextSong();
		if (!song) setPlaying(false);
	}, []);

	const playPrevious = useCallback(() => {
		const song = previousSong();
		if (song && song.id === currentSong?.id) {
			// Restart current song
			player.seekTo(0);
			setPosition(0);
		}
	}, [currentSong?.id, player]);

	return (
		<AudioCtx.Provider value={{ play, pause, seekTo, playNext, playPrevious }}>
			{children}
		</AudioCtx.Provider>
	);
};
