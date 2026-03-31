import React, { useState } from 'react';
import {
	View,
	StyleSheet,
	ScrollView as RNScrollView,
	Alert,
	Share,
	TextInput,
	Pressable,
	Platform,
} from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import Icon from '~/components/atoms/Icon';
import * as Clipboard from 'expo-clipboard';
import SpeakerLabelModal from '~/components/molecules/SpeakerLabelModal';
import HighlightedText from '~/components/atoms/HighlightedText';
import { getLanguageDisplayName } from '~/utils/languageMapping';
import { useTranslation } from 'react-i18next';

interface TranscriptData {
	audio_path?: string;
	type?: string;
	speakers?: Record<string, string>;
	utterances?: Array<{ speakerId: string; text: string; offset: number; duration: number }>;
	transcription_parts?: Array<{
		text: string;
		speaker?: string;
		start_time?: number;
		end_time?: number;
		// For combined memos:
		memo_id?: string;
		title?: string;
		transcript?: string;
		created_at?: string;
		index?: number;
		original_source?: any;
	}>;
	languages?: string[];
	primary_language?: string;
	transcript?: string;
}

interface TranscriptDisplayProps {
	data: TranscriptData;
	defaultExpanded?: boolean;
	title?: string;
	speakerLabels?: Record<string, string>;
	onNameSpeakersPress?: () => void;
	onCopyPress?: () => void;
	onSharePress?: () => void;
	onUpdateSpeakerLabels?: (speakerMappings: Array<{ id: string; label: string }>) => void;
	onCopySuccess?: () => void;
	// Search highlighting props
	searchQuery?: string;
	isSearchMode?: boolean;
	currentResultIndex?: number;
	searchResults?: Array<{
		id: string;
		type: string;
		text: string;
		index: number;
		matchIndex: number;
	}>;
	// Edit mode props
	isEditing?: boolean;
	onTranscriptChange?: (newTranscript: string) => void;
	onUtteranceChange?: (index: number, newText: string) => void;
}

function TranscriptDisplay({
	data,
	defaultExpanded = true,
	title = 'Transkript',
	speakerLabels = {},
	onNameSpeakersPress,
	onCopyPress,
	onSharePress,
	onUpdateSpeakerLabels,
	onCopySuccess,
	searchQuery = '',
	isSearchMode = false,
	currentResultIndex,
	searchResults,
	isEditing = false,
	onTranscriptChange,
	onUtteranceChange,
}: TranscriptDisplayProps) {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const [isSpeakerModalVisible, setIsSpeakerModalVisible] = useState(false);
	const [editableSpeakerLabels, setEditableSpeakerLabels] = useState<Record<string, string>>({
		...speakerLabels,
	});
	const [showStatistics, setShowStatistics] = useState(false);

	// Local state for editing
	const [localUtterances, setLocalUtterances] = useState<Array<any>>([]);
	const [localTranscript, setLocalTranscript] = useState<string>('');
	const [isLocalStateInitialized, setIsLocalStateInitialized] = useState(false);

	// Check if this is a combined memo
	const isCombinedMemo = data.type === 'combined';

	// Convert transcription_parts to utterances format if needed
	const getUtterancesFromData = () => {
		if (data.utterances && data.utterances.length > 0) {
			return data.utterances;
		}

		if (data.transcription_parts && data.transcription_parts.length > 0) {
			// Handle combined memos differently
			if (isCombinedMemo) {
				// For combined memos, flatten all utterances from all parts
				const allUtterances: any[] = [];

				data.transcription_parts.forEach((part, partIndex) => {
					// Add a separator utterance for each memo part
					allUtterances.push({
						speakerId: '__separator__',
						text: part.title || `Memo ${partIndex + 1}`,
						offset: 0,
						duration: 0,
						memoId: part.memo_id,
						createdAt: part.created_at,
						isSeparator: true,
					});

					// Add utterances from this part
					if (part.utterances && Array.isArray(part.utterances)) {
						part.utterances.forEach((utterance: any) => {
							allUtterances.push({
								speakerId: utterance.speakerId || 'unknown',
								text: utterance.text || '',
								offset: utterance.offset || 0,
								duration: utterance.duration || 0,
								partIndex: partIndex,
								speakers: part.speakers || {},
							});
						});
					} else if (part.transcript) {
						// If no utterances but has transcript text, create a single utterance
						allUtterances.push({
							speakerId: 'default',
							text: part.transcript,
							offset: 0,
							duration: 0,
							partIndex: partIndex,
						});
					}
				});

				return allUtterances;
			} else {
				// Handle normal transcription parts
				return data.transcription_parts.map((part, index) => ({
					speakerId: part.speaker || `speaker${index + 1}`,
					text: part.text,
					offset: part.start_time ? part.start_time * 1000 : 0, // Convert to ms
					duration: part.end_time && part.start_time ? (part.end_time - part.start_time) * 1000 : 0,
				}));
			}
		}

		return [];
	};

	// Initialize local state when entering edit mode ONLY - ignore data changes while editing
	React.useEffect(() => {
		if (isEditing && !isLocalStateInitialized) {
			const utterancesFromData = getUtterancesFromData();
			setLocalUtterances(utterancesFromData);
			setLocalTranscript(data.transcript || '');
			setIsLocalStateInitialized(true);
			console.debug('TranscriptDisplay: Local state initialized for editing', {
				utterances: utterancesFromData.length,
				transcript: data.transcript?.length || 0,
			});
		} else if (!isEditing && isLocalStateInitialized) {
			// Reset when leaving edit mode
			setLocalUtterances([]);
			setLocalTranscript('');
			setIsLocalStateInitialized(false);
			console.debug('TranscriptDisplay: Local state reset - leaving edit mode');
		}
	}, [isEditing]); // Removed 'data' dependency to prevent overwrites during editing

	// Use local state when editing, original data when not
	const utterances =
		isEditing && isLocalStateInitialized ? localUtterances : getUtterancesFromData();
	const transcriptText =
		isEditing && isLocalStateInitialized ? localTranscript : data.transcript || '';
	const hasUtterances = utterances.length > 0;

	// Funktion zum Formatieren des Transkripts
	const getFormattedTranscript = (): string => {
		let formattedText = '';

		if (hasUtterances && utterances) {
			if (isCombinedMemo) {
				// Spezielle Formatierung für kombinierte Memos
				let currentMemoSection = '';
				utterances.forEach((utterance, index) => {
					if (utterance.isSeparator) {
						// Add separator header
						if (currentMemoSection) {
							formattedText += '\n\n';
						}
						const createdAt = utterance.createdAt
							? new Date(utterance.createdAt).toLocaleDateString('de-DE', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								})
							: '';
						const header = createdAt
							? `=== ${utterance.text} (${createdAt}) ===`
							: `=== ${utterance.text} ===`;
						formattedText += header + '\n\n';
						currentMemoSection = utterance.text;
					} else {
						// Add regular utterance
						const speakerName =
							utterance.speakers && utterance.speakers[utterance.speakerId]
								? utterance.speakers[utterance.speakerId]
								: getSpeakerDisplayName(utterance.speakerId);
						formattedText += `${speakerName}: ${utterance.text}\n\n`;
					}
				});
				formattedText = formattedText.trim();
			} else {
				// Normale Formatierung mit Sprechernamen
				formattedText = utterances
					.map((utterance) => {
						const speakerName = getSpeakerDisplayName(utterance.speakerId);
						return `${speakerName}: ${utterance.text}`;
					})
					.join('\n\n');
			}
		} else if (data.transcript) {
			// Wenn keine Äußerungen vorhanden sind, verwende den einfachen Transkripttext
			formattedText = data.transcript;
		}

		return formattedText;
	};

	// Funktion zum Kopieren des Transkripts in die Zwischenablage
	const handleCopyPress = async () => {
		try {
			const textToCopy = getFormattedTranscript();

			if (textToCopy) {
				await Clipboard.setStringAsync(textToCopy);

				// Use onCopySuccess callback if provided, otherwise fallback to system alert
				if (onCopySuccess) {
					onCopySuccess();
				} else {
					Alert.alert('Erfolg', 'Transkript wurde in die Zwischenablage kopiert');
				}

				if (onCopyPress) {
					onCopyPress();
				}
			}
		} catch (error) {
			console.debug('Fehler beim Kopieren:', error);
			Alert.alert('Fehler', 'Das Transkript konnte nicht kopiert werden');
		}
	};

	// Funktion zum Teilen des Transkripts über den nativen Share-Dialog
	const handleSharePress = async () => {
		try {
			const textToShare = getFormattedTranscript();

			if (textToShare) {
				await Share.share({
					message: textToShare,
					title: title || 'Transkript',
				});

				if (onSharePress) {
					onSharePress();
				}
			}
		} catch (error) {
			console.debug('Fehler beim Teilen:', error);
			Alert.alert('Fehler', 'Das Transkript konnte nicht geteilt werden');
		}
	};

	// Funktion zum Öffnen des Modals für die Benennung von Sprechern
	const handleNameSpeakersPress = () => {
		if (onNameSpeakersPress) {
			onNameSpeakersPress();
		} else {
			setIsSpeakerModalVisible(true);
		}
	};

	// Funktion zum Schließen des Modals für die Benennung von Sprechern
	const handleCloseSpeakerModal = () => {
		setIsSpeakerModalVisible(false);
	};

	// Funktion zum Speichern der Sprechernamen
	const handleSubmitSpeakerLabels = (speakerMappings: Array<{ id: string; label: string }>) => {
		// Konvertiere das Array von Mappings in ein Record-Objekt
		const updatedLabels: Record<string, string> = {};
		speakerMappings.forEach((mapping) => {
			updatedLabels[mapping.id] = mapping.label;
		});

		// Aktualisiere den lokalen State
		setEditableSpeakerLabels(updatedLabels);

		// Rufe die übergebene Callback-Funktion auf, falls vorhanden
		if (onUpdateSpeakerLabels) {
			onUpdateSpeakerLabels(speakerMappings);
		}

		// Schließe das Modal
		setIsSpeakerModalVisible(false);
	};

	// Format timestamp (offset in ms to mm:ss format)
	const formatTimestamp = (offsetMs?: number): string => {
		if (offsetMs === undefined) return '';

		const totalSeconds = Math.floor(offsetMs / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	};

	// Statistics calculation functions
	const calculateStatistics = () => {
		let totalWords = 0;
		const speakerWordCounts: Record<string, number> = {};
		let totalDurationMs = 0;

		if (hasUtterances && utterances) {
			utterances.forEach((utterance) => {
				const words = utterance.text
					.trim()
					.split(/\s+/)
					.filter((word) => word.length > 0);
				const wordCount = words.length;

				totalWords += wordCount;

				// Count words per speaker
				const speakerName = getSpeakerDisplayName(utterance.speakerId);
				speakerWordCounts[speakerName] = (speakerWordCounts[speakerName] || 0) + wordCount;

				// Calculate total duration (use duration if available, otherwise estimate)
				if (utterance.duration && utterance.duration > 0) {
					totalDurationMs += utterance.duration;
				}
			});
		} else if (transcriptText) {
			// For plain transcript without utterances
			const words = transcriptText
				.trim()
				.split(/\s+/)
				.filter((word) => word.length > 0);
			totalWords = words.length;
			speakerWordCounts['Total'] = totalWords;
		}

		// Calculate words per minute
		const totalDurationMinutes = totalDurationMs > 0 ? totalDurationMs / (1000 * 60) : 0;
		const wordsPerMinute =
			totalDurationMinutes > 0 ? Math.round(totalWords / totalDurationMinutes) : 0;

		return {
			totalWords,
			speakerWordCounts,
			wordsPerMinute: totalDurationMinutes > 0 ? wordsPerMinute : null,
			totalDurationMinutes: Math.round(totalDurationMinutes * 10) / 10, // Round to 1 decimal
		};
	};

	// Determine language for display - use primary_language if available, otherwise fallback to first language in array
	const languageCode =
		data.primary_language ||
		(data.languages && data.languages.length > 0 ? data.languages[0] : 'unknown');
	const language = getLanguageDisplayName(languageCode);

	// Theme colors
	const textColor = isDark ? '#FFFFFF' : '#000000';
	const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
	const backgroundColor = isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)';
	const borderColor = isDark
		? `var(--color-dark-${themeVariant}-border)`
		: `var(--color-${themeVariant}-border)`;
	const speakerColors = {
		speaker1: isDark ? '#64B5F6' : '#2196F3', // Blue
		speaker2: isDark ? '#81C784' : '#4CAF50', // Green
		speaker3: isDark ? '#FFB74D' : '#FF9800', // Orange
		speaker4: isDark ? '#E57373' : '#F44336', // Red
		default: isDark ? '#B39DDB' : '#673AB7', // Purple
	};

	const styles = StyleSheet.create({
		container: {
			borderRadius: 8,
			overflow: 'hidden',
			marginVertical: 8,
			width: '100%',
			maxWidth: 720,
			alignSelf: 'center',
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: 12,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
			gap: 12, // Add gap between title and language container
		},
		languageContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			flexShrink: 0, // Prevent language container from shrinking
		},
		title: {
			fontSize: 16,
			fontWeight: 'bold',
			color: textColor,
			flex: 1, // Allow title to take available space but not push language container out
			marginRight: 12, // Add some space between title and language container
		},
		languageTag: {
			fontSize: 12,
			color: secondaryTextColor,
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
			paddingHorizontal: 8,
			paddingVertical: 4,
			borderRadius: 4,
			marginRight: 8,
		},
		infoIcon: {
			padding: 4,
		},
		statisticsSection: {
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
			paddingVertical: 12,
		},
		statisticsRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginBottom: 6,
		},
		statisticsLabel: {
			fontSize: 13,
			color: secondaryTextColor,
		},
		statisticsValue: {
			fontSize: 13,
			fontWeight: '600',
			color: textColor,
		},
		speakerStatsContainer: {
			marginTop: 8,
			paddingTop: 8,
			borderTopWidth: 1,
			borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
		},
		speakerStatsTitle: {
			fontSize: 12,
			fontWeight: '600',
			color: secondaryTextColor,
			marginBottom: 6,
		},
		actionButtonsContainer: {
			paddingVertical: 8,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
			// Kein marginHorizontal - volle Breite für Buttons
		},
		buttonScrollContainer: {
			flexDirection: 'row',
			paddingHorizontal: 0,
		},
		buttonContainer: {
			marginRight: 8,
		},
		content: {
			paddingVertical: 12,
			width: '100%',
		},
		plainTranscript: {
			fontSize: 16,
			lineHeight: 24,
			color: textColor,
		},
		speakerItem: {
			marginBottom: 16,
			width: '100%',
		},
		speakerHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 4,
		},
		speakerName: {
			fontSize: 14,
			fontWeight: 'bold',
			marginRight: 8,
		},
		timestamp: {
			fontSize: 12,
			color: secondaryTextColor,
		},
		speakerText: {
			fontSize: 16,
			lineHeight: 24,
			color: textColor,
		},
		speakerTextInput: {
			fontSize: 16,
			lineHeight: 24,
			color: textColor,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
			paddingBottom: 4,
			minHeight: 24,
			textAlignVertical: 'top',
		},
		plainTranscriptInput: {
			fontSize: 16,
			lineHeight: 24,
			color: textColor,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
			paddingBottom: 4,
			minHeight: 24,
			textAlignVertical: 'top',
		},
		memoSeparator: {
			marginVertical: 24,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 0,
		},
		memoSeparatorLine: {
			flex: 1,
			height: 1,
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
		},
		memoSeparatorContent: {
			paddingHorizontal: 16,
			alignItems: 'center',
		},
		memoSeparatorTitle: {
			fontSize: 14,
			fontWeight: '600',
			color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
			marginBottom: 4,
		},
		memoSeparatorDate: {
			fontSize: 12,
			color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
		},
	});

	// Helper function to get speaker name display
	const getSpeakerDisplayName = (speakerId: string): string => {
		// 1. Priorität: Benutzerdefinierte Labels aus den Metadaten
		if (speakerLabels && speakerLabels[speakerId]) {
			return speakerLabels[speakerId];
		}

		// 2. Priorität: Namen aus dem speakers-Objekt - aber überprüfe ob es ein Standard-Speaker-Name ist
		if (data.speakers && data.speakers[speakerId]) {
			const speakerName = data.speakers[speakerId];

			// Ensure speakerName is a string before processing
			if (typeof speakerName === 'string' && speakerName) {
				// Check if it's a default "Speaker X" format that needs translation
				const defaultSpeakerMatch = speakerName.match(/^Speaker\s+(\d+)$/i);
				if (defaultSpeakerMatch) {
					const number = defaultSpeakerMatch[1];
					return t('memo.speaker_default', { number });
				}

				// Otherwise return the custom name
				return speakerName;
			}
		}

		// 3. Priorität: Übersetze Speaker-ID
		const match = speakerId.match(/([a-zA-Z]+)(\d+)/i);
		if (match) {
			const prefix = match[1].toLowerCase();
			const number = match[2];

			if (prefix === 'speaker') {
				return t('memo.speaker_default', { number });
			}
		}

		// Check if speakerId itself is already formatted like "Speaker 1"
		const formattedMatch = speakerId.match(/^Speaker\s+(\d+)$/i);
		if (formattedMatch) {
			const number = formattedMatch[1];
			return t('memo.speaker_default', { number });
		}

		// Fallback: Formatierte Speaker-ID
		return speakerId.replace(
			/([a-zA-Z]+)(\d+)/i,
			(_, text, num) => `${text.charAt(0).toUpperCase()}${text.slice(1)} ${num}`
		);
	};

	// Helper function to get speaker text color
	const getSpeakerColor = (speakerId: string): string => {
		return speakerColors[speakerId as keyof typeof speakerColors] || speakerColors.default;
	};

	// Extrahiere die Sprecher-IDs aus den Äußerungen oder Sprechern
	const getSpeakerIds = (): string[] => {
		if (utterances.length > 0) {
			// Extrahiere eindeutige Sprecher-IDs aus den Äußerungen
			const speakerIds = new Set<string>();
			utterances.forEach((utterance) => {
				speakerIds.add(utterance.speakerId);
			});
			return Array.from(speakerIds);
		} else if (data.speakers) {
			// Verwende die Schlüssel aus dem speakers-Objekt
			return Object.keys(data.speakers);
		}
		return [];
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
					{title}
				</Text>
				{language !== 'unknown' && (
					<View style={styles.languageContainer}>
						<View style={styles.languageTag}>
							<Text style={{ color: secondaryTextColor }}>{language}</Text>
						</View>
						<Pressable style={styles.infoIcon} onPress={() => setShowStatistics(!showStatistics)}>
							<Icon
								name={showStatistics ? 'information-circle' : 'information-circle-outline'}
								size={24}
								color={
									showStatistics
										? `var(--color-${isDark ? 'dark-' : ''}${themeVariant}-primary)`
										: secondaryTextColor
								}
							/>
						</Pressable>
					</View>
				)}
			</View>

			{/* Statistics Section */}
			{showStatistics && language !== 'unknown' && (
				<View style={styles.statisticsSection}>
					{(() => {
						const stats = calculateStatistics();
						return (
							<>
								<View style={styles.statisticsRow}>
									<Text style={styles.statisticsLabel}>
										{t('transcript.total_words', 'Total Words')}
									</Text>
									<Text style={styles.statisticsValue}>{stats.totalWords}</Text>
								</View>

								{stats.wordsPerMinute !== null && (
									<View style={styles.statisticsRow}>
										<Text style={styles.statisticsLabel}>
											{t('transcript.words_per_minute', 'Words per Minute')}
										</Text>
										<Text style={styles.statisticsValue}>{stats.wordsPerMinute}</Text>
									</View>
								)}

								{stats.totalDurationMinutes > 0 && (
									<View style={styles.statisticsRow}>
										<Text style={styles.statisticsLabel}>
											{t('transcript.duration', 'Duration')}
										</Text>
										<Text style={styles.statisticsValue}>
											{stats.totalDurationMinutes} {t('transcript.minutes_short', 'min')}
										</Text>
									</View>
								)}

								{Object.keys(stats.speakerWordCounts).length > 1 && (
									<View style={styles.speakerStatsContainer}>
										<Text style={styles.speakerStatsTitle}>
											{t('transcript.words_per_speaker', 'Words per Speaker')}
										</Text>
										{Object.entries(stats.speakerWordCounts).map(([speaker, count]) => (
											<View key={speaker} style={styles.statisticsRow}>
												<Text style={styles.statisticsLabel}>{speaker}</Text>
												<Text style={styles.statisticsValue}>{count}</Text>
											</View>
										))}
									</View>
								)}
							</>
						);
					})()}
				</View>
			)}

			{!isEditing && (
				<View style={styles.actionButtonsContainer}>
					<RNScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.buttonScrollContainer}
					>
						<View style={styles.buttonContainer}>
							<Button
								variant="secondary"
								title={t('memo.name_speakers')}
								onPress={handleNameSpeakersPress}
								leftIcon={() => (
									<View style={{ marginRight: 8 }}>
										<Icon name="person-outline" size={18} color={textColor} />
									</View>
								)}
							/>
						</View>
						<View style={styles.buttonContainer}>
							<Button
								variant="secondary"
								title={t('memo.copy')}
								onPress={handleCopyPress}
								leftIcon={() => (
									<View style={{ marginRight: 8 }}>
										<Icon name="copy-outline" size={18} color={textColor} />
									</View>
								)}
							/>
						</View>
						<View style={styles.buttonContainer}>
							<Button
								variant="secondary"
								title={t('common.share')}
								onPress={handleSharePress}
								leftIcon={() => (
									<View style={{ marginRight: 8 }}>
										<Icon
											name={Platform.OS === 'android' ? 'share-social-outline' : 'share-outline'}
											size={18}
											color={textColor}
										/>
									</View>
								)}
							/>
						</View>
					</RNScrollView>
				</View>
			)}

			<View style={styles.content}>
				{hasUtterances ? (
					// Zeige Äußerungen chronologisch an
					utterances.map((utterance, index) => {
						// Special handling for separator utterances in combined memos
						if (utterance.isSeparator) {
							return (
								<View key={`separator-${index}`} style={styles.memoSeparator}>
									<View style={styles.memoSeparatorLine} />
									<View style={styles.memoSeparatorContent}>
										<Text style={styles.memoSeparatorTitle}>{utterance.text}</Text>
										{utterance.createdAt && (
											<Text style={styles.memoSeparatorDate}>
												{new Date(utterance.createdAt).toLocaleDateString('de-DE', {
													day: '2-digit',
													month: '2-digit',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})}
											</Text>
										)}
									</View>
									<View style={styles.memoSeparatorLine} />
								</View>
							);
						}

						// Regular utterance handling
						const speakerName =
							utterance.speakers && utterance.speakers[utterance.speakerId]
								? utterance.speakers[utterance.speakerId]
								: getSpeakerDisplayName(utterance.speakerId);

						return (
							<View key={`utterance-${index}`} style={styles.speakerItem}>
								<View style={styles.speakerHeader}>
									<Text
										style={[styles.speakerName, { color: getSpeakerColor(utterance.speakerId) }]}
									>
										{speakerName}
									</Text>
									<Text style={styles.timestamp}>{formatTimestamp(utterance.offset)}</Text>
								</View>
								{isEditing ? (
									<TextInput
										style={styles.speakerTextInput}
										value={utterance.text}
										onChangeText={(newText) => {
											console.debug('TranscriptDisplay: onChangeText called', {
												index,
												newText,
												hasCallback: !!onUtteranceChange,
											});

											// Update local state immediately for instant feedback
											setLocalUtterances((prev) =>
												prev.map((utt, i) => (i === index ? { ...utt, text: newText } : utt))
											);

											// Call the parent callback
											onUtteranceChange?.(index, newText);
										}}
										placeholder="Äußerung eingeben"
										placeholderTextColor={
											isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
										}
										multiline
										scrollEnabled={false}
										textAlignVertical="top"
										editable={true}
									/>
								) : isSearchMode && searchQuery ? (
									<HighlightedText
										text={utterance.text}
										searchQuery={searchQuery}
										style={styles.speakerText}
										currentResultIndex={currentResultIndex}
										searchResults={searchResults}
										textType="transcript"
									/>
								) : (
									<Text style={styles.speakerText}>{utterance.text}</Text>
								)}
							</View>
						);
					})
				) : // Kein strukturiertes Transkript: Zeige einfachen Text
				isEditing ? (
					<TextInput
						style={styles.plainTranscriptInput}
						value={transcriptText}
						onChangeText={(newText) => {
							console.debug('TranscriptDisplay: plain transcript onChangeText called', {
								newText,
								hasCallback: !!onTranscriptChange,
							});

							// Update local state immediately for instant feedback
							setLocalTranscript(newText);

							// Call the parent callback
							onTranscriptChange?.(newText);
						}}
						placeholder="Transkript eingeben"
						placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
						multiline
						scrollEnabled={false}
						textAlignVertical="top"
						editable={true}
					/>
				) : isSearchMode && searchQuery ? (
					<HighlightedText
						text={transcriptText}
						searchQuery={searchQuery}
						style={styles.plainTranscript}
						currentResultIndex={currentResultIndex}
						searchResults={searchResults}
						textType="transcript"
					/>
				) : (
					<Text style={styles.plainTranscript}>{transcriptText}</Text>
				)}
			</View>

			{/* SpeakerLabelModal */}
			<SpeakerLabelModal
				visible={isSpeakerModalVisible}
				onClose={handleCloseSpeakerModal}
				onSubmit={handleSubmitSpeakerLabels}
				speakers={getSpeakerIds()}
				initialMappings={speakerLabels}
			/>
		</View>
	);
}

export default TranscriptDisplay;
