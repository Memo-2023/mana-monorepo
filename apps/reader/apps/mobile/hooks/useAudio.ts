import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { AudioService, AudioGenerationProgress } from '~/services/audioService';
import { useTexts } from './useTexts';
import { useStore } from '~/store/store';
import { AudioChunk } from '~/types/database';

export interface AudioState {
	isPlaying: boolean;
	isLoading: boolean;
	currentPosition: number;
	duration: number;
	currentChunk?: AudioChunk;
	sound?: Audio.Sound;
	playbackRate: number;
}

export const useAudio = () => {
	const { settings, updateSettings } = useStore();
	const { updateText } = useTexts();

	const [audioState, setAudioState] = useState<AudioState>({
		isPlaying: false,
		isLoading: false,
		currentPosition: 0,
		duration: 0,
		playbackRate: settings.playbackRate || 1.0,
	});

	const [generationProgress, setGenerationProgress] = useState<AudioGenerationProgress | null>(
		null
	);
	const [downloadProgress, setDownloadProgress] = useState<{
		completed: number;
		total: number;
		currentChunk: string;
	} | null>(null);

	const { setCurrentText, setIsPlaying, setCurrentPosition } = useStore();
	const audioService = AudioService.getInstance();

	// Initialize audio session
	useEffect(() => {
		const initializeAudio = async () => {
			try {
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: false,
					playsInSilentModeIOS: true,
					shouldDuckAndroid: true,
					staysActiveInBackground: true,
					playThroughEarpieceAndroid: false,
				});
			} catch (error) {
				console.error('Error initializing audio:', error);
			}
		};

		initializeAudio();
	}, []);

	// Clean up audio when component unmounts
	useEffect(() => {
		return () => {
			if (audioState.sound) {
				audioState.sound.unloadAsync();
			}
		};
	}, [audioState.sound]);

	// Generate audio for a text
	const generateAudio = useCallback(
		async (
			textId: string,
			content: string,
			voice: string = 'de-DE',
			speed: number = 1.0,
			currentText?: any
		) => {
			try {
				setGenerationProgress({
					chunksCompleted: 0,
					totalChunks: 1,
					currentChunk: 'Starting...',
					isComplete: false,
				});

				// Import migration helper
				const { generateVersionId } = await import('~/utils/audioMigration');
				const newVersionId = generateVersionId();

				const result = await audioService.generateAudioForText(
					textId,
					content,
					voice,
					speed,
					1000,
					setGenerationProgress,
					newVersionId
				);

				if (!result.success) {
					throw new Error(result.error);
				}

				// Get current text to append to audioVersions
				if (!currentText) {
					throw new Error('Text must be provided to generate audio');
				}

				// Import migration helper for existing code
				const { migrateAudioData } = await import('~/utils/audioMigration');

				// Migrate old data if needed
				const migratedData = migrateAudioData(currentText.data);
				const newAudioVersion = {
					id: newVersionId,
					chunks: result.chunks || [],
					settings: { voice, speed },
					totalSize: result.chunks?.reduce((sum, chunk) => sum + chunk.size, 0) || 0,
					hasLocalCache: false,
					createdAt: new Date().toISOString(),
				};

				// Append new version to audioVersions
				const updatedAudioVersions = [...(migratedData.audioVersions || []), newAudioVersion];

				// Update text with new audio version
				await updateText(textId, {
					data: {
						...migratedData,
						audioVersions: updatedAudioVersions,
						currentAudioVersion: newVersionId,
						// Keep legacy audio field for backward compatibility
						audio: {
							hasLocalCache: false,
							chunks: result.chunks || [],
							totalSize: newAudioVersion.totalSize,
							lastGenerated: newAudioVersion.createdAt,
							settings: { voice, speed },
						},
					},
				});

				return result;
			} catch (error) {
				console.error('Error generating audio:', error);
				throw error;
			} finally {
				setGenerationProgress(null);
			}
		},
		[audioService, updateText]
	);

	// Download audio chunks to local storage
	const downloadAudio = useCallback(
		async (textId: string, chunks: AudioChunk[]) => {
			try {
				setDownloadProgress({
					completed: 0,
					total: chunks.length,
					currentChunk: 'Starting download...',
				});

				const result = await audioService.downloadAudioChunks(textId, chunks, setDownloadProgress);

				if (!result.success) {
					throw new Error(result.error);
				}

				// Update text to mark as locally cached
				await updateText(textId, {
					data: {
						audio: {
							hasLocalCache: true,
							chunks: result.localChunks || chunks,
							totalSize: result.localChunks?.reduce((sum, chunk) => sum + chunk.size, 0) || 0,
							lastGenerated: new Date().toISOString(),
						},
					},
				});

				return result;
			} catch (error) {
				console.error('Error downloading audio:', error);
				throw error;
			} finally {
				setDownloadProgress(null);
			}
		},
		[audioService, updateText]
	);

	// Play audio from local cache
	const playAudio = useCallback(
		async (textId: string, chunks: AudioChunk[], startPosition: number = 0) => {
			try {
				setAudioState((prev) => ({ ...prev, isLoading: true }));

				// Stop current audio if playing
				if (audioState.sound) {
					audioState.sound.unloadAsync();
				}

				// Calculate total duration from all chunks
				const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0) * 1000; // Convert to milliseconds

				const result = await audioService.playAudioFromSupabase(textId, chunks, startPosition);

				if (!result.sound) {
					throw new Error(result.error);
				}

				const currentChunk = result.chunk;
				const allChunks = result.chunks || chunks;

				// Set up playback status update
				result.sound.setOnPlaybackStatusUpdate((status) => {
					if (status.isLoaded) {
						// Calculate the actual position across all chunks
						const chunkPosition = status.positionMillis || 0;
						const overallPosition = currentChunk
							? currentChunk.start + chunkPosition
							: chunkPosition;

						setAudioState((prev) => ({
							...prev,
							isPlaying: status.isPlaying,
							currentPosition: overallPosition,
							duration: totalDuration, // Keep using total duration
						}));

						// Update global store
						setIsPlaying(status.isPlaying);
						setCurrentPosition(overallPosition);
					}
				});

				setAudioState((prev) => ({
					...prev,
					sound: result.sound,
					isLoading: false,
					isPlaying: true,
					duration: totalDuration, // Set total duration of all chunks
					currentChunk: currentChunk,
				}));

				setCurrentText(textId);

				// Start playing
				await result.sound.playAsync();

				// Apply saved playback rate
				if (audioState.playbackRate !== 1.0) {
					await result.sound.setRateAsync(audioState.playbackRate, true);
				}
			} catch (error) {
				console.error('Error playing audio:', error);
				setAudioState((prev) => ({ ...prev, isLoading: false }));
				throw error;
			}
		},
		[
			audioState.sound,
			audioState.playbackRate,
			audioService,
			setCurrentText,
			setIsPlaying,
			setCurrentPosition,
		]
	);

	// Pause audio
	const pauseAudio = useCallback(async () => {
		if (audioState.sound) {
			await audioState.sound.pauseAsync();
			setAudioState((prev) => ({ ...prev, isPlaying: false }));
			setIsPlaying(false);
		}
	}, [audioState.sound, setIsPlaying]);

	// Resume audio
	const resumeAudio = useCallback(async () => {
		if (audioState.sound) {
			await audioState.sound.playAsync();
			setAudioState((prev) => ({ ...prev, isPlaying: true }));
			setIsPlaying(true);
		}
	}, [audioState.sound, setIsPlaying]);

	// Stop audio
	const stopAudio = useCallback(async () => {
		if (audioState.sound) {
			await audioState.sound.pauseAsync();
			await audioState.sound.unloadAsync();
			setAudioState((prev) => ({
				...prev,
				sound: undefined,
				isPlaying: false,
				currentPosition: 0,
				duration: 0,
			}));
			setCurrentText(null);
			setIsPlaying(false);
			setCurrentPosition(0);
		}
	}, [audioState.sound, setCurrentText, setIsPlaying, setCurrentPosition]);

	// Seek to position
	const seekTo = useCallback(
		async (position: number) => {
			if (audioState.sound) {
				await audioState.sound.setPositionAsync(position);
			}
		},
		[audioState.sound]
	);

	// Seek forward by seconds
	const seekForward = useCallback(
		async (seconds: number = 15) => {
			if (audioState.sound && audioState.duration > 0) {
				const newPosition = Math.min(
					audioState.currentPosition + seconds * 1000,
					audioState.duration
				);
				await audioState.sound.setPositionAsync(newPosition);
			}
		},
		[audioState.sound, audioState.currentPosition, audioState.duration]
	);

	// Seek backward by seconds
	const seekBackward = useCallback(
		async (seconds: number = 15) => {
			if (audioState.sound) {
				const newPosition = Math.max(audioState.currentPosition - seconds * 1000, 0);
				await audioState.sound.setPositionAsync(newPosition);
			}
		},
		[audioState.sound, audioState.currentPosition]
	);

	// Set playback speed
	const setPlaybackSpeed = useCallback(
		async (rate: number) => {
			if (audioState.sound) {
				try {
					await audioState.sound.setRateAsync(rate, true);
					setAudioState((prev) => ({ ...prev, playbackRate: rate }));
					// Persist to store
					updateSettings({ playbackRate: rate });
				} catch (error) {
					console.error('Error setting playback rate:', error);
				}
			} else {
				// If no sound is playing, just update the state for next playback
				setAudioState((prev) => ({ ...prev, playbackRate: rate }));
				// Persist to store
				updateSettings({ playbackRate: rate });
			}
		},
		[audioState.sound, updateSettings]
	);

	// Clear audio cache
	const clearCache = useCallback(
		async (textId: string, chunks: AudioChunk[]) => {
			await audioService.clearAudioCache(textId, chunks);

			// Update text to mark as not cached
			await updateText(textId, {
				data: {
					audio: {
						hasLocalCache: false,
						chunks,
						totalSize: 0,
					},
				},
			});
		},
		[audioService, updateText]
	);

	// Get cache size
	const getCacheSize = useCallback(async () => {
		return await audioService.getCacheSize();
	}, [audioService]);

	// Check if audio is cached
	const isAudioCached = useCallback(
		async (textId: string, chunks: AudioChunk[]) => {
			return await audioService.isAudioCached(textId, chunks);
		},
		[audioService]
	);

	return {
		audioState,
		generationProgress,
		downloadProgress,
		generateAudio,
		downloadAudio,
		playAudio,
		pauseAudio,
		resumeAudio,
		stopAudio,
		seekTo,
		seekForward,
		seekBackward,
		setPlaybackSpeed,
		clearCache,
		getCacheSize,
		isAudioCached,
	};
};
