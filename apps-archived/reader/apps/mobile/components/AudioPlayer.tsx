import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
	View,
	Text,
	Pressable,
	ActivityIndicator,
	Alert,
	Animated,
	ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudio } from '~/hooks/useAudio';
import { Text as TextType, AudioVersion } from '~/types/database';
import { useStore } from '~/store/store';
import { useTheme } from '~/hooks/useTheme';
import { Dropdown } from '~/components/dropdown';
import {
	Voice,
	ALL_VOICES,
	getVoiceById,
	GERMAN_VOICES,
	PROVIDER_LABELS,
	QUALITY_LABELS,
} from '~/constants/voices';
import { getCurrentAudioVersion, migrateAudioData } from '~/utils/audioMigration';

interface AudioPlayerProps {
	text: TextType;
	onAudioGenerated?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, onAudioGenerated }) => {
	const [isGenerating, setIsGenerating] = useState(false);
	const [showSpeedControl, setShowSpeedControl] = useState(false);
	const [selectedVoice, setSelectedVoice] = useState<string>('');
	const [showVersions, setShowVersions] = useState(false);
	const progressBarRef = useRef<View>(null);
	const pulseAnim = useRef(new Animated.Value(1)).current;

	const { settings, updateSettings } = useStore();
	const { colors } = useTheme();

	// Use useMemo to prevent re-migration on every render
	const migratedData = useMemo(() => migrateAudioData(text.data), [text.data]);
	const audioVersions = migratedData.audioVersions || [];
	const currentVersion = useMemo(() => getCurrentAudioVersion(migratedData), [migratedData]);

	// Initialize selectedVersionId with current version
	const [selectedVersionId, setSelectedVersionId] = useState<string>(currentVersion?.id || '');

	// Initialize selected voice
	useEffect(() => {
		setSelectedVoice(settings.voice);
	}, [settings.voice]);

	const {
		audioState,
		generationProgress,
		generateAudio,
		playAudio,
		pauseAudio,
		resumeAudio,
		stopAudio,
		seekTo,
		seekForward,
		seekBackward,
		setPlaybackSpeed,
		clearCache,
	} = useAudio();

	// Pulsating animation for loading state
	useEffect(() => {
		if (audioState.isLoading) {
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.2,
						duration: 600,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 600,
						useNativeDriver: true,
					}),
				])
			).start();
		} else {
			pulseAnim.setValue(1);
		}
	}, [audioState.isLoading, pulseAnim]);

	const handleGenerateAudio = async () => {
		try {
			setIsGenerating(true);

			await generateAudio(text.id, text.content, selectedVoice, settings.speed, text);

			onAudioGenerated?.();

			Alert.alert(
				'Audio generiert!',
				'Das Audio wurde erfolgreich generiert und ist jetzt verfügbar.'
			);
		} catch (error) {
			Alert.alert(
				'Fehler',
				error instanceof Error ? error.message : 'Fehler beim Generieren des Audios'
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleVoiceChange = (newVoice: string) => {
		setSelectedVoice(newVoice);
		// Update the global settings
		updateSettings({ voice: newVoice });
	};

	const handlePlayPause = async () => {
		if (!selectedVersion?.chunks) return;

		try {
			if (audioState.isPlaying) {
				await pauseAudio();
			} else if (audioState.sound) {
				await resumeAudio();
			} else {
				// Play directly from Supabase Storage
				await playAudio(text.id, selectedVersion.chunks, text.data.tts?.lastPosition || 0);
			}
		} catch (error) {
			Alert.alert(
				'Wiedergabe-Fehler',
				error instanceof Error ? error.message : 'Fehler beim Abspielen des Audios'
			);
		}
	};

	const handleStop = async () => {
		await stopAudio();
	};

	const formatTime = (milliseconds: number): string => {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const formatSize = (bytes: number): string => {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

	const handleSpeedChange = async (speed: number) => {
		await setPlaybackSpeed(speed);
		setShowSpeedControl(false);
	};

	// Use duration from audio state if available, otherwise calculate from chunks
	const totalDuration =
		audioState.duration ||
		(selectedVersion?.chunks
			? selectedVersion.chunks.reduce((sum, chunk) => sum + chunk.duration, 0) * 1000
			: 0);

	// Handle progress bar press
	const handleProgressPress = async (event: any) => {
		if (progressBarRef.current && totalDuration > 0) {
			progressBarRef.current.measure(async (x, y, width, height, pageX, pageY) => {
				const touchX = event.nativeEvent.pageX - pageX;
				const progress = Math.max(0, Math.min(1, touchX / width));
				const newPosition = progress * totalDuration;

				// If audio hasn't been started yet, start it at the desired position
				if (!audioState.sound) {
					await playAudio(text.id, text.data.audio!.chunks, newPosition);
				} else {
					await seekTo(newPosition);
				}
			});
		}
	};

	// Get the selected audio version
	const selectedVersion = audioVersions.find((v) => v.id === selectedVersionId) || currentVersion;
	const hasAudio = selectedVersion && selectedVersion.chunks.length > 0;

	return (
		<View className={`rounded-lg ${colors.surface} p-3 shadow-sm`}>
			{/* Voice selection and generate button - always visible */}
			<View className="mb-4">
				<Text className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Sprachauswahl</Text>
				<Dropdown
					options={[]}
					value={selectedVoice}
					onValueChange={handleVoiceChange}
					placeholder="Wähle eine Stimme"
					disabled={isGenerating}
					title="Stimme auswählen"
					groups={Object.entries(
						GERMAN_VOICES.reduce(
							(groups, voice) => {
								const provider = voice.provider;
								const quality = voice.quality;
								if (!groups[provider]) {
									groups[provider] = {};
								}
								if (!groups[provider][quality]) {
									groups[provider][quality] = [];
								}
								groups[provider][quality].push(voice);
								return groups;
							},
							{} as Record<string, Record<string, typeof GERMAN_VOICES>>
						)
					).map(([provider, qualityGroups]) => ({
						title: PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS],
						options: Object.entries(qualityGroups).flatMap(([quality, voices]) =>
							voices.map((voice) => ({
								label: `${QUALITY_LABELS[quality as keyof typeof QUALITY_LABELS]} - ${voice.label}`,
								value: voice.value,
							}))
						),
					}))}
				/>

				<Pressable
					onPress={handleGenerateAudio}
					disabled={isGenerating}
					className={`mt-3 rounded-lg px-4 py-2.5 ${isGenerating ? 'bg-gray-400' : colors.primary}`}
				>
					{isGenerating ? (
						<View className="flex-row items-center justify-center">
							<ActivityIndicator size="small" color="white" />
							<Text className="ml-2 font-medium text-white">
								{generationProgress?.currentChunk || 'Generiere Audio...'}
							</Text>
						</View>
					) : (
						<View className="flex-row items-center justify-center">
							<Ionicons name="volume-high" size={20} color="white" />
							<Text className="ml-2 font-medium text-white">
								{hasAudio ? 'Audio neu generieren' : 'Audio generieren'}
							</Text>
						</View>
					)}
				</Pressable>

				{generationProgress && (
					<View className="mt-2">
						<View className={`h-1.5 rounded-full ${colors.surfaceSecondary}`}>
							<View
								className={`h-1.5 rounded-full ${colors.primary}`}
								style={{
									width: `${(generationProgress.chunksCompleted / generationProgress.totalChunks) * 100}%`,
								}}
							/>
						</View>
						<Text className={`mt-1 text-xs ${colors.textSecondary}`}>
							{generationProgress.chunksCompleted} / {generationProgress.totalChunks} Chunks
						</Text>
					</View>
				)}
			</View>

			{/* Audio versions - only shown when audio exists */}
			{audioVersions.length > 0 && (
				<View className="mt-4">
					<Pressable
						onPress={() => setShowVersions(!showVersions)}
						className="flex-row items-center justify-between"
					>
						<Text className={`text-sm font-medium ${colors.textSecondary}`}>
							Audio-Versionen ({audioVersions.length})
						</Text>
						<Ionicons
							name={showVersions ? 'chevron-up' : 'chevron-down'}
							size={16}
							color="#71717a"
						/>
					</Pressable>

					{showVersions && (
						<ScrollView className="mt-2 max-h-40">
							{audioVersions.map((version) => {
								const voice = getVoiceById(version.settings.voice);
								const isActive = version.id === selectedVersionId;
								const date = new Date(version.createdAt);

								return (
									<Pressable
										key={version.id}
										onPress={() => setSelectedVersionId(version.id)}
										className={`mb-2 rounded-lg p-3 ${
											isActive ? 'bg-blue-600' : colors.surfaceSecondary
										}`}
									>
										<View className="flex-row items-center justify-between">
											<View className="flex-1">
												<Text className={`text-sm ${isActive ? 'text-white' : colors.text}`}>
													{date.toLocaleDateString('de-DE', {
														day: '2-digit',
														month: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
													})}
												</Text>
												<Text
													className={`text-xs ${isActive ? 'text-blue-100' : colors.textSecondary}`}
												>
													{voice?.label || version.settings.voice} • {version.settings.speed}x
												</Text>
											</View>
											<View className="flex-row items-center">
												{isActive && <Text className="mr-2 text-xs text-white">Aktiv</Text>}
												<Ionicons
													name={isActive ? 'radio-button-on' : 'radio-button-off'}
													size={20}
													color={isActive ? 'white' : '#71717a'}
												/>
											</View>
										</View>
									</Pressable>
								);
							})}
						</ScrollView>
					)}
				</View>
			)}

			{/* Audio player - only shown when audio exists */}
			{hasAudio && (
				<View className="mt-4 border-t border-zinc-800 pt-3">
					{/* </View> closing tag moved to end */}
					{/* Progress bar and time info - full width */}
					<View className="mb-3">
						{/* Progress Bar with touch gestures */}
						<Pressable onPress={handleProgressPress} className="py-2">
							<View
								ref={progressBarRef}
								className={`h-2 rounded-full ${colors.surfaceSecondary} overflow-hidden`}
							>
								<View
									className={`h-2 rounded-full ${colors.primary}`}
									style={{
										width:
											totalDuration > 0
												? `${(audioState.currentPosition / totalDuration) * 100}%`
												: '0%',
									}}
								/>
								{/* Scrubber indicator */}
								{totalDuration > 0 && (
									<View
										className="absolute top-0 h-2"
										style={{
											left: `${(audioState.currentPosition / totalDuration) * 100}%`,
										}}
									>
										<View
											className={`h-3 w-3 rounded-full ${colors.primary} shadow-lg`}
											style={{ marginTop: -2, marginLeft: -6 }}
										/>
									</View>
								)}
							</View>
						</Pressable>

						{/* Time display */}
						<View className="mt-1 flex-row justify-between">
							<Text className={`text-xs ${colors.textTertiary}`}>
								{formatTime(audioState.currentPosition)}
							</Text>
							<Text className={`text-xs ${colors.textTertiary}`}>{formatTime(totalDuration)}</Text>
						</View>
					</View>

					{/* Controls row */}
					<View className="flex-row items-center justify-center">
						{/* Stop button */}
						<Pressable
							onPress={handleStop}
							disabled={audioState.isLoading}
							className={`rounded-full ${colors.surfaceSecondary} mr-3 p-2`}
						>
							<Ionicons name="stop" size={18} color="#6b7280" />
						</Pressable>

						{/* Backward 15s button */}
						<Pressable
							onPress={() => seekBackward(15)}
							disabled={audioState.isLoading || !audioState.sound}
							className={`rounded-full ${colors.surfaceSecondary} mr-2 p-2`}
						>
							<View className="relative" style={{ transform: [{ scaleX: -1 }] }}>
								<Ionicons name="reload" size={18} color="#6b7280" />
								<View
									className="absolute -bottom-1 -left-1"
									style={{ transform: [{ scaleX: -1 }] }}
								>
									<Text style={{ fontSize: 8, color: '#6b7280', fontWeight: 'bold' }}>15</Text>
								</View>
							</View>
						</Pressable>

						{/* Play/Pause button */}
						<Animated.View
							style={{
								transform: [{ scale: audioState.isLoading ? pulseAnim : 1 }],
							}}
						>
							<Pressable
								onPress={handlePlayPause}
								disabled={audioState.isLoading}
								className={`rounded-full ${colors.primary} mx-2 p-2.5`}
							>
								{audioState.isLoading ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Ionicons
										name={audioState.isPlaying ? 'pause' : 'play'}
										size={20}
										color="white"
									/>
								)}
							</Pressable>
						</Animated.View>

						{/* Forward 15s button */}
						<Pressable
							onPress={() => seekForward(15)}
							disabled={audioState.isLoading || !audioState.sound}
							className={`rounded-full ${colors.surfaceSecondary} mr-3 p-2`}
						>
							<View className="relative">
								<Ionicons name="reload" size={18} color="#6b7280" />
								<View className="absolute -bottom-1 -right-1">
									<Text style={{ fontSize: 8, color: '#6b7280', fontWeight: 'bold' }}>15</Text>
								</View>
							</View>
						</Pressable>

						{/* Speed control button */}
						<Pressable
							onPress={() => setShowSpeedControl(!showSpeedControl)}
							className={`rounded-full ${colors.surfaceSecondary} px-3 py-1.5`}
						>
							<Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>
								{audioState.playbackRate}x
							</Text>
						</Pressable>
					</View>

					{/* Speed options dropdown */}
					{showSpeedControl && (
						<View className="mt-2 flex-row justify-center">
							<View className={`rounded-lg ${colors.surfaceSecondary} flex-row p-2`}>
								{speedOptions.map((speed) => (
									<Pressable
										key={speed}
										onPress={() => handleSpeedChange(speed)}
										className={`mx-1 rounded px-3 py-1 ${
											audioState.playbackRate === speed ? colors.primary : ''
										}`}
									>
										<Text
											style={{
												fontSize: 12,
												color: audioState.playbackRate === speed ? '#ffffff' : '#6b7280',
												fontWeight: audioState.playbackRate === speed ? 'bold' : 'normal',
											}}
										>
											{speed}x
										</Text>
									</Pressable>
								))}
							</View>
						</View>
					)}
				</View>
			)}
		</View>
	);
};
