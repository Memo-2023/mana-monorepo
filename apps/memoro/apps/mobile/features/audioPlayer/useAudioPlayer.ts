import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useRecordingStore, RecordingStatus } from '~/features/audioRecordingV2';
import { NotificationChannel } from '~/features/notifications/types';
import NotificationService from '~/features/notifications/NotificationService.native';
import { formatDurationWithUnits, formatDurationFromMs } from '~/utils/formatters';
import useTimer from '~/hooks/useTimer';
import { AudioPlayerStatus } from './audioPlayer.types';
import { useAudioPlaybackStore } from './store/audioPlaybackStore';

/**
 * Formatiert eine Zeitangabe in Sekunden als MM:SS
 */
export const formatDuration = (seconds: number): string => {
	return formatDurationWithUnits(seconds);
};

/**
 * Lock screen metadata for displaying now-playing info on iOS Control Center / Android lock screen.
 */
export interface LockScreenMetadata {
	title?: string;
	artist?: string;
	albumTitle?: string;
	artworkUrl?: string;
}

/**
 * Hook zur Verwaltung eines Audio-Players
 */
export const useAudioPlayer = () => {
	const [player, setPlayer] = useState<AudioPlayer | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [loadError, setLoadError] = useState(false);
	const [status, setStatus] = useState<AudioPlayerStatus>(AudioPlayerStatus.IDLE);
	const [error, setError] = useState<string | null>(null);
	const [isBuffering, setIsBuffering] = useState(false);
	const audioIdRef = useRef<string | null>(null);
	const lockScreenMetadataRef = useRef<LockScreenMetadata | null>(null);
	const lockScreenActiveRef = useRef(false);
	const { registerAudio, unregisterAudio, pauseAllExcept } = useAudioPlaybackStore();

	// Verwende die zentralen Timer-Hooks mit externen Zeitaktualisierungen
	const positionTimer = useTimer(0, { useExternalTimeUpdates: true });
	const durationTimer = useTimer(0, { useExternalTimeUpdates: true });

	const isWebEnvironment = Platform.OS === 'web';

	/**
	 * Activate lock screen controls on the given player instance.
	 * Called internally when playback starts.
	 */
	const activateLockScreen = useCallback(
		(p: AudioPlayer) => {
			if (isWebEnvironment || !lockScreenMetadataRef.current) return;
			try {
				p.setActiveForLockScreen(true, lockScreenMetadataRef.current, {
					showSeekForward: true,
					showSeekBackward: true,
				});
				lockScreenActiveRef.current = true;
				console.log('[useAudioPlayer] Lock screen controls activated');
			} catch (e) {
				console.warn('[useAudioPlayer] Failed to activate lock screen controls:', e);
			}
		},
		[isWebEnvironment]
	);

	/**
	 * Clear lock screen controls.
	 */
	const deactivateLockScreen = useCallback(
		(p: AudioPlayer | null) => {
			if (isWebEnvironment || !lockScreenActiveRef.current || !p) return;
			try {
				p.clearLockScreenControls();
				lockScreenActiveRef.current = false;
				console.log('[useAudioPlayer] Lock screen controls cleared');
			} catch (e) {
				console.warn('[useAudioPlayer] Failed to clear lock screen controls:', e);
			}
		},
		[isWebEnvironment]
	);

	/**
	 * Set metadata for lock screen / Control Center display.
	 * Call this before or after loadSound — controls activate on play.
	 */
	const setLockScreenInfo = useCallback(
		(metadata: LockScreenMetadata) => {
			lockScreenMetadataRef.current = metadata;
			// Update live if already active
			if (lockScreenActiveRef.current && player && !isWebEnvironment) {
				try {
					player.updateLockScreenMetadata(metadata);
				} catch (e) {
					console.warn('[useAudioPlayer] Failed to update lock screen metadata:', e);
				}
			}
		},
		[player, isWebEnvironment]
	);

	const loadSound = useCallback(
		async (uri: string | undefined) => {
			try {
				setStatus(AudioPlayerStatus.LOADING);

				if (player) {
					// Clear any existing intervals
					if ((player as any)._intervalId) {
						clearInterval((player as any)._intervalId);
					}
					if ((player as any)._checkDurationId) {
						clearInterval((player as any)._checkDurationId);
					}
					await player.pause();
					player.release();
				}

				if (!uri) {
					setLoadError(true);
					setStatus(AudioPlayerStatus.ERROR);
					setError('Keine URI angegeben');
					return;
				}

				setLoadError(false);

				// Check if recording is active - if so, skip loading audio entirely to avoid disrupting the recording
				const recordingStatus = useRecordingStore.getState().status;
				const isRecordingActive =
					recordingStatus === RecordingStatus.RECORDING ||
					recordingStatus === RecordingStatus.PAUSED ||
					recordingStatus === RecordingStatus.PREPARING;

				if (isRecordingActive) {
					console.log('[useAudioPlayer] Skipping audio load - recording is active');
					setStatus(AudioPlayerStatus.IDLE);
					// Don't set loadError - this is intentional, not an error
					return;
				}

				await setAudioModeAsync({
					shouldPlayInBackground: true,
					playsInSilentMode: true,
					interruptionMode: 'mixWithOthers',
				});

				const newPlayer = createAudioPlayer(uri);

				// Wait a moment for the player to load
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Check if player loaded successfully
				if (newPlayer.duration === 0 && !newPlayer.playing) {
					// Try waiting a bit more
					await new Promise((resolve) => setTimeout(resolve, 200));
				}

				setPlayer(newPlayer);
				if (newPlayer.duration !== undefined && newPlayer.duration > 0) {
					durationTimer.setTime(newPlayer.duration);
				}

				// Wiederholte Überprüfung der Dauer, falls sie nicht sofort verfügbar ist
				let attempts = 0;
				const maxAttempts = 100;
				const checkDuration = setInterval(() => {
					if (newPlayer.duration && newPlayer.duration > 0 && newPlayer.duration !== Infinity) {
						durationTimer.setTime(newPlayer.duration);
						clearInterval(checkDuration);
					} else if (attempts >= maxAttempts) {
						clearInterval(checkDuration);
					}
					attempts += 1;
				}, 100);

				// Monitor playback state changes
				const intervalId = setInterval(() => {
					if (newPlayer) {
						positionTimer.updateTime(newPlayer.currentTime);
						setIsPlaying(newPlayer.playing);
						setIsBuffering(false); // expo-audio doesn't expose buffering state

						if (newPlayer.duration !== undefined && newPlayer.duration > 0) {
							durationTimer.setTime(newPlayer.duration);
						}

						// Status aktualisieren
						if (newPlayer.playing) {
							setStatus(AudioPlayerStatus.PLAYING);
						} else if (newPlayer.currentTime === 0 && !newPlayer.playing) {
							setStatus(AudioPlayerStatus.STOPPED);
						} else if (positionTimer.timer > 0) {
							setStatus(AudioPlayerStatus.PAUSED);
						}
					}
				}, 100);

				// Store interval IDs for cleanup
				(newPlayer as any)._intervalId = intervalId;
				(newPlayer as any)._checkDurationId = checkDuration;

				setStatus(AudioPlayerStatus.PAUSED);
			} catch (error) {
				console.error('Fehler beim Laden der Audio-Datei:', error);
				setLoadError(true);
				setPlayer(null);
				setStatus(AudioPlayerStatus.ERROR);
				setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
			}
		},
		[player]
	);

	const pause = useCallback(async () => {
		try {
			if (!player) return;

			if (player.playing) {
				await player.pause();
				setStatus(AudioPlayerStatus.PAUSED);

				if (audioIdRef.current) {
					unregisterAudio(audioIdRef.current);
					audioIdRef.current = null;
				}
			}
		} catch (error) {
			console.error('Fehler beim Pausieren:', error);
		}
	}, [player, unregisterAudio]);

	const playPause = useCallback(async () => {
		try {
			if (!player) return;

			if (player.playing) {
				// Pausieren
				await pause();

				// Benachrichtigung aktualisieren (nur für native Plattformen)
				if (!isWebEnvironment) {
					await NotificationService.showNotification(
						'Audio-Wiedergabe pausiert',
						'Tippe, um zur Wiedergabe zurückzukehren',
						NotificationChannel.AUDIO_PLAYBACK,
						true
					);
				}
			} else {
				// Wenn Audio zu Ende ist (Position am Ende), von vorne starten
				if (player.currentTime >= player.duration && player.duration > 0) {
					player.seekTo(0);
					positionTimer.updateTime(0);
				}

				// Generate audio ID if not exists
				if (!audioIdRef.current) {
					audioIdRef.current = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
				}

				// Pause all other audio before playing this one
				await pauseAllExcept(audioIdRef.current);

				// Abspielen
				await player.play();
				setStatus(AudioPlayerStatus.PLAYING);

				// Activate lock screen controls (iOS Control Center / Android lock screen)
				activateLockScreen(player);

				// Register in global store
				registerAudio(audioIdRef.current, player, pause);

				// Benachrichtigung anzeigen (nur für native Plattformen)
				if (!isWebEnvironment) {
					await NotificationService.showNotification(
						'Audio-Wiedergabe läuft',
						'Tippe, um zur Wiedergabe zurückzukehren',
						NotificationChannel.AUDIO_PLAYBACK,
						true
					);
				}
			}
		} catch (error) {
			console.error('Fehler beim Play/Pause:', error);
			setLoadError(true);
			setStatus(AudioPlayerStatus.ERROR);
			setError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Abspielen');
		}
	}, [player, isWebEnvironment, positionTimer, pause, registerAudio, pauseAllExcept]);

	const stop = useCallback(async () => {
		try {
			if (!player) return;

			await player.pause();
			player.seekTo(0);
			deactivateLockScreen(player);
			setStatus(AudioPlayerStatus.STOPPED);
			positionTimer.updateTime(0);

			// Unregister from global store
			if (audioIdRef.current) {
				unregisterAudio(audioIdRef.current);
				audioIdRef.current = null;
			}

			// Benachrichtigung entfernen (nur für native Plattformen)
			if (!isWebEnvironment) {
				await NotificationService.stopForegroundService();
			}
		} catch (error) {
			console.error('Fehler beim Stop:', error);
			setLoadError(true);
			setStatus(AudioPlayerStatus.ERROR);
			setError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Stoppen');
		}
	}, [player, isWebEnvironment, unregisterAudio]);

	const seekAndPlay = useCallback(
		async (positionMillis: number) => {
			try {
				if (!player) {
					console.error('Kein Player geladen');
					return;
				}

				const maxPosition = (player.duration || 0) * 1000;
				const clampedPosition = Math.min(Math.max(0, positionMillis), maxPosition);
				player.seekTo(clampedPosition / 1000);

				// Generate audio ID if not exists
				if (!audioIdRef.current) {
					audioIdRef.current = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
				}

				// Pause all other audio before playing this one
				await pauseAllExcept(audioIdRef.current);

				await player.play();
				setIsPlaying(true);
				positionTimer.updateTime(positionMillis / 1000);
				setStatus(AudioPlayerStatus.PLAYING);

				// Activate lock screen controls (iOS Control Center / Android lock screen)
				activateLockScreen(player);

				// Register in global store
				registerAudio(audioIdRef.current, player, pause);

				// Benachrichtigung aktualisieren (nur für native Plattformen)
				if (!isWebEnvironment) {
					await NotificationService.showNotification(
						'Audio-Wiedergabe läuft',
						'Tippe, um zur Wiedergabe zurückzukehren',
						NotificationChannel.AUDIO_PLAYBACK,
						true
					);
				}
			} catch (error) {
				console.error('Fehler beim Scrubben und Abspielen:', error);
				setLoadError(true);
				setStatus(AudioPlayerStatus.ERROR);
				setError(error instanceof Error ? error.message : 'Unbekannter Fehler bei der Navigation');
			}
		},
		[player, isWebEnvironment, pause, registerAudio, pauseAllExcept]
	);

	const seek = useCallback(
		async (positionMillis: number) => {
			try {
				if (!player) return;

				const maxPosition = (player.duration || 0) * 1000;
				const clampedPosition = Math.min(Math.max(0, positionMillis), maxPosition);
				player.seekTo(clampedPosition / 1000);
				positionTimer.updateTime(clampedPosition / 1000);
			} catch (error) {
				console.error('Fehler beim Scrubben:', error);
				setLoadError(true);
			}
		},
		[player]
	);

	const unload = useCallback(async () => {
		try {
			if (!player) return;

			// Clear update intervals if they exist
			if ((player as any)._intervalId) {
				clearInterval((player as any)._intervalId);
			}
			if ((player as any)._checkDurationId) {
				clearInterval((player as any)._checkDurationId);
			}

			deactivateLockScreen(player);
			await player.pause();
			player.release();

			// Benachrichtigung entfernen (nur für native Plattformen)
			if (!isWebEnvironment) {
				await NotificationService.stopForegroundService();
			}

			setPlayer(null);
			positionTimer.reset();
			durationTimer.reset();
			setIsPlaying(false);
			setLoadError(false);
			setStatus(AudioPlayerStatus.IDLE);
			setError(null);
			setIsBuffering(false);

			// Unregister from global store
			if (audioIdRef.current) {
				unregisterAudio(audioIdRef.current);
				audioIdRef.current = null;
			}
		} catch (error) {
			console.error('Fehler beim Unload:', error);

			// Trotzdem Status zurücksetzen, um dem Nutzer zu ermöglichen, neu zu laden
			setPlayer(null);
			setStatus(AudioPlayerStatus.IDLE);

			// Ensure unregistration even on error
			if (audioIdRef.current) {
				unregisterAudio(audioIdRef.current);
				audioIdRef.current = null;
			}
		}
	}, [player, isWebEnvironment, unregisterAudio]);

	// Ressourcen freigeben, wenn die Komponente unmounted wird
	useEffect(() => {
		return () => {
			if (player) {
				// Clear update intervals if they exist
				if ((player as any)._intervalId) {
					clearInterval((player as any)._intervalId);
				}
				if ((player as any)._checkDurationId) {
					clearInterval((player as any)._checkDurationId);
				}
				// Clear lock screen controls
				deactivateLockScreen(player);
				// Check if pause method exists before calling it (Expo Audio API change)
				if (typeof player.pause === 'function') {
					try {
						player.pause();
					} catch (error) {
						console.error('Error pausing player:', error);
					}
				}
				player.release();
			}

			// Benachrichtigung entfernen (nur für native Plattformen)
			if (!isWebEnvironment) {
				NotificationService.stopForegroundService().catch(console.error);
			}

			// Unregister from global store
			if (audioIdRef.current) {
				unregisterAudio(audioIdRef.current);
				audioIdRef.current = null;
			}
		};
	}, [player, isWebEnvironment, unregisterAudio]);

	return {
		isPlaying,
		duration: durationTimer.timer,
		currentTime: positionTimer.timer,
		status,
		error,
		isBuffering,
		loadError,
		loadSound,
		playPause,
		stop,
		seekAndPlay,
		seek,
		unload,
		setLockScreenInfo,
		formattedPosition: positionTimer.formattedTime,
		formattedDuration: durationTimer.formattedTime,
		percentComplete:
			durationTimer.timer > 0 ? (positionTimer.timer / durationTimer.timer) * 100 : 0,
	};
};

export default useAudioPlayer;

// Hilfsfunktion zur Formatierung der Zeit
export const formatTime = (milliseconds: number): string => {
	return formatDurationFromMs(milliseconds);
};
