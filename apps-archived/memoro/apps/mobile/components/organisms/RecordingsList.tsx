import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useToast } from '~/features/toast/contexts/ToastContext';
import { analyzeNetworkErrorSync } from '~/features/errorHandling/utils/networkErrorUtils';
import { AudioFile } from '~/features/storage/storage.types';
import { authService } from '~/features/auth/services/authService';
import { cloudStorageService } from '~/features/storage/cloudStorage.service';
import { fileStorageService } from '~/features/storage/fileStorage.service';
import { triggerTranscription } from '~/features/storage/transcriptionUtils';
import { useUploadStatusStore } from '~/features/storage/store/uploadStatusStore';
import {
	UploadStatus,
	type AudioFileWithUploadStatus,
} from '~/features/storage/uploadStatus.types';
import AudioPlayer from './AudioPlayer';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import Button from '~/components/atoms/Button';
import LoadingOverlay from '~/components/atoms/LoadingOverlay';
import Divider from '~/components/atoms/Divider';
import ArchiveStatistics from '~/components/molecules/ArchiveStatistics';
import UploadStatusBadge from '~/components/atoms/UploadStatusBadge';

interface RecordingsListProps {
	onRecordingSelected?: (recording: AudioFile) => void;
}

/**
 * Komponente zur Anzeige einer Liste von Audioaufnahmen
 */
const RecordingsList = ({ onRecordingSelected }: RecordingsListProps) => {
	const { t, i18n } = useTranslation();
	const { isDark, themeVariant } = useTheme();
	const { showSuccess, showError } = useToast();
	const [recordings, setRecordings] = useState<AudioFile[]>([]);
	const [enrichedRecordings, setEnrichedRecordings] = useState<AudioFileWithUploadStatus[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
	const [reuploadingIds, setReuploadingIds] = useState<Set<string>>(new Set());
	const [showReuploadLoading, setShowReuploadLoading] = useState(false);
	const [totalCount, setTotalCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);
	const [loadingMore, setLoadingMore] = useState(false);
	const [archiveStats, setArchiveStats] = useState<{
		totalCount: number;
		totalDurationSeconds: number;
		totalSizeBytes: number;
	} | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const itemsPerPage = 3;

	// Initialize and use upload status store
	const {
		initialize: initUploadStatus,
		enrichAudioFiles,
		getStatus,
		updateStatus,
		removeStatus,
		isInitialized: uploadStatusInitialized,
	} = useUploadStatusStore();

	// Subscribe to statusMap changes to trigger re-enrichment when upload status updates
	const statusMap = useUploadStatusStore((state) => state.statusMap);

	// Lade die Aufnahmen
	const loadRecordings = useCallback(
		async (page: number = 0, append: boolean = false) => {
			try {
				if (page === 0) {
					setIsLoading(true);
				} else {
					setLoadingMore(true);
				}

				const offset = page * itemsPerPage;
				const [audioFiles, count] = await Promise.all([
					fileStorageService.getAllRecordings(itemsPerPage, offset),
					page === 0 ? fileStorageService.getRecordingsCount() : Promise.resolve(totalCount),
				]);

				if (append) {
					setRecordings((prev) => [...prev, ...audioFiles]);
				} else {
					setRecordings(audioFiles);
				}

				if (page === 0) {
					setTotalCount(count);
					setCurrentPage(0);
				} else {
					setCurrentPage(page);
				}
			} catch (error) {
				console.debug('Error loading recordings:', error);
			} finally {
				setIsLoading(false);
				setLoadingMore(false);
				setRefreshing(false);
			}
		},
		[itemsPerPage, totalCount]
	);

	// Lade die Archiv-Statistiken
	const loadArchiveStats = useCallback(async () => {
		try {
			setStatsLoading(true);
			const stats = await fileStorageService.getArchiveStatistics();
			setArchiveStats(stats);
		} catch (error) {
			console.debug('Error loading archive statistics:', error);
		} finally {
			setStatsLoading(false);
		}
	}, []);

	// Initialize upload status store
	useEffect(() => {
		initUploadStatus();
	}, [initUploadStatus]);

	// Enrich recordings with upload status
	// Re-enrich whenever recordings change OR when statusMap changes (i.e., upload status updates)
	useEffect(() => {
		if (uploadStatusInitialized && recordings.length > 0) {
			const enriched = enrichAudioFiles(recordings);
			setEnrichedRecordings(enriched);
		} else {
			setEnrichedRecordings([]);
		}
	}, [recordings, uploadStatusInitialized, enrichAudioFiles, statusMap]);

	// Lade die Aufnahmen beim ersten Rendern
	useEffect(() => {
		loadRecordings();
		loadArchiveStats();
	}, [loadRecordings, loadArchiveStats]);

	// Behandle das Löschen einer Aufnahme
	const handleDelete = async (recording: AudioFile) => {
		try {
			const success = await fileStorageService.deleteRecording(recording);
			if (success) {
				// Remove upload status for this recording
				await removeStatus(recording.id);

				// Aktualisiere die Liste nach dem Löschen
				setRecordings((prevRecordings) => prevRecordings.filter((rec) => rec.id !== recording.id));

				// Zeige einen Erfolgs-Toast an
				showSuccess(t('audio_archive.delete_success', 'Aufnahme wurde erfolgreich gelöscht'));

				// Aktualisiere die Statistiken nach dem Löschen
				loadArchiveStats();
			}
		} catch (error) {
			console.debug('Error deleting recording:', error);
		}
	};

	// Behandle das Aktualisieren der Liste durch Ziehen
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadRecordings(0, false);
		loadArchiveStats();
	}, [loadRecordings, loadArchiveStats]);

	// Behandle das Laden weiterer Elemente
	const loadMore = useCallback(() => {
		const hasMore = recordings.length < totalCount;
		if (hasMore && !loadingMore && !isLoading) {
			const nextPage = currentPage + 1;
			loadRecordings(nextPage, true);
		}
	}, [recordings.length, totalCount, loadingMore, isLoading, currentPage, loadRecordings]);

	// Behandle Statusänderungen bei der Wiedergabe
	const handlePlayStatusChange = (uri: string, isPlaying: boolean) => {
		if (isPlaying) {
			setCurrentlyPlaying(uri);
		} else if (currentlyPlaying === uri) {
			setCurrentlyPlaying(null);
		}
	};

	// Formatiere das Datum für die Anzeige
	const formatDate = (date: Date): string => {
		const dateStr = date.toLocaleDateString(i18n.language, {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});

		const langCode = i18n.language.split('-')[0];
		const is12Hour = ['en', 'hi', 'ur', 'tl', 'ms'].includes(langCode);
		const timeStr = date.toLocaleTimeString(i18n.language, {
			hour: '2-digit',
			minute: '2-digit',
			hour12: is12Hour,
		});

		// Apply language-specific time formatting
		let timeWithSuffix = timeStr;
		if (langCode === 'de') timeWithSuffix = `${timeStr} Uhr`;
		else if (langCode === 'nl') timeWithSuffix = `${timeStr} uur`;
		else if (langCode === 'da') timeWithSuffix = `kl. ${timeStr.replace(':', '.')}`;
		else if (langCode === 'sv') timeWithSuffix = `kl. ${timeStr}`;
		else if (langCode === 'fr') timeWithSuffix = timeStr.replace(':', 'h');
		else if (langCode === 'bg') timeWithSuffix = `${timeStr} ч.`;
		else if (langCode === 'lt') timeWithSuffix = `${timeStr} val.`;
		else if (langCode === 'fi') timeWithSuffix = `klo ${timeStr.replace(':', '.')}`;
		else if (langCode === 'th') timeWithSuffix = `${timeStr} น.`;
		else if (langCode === 'id') timeWithSuffix = timeStr.replace(':', '.');

		return `${dateStr}, ${timeWithSuffix}`;
	};

	// Funktion zum erneuten Hochladen einer Audiodatei
	const handleReupload = async (recording: AudioFileWithUploadStatus) => {
		// Check if already uploaded or currently uploading
		if (recording.uploadStatus === UploadStatus.SUCCESS) {
			showError(t('audio_archive.already_uploaded', 'This recording has already been uploaded.'));
			return;
		}

		if (
			recording.uploadStatus === UploadStatus.UPLOADING ||
			recording.uploadStatus === UploadStatus.PENDING
		) {
			showError(t('audio_archive.upload_in_progress', 'Upload is already in progress or pending.'));
			return;
		}

		// Setze Loading-State für diese spezifische Aufnahme
		setReuploadingIds((prev) => new Set(prev.add(recording.id)));
		setShowReuploadLoading(true);

		// Update status to UPLOADING
		await updateStatus(recording.id, UploadStatus.UPLOADING, {
			lastAttemptAt: Date.now(),
		});

		try {
			// Prüfen, ob der Benutzer angemeldet ist
			const userData = await authService.getUserFromToken();
			if (!userData) {
				Alert.alert(
					t('common.error', 'Fehler'),
					t(
						'audio_archive.login_required',
						'Du musst angemeldet sein, um Audiodateien hochzuladen.'
					)
				);
				return;
			}

			// Hochladen zur Cloud-Speicherung mit der Benutzer-ID aus dem Auth-Kontext
			const uploadResult = await cloudStorageService.uploadAudioForProcessing({
				userId: userData.id,
				filePath: recording.uri,
				fileName: recording.filename,
				durationMillis: recording.duration * 1000, // Umrechnung in Millisekunden
			});

			console.debug('Upload result:', uploadResult);

			if (uploadResult.success) {
				// Trigger the transcription process using our utility function
				const transcriptionResult = await triggerTranscription({
					userId: userData.id,
					fileName: recording.filename,
					duration: recording.duration,
					showAlerts: false, // We'll handle errors manually to show network toasts
					t,
				});

				// Handle transcription result
				if (!transcriptionResult.success) {
					// Update status to FAILED
					await updateStatus(recording.id, UploadStatus.FAILED, {
						lastError: transcriptionResult.userMessage,
						isNetworkError: transcriptionResult.isNetworkError,
					});

					if (transcriptionResult.isNetworkError) {
						showError(
							t(
								'audio_archive.upload_failed_with_archive_hint',
								'Upload failed. Your recording is safely stored in the Audio Archive where you can retry the upload later.'
							)
						);
					} else {
						Alert.alert(
							t('common.error', 'Fehler'),
							transcriptionResult.userMessage ||
								t(
									'audio_archive.transcription_start_error',
									'Die Transkription konnte nicht gestartet werden.'
								)
						);
					}
				} else {
					// Update status to SUCCESS
					await updateStatus(recording.id, UploadStatus.SUCCESS, {
						uploadedAt: Date.now(),
					});

					// Show success message
					Alert.alert(
						t('common.success', 'Erfolg'),
						t(
							'audio_archive.upload_success',
							'Die Audiodatei wurde hochgeladen und wird jetzt transkribiert. Du findest das Ergebnis in Kürze in deiner Memo-Liste.'
						)
					);
				}
			} else {
				// Update status to FAILED
				await updateStatus(recording.id, UploadStatus.FAILED, {
					lastError: uploadResult.userMessage,
					isNetworkError: uploadResult.isNetworkError,
				});

				// Check if it's a network error and show appropriate message
				if (uploadResult.isNetworkError) {
					showError(
						t(
							'audio_archive.upload_failed_with_archive_hint',
							'Upload failed. Your recording is safely stored in the Audio Archive where you can retry the upload later.'
						)
					);
				} else {
					Alert.alert(
						t('common.error', 'Fehler'),
						t(
							'audio_archive.upload_error',
							'Beim Hochladen der Audiodatei ist ein Fehler aufgetreten.'
						)
					);
				}
			}
		} catch (error) {
			console.debug('Error reuploading audio:', error);

			// Check if it's a network error
			const networkErrorInfo = analyzeNetworkErrorSync(error);

			// Update status to FAILED
			await updateStatus(recording.id, UploadStatus.FAILED, {
				lastError: networkErrorInfo.userMessage,
				isNetworkError: networkErrorInfo.isNetworkError,
			});

			if (networkErrorInfo.isNetworkError) {
				showError(
					t(
						'audio_archive.upload_failed_with_archive_hint',
						'Upload failed. Your recording is safely stored in the Audio Archive where you can retry the upload later.'
					)
				);
			} else {
				Alert.alert(
					t('common.error', 'Fehler'),
					t(
						'audio_archive.reupload_error',
						'Beim erneuten Hochladen der Audiodatei ist ein Fehler aufgetreten.'
					)
				);
			}
		} finally {
			// Entferne Loading-State für diese spezifische Aufnahme
			setReuploadingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(recording.id);
				return newSet;
			});
			setShowReuploadLoading(false);
		}
	};

	// Render-Funktion für ein einzelnes Listenelement
	const renderItem = ({ item }: { item: AudioFileWithUploadStatus }) => {
		const formattedDate = formatDate(item.createdAt);
		const formattedDuration = fileStorageService.formatDuration(item.duration);
		const title = t('audio_archive.recording', 'Aufnahme');
		const isUploading = reuploadingIds.has(item.id) || item.uploadStatus === UploadStatus.UPLOADING;
		const canRetry =
			item.uploadStatus === UploadStatus.FAILED || item.uploadStatus === UploadStatus.NOT_UPLOADED;

		// Determine button text based on status
		let buttonTitle = t('audio_archive.upload', 'Hochladen');
		if (isUploading) {
			buttonTitle = t('audio_archive.uploading', 'Lädt hoch...');
		} else if (item.uploadStatus === UploadStatus.PENDING) {
			buttonTitle = t('audio_archive.queued', 'In Warteschlange');
		} else if (item.uploadStatus === UploadStatus.FAILED) {
			buttonTitle = t('audio_archive.retry_upload', 'Erneut hochladen');
		}

		return (
			<View style={styles.itemContainer}>
				<AudioPlayer
					audioUri={item.uri}
					headlineText={title}
					dateText={formattedDate}
					durationText={formattedDuration}
					fileSizeBytes={item.size}
					onDelete={() => handleDelete(item)}
					onPlayStatusChange={(isPlaying) => handlePlayStatusChange(item.uri, isPlaying)}
					showCopyButton={false}
				/>

				{/* Upload Status Badge */}
				<View style={styles.statusRow}>
					<UploadStatusBadge
						status={item.uploadStatus}
						attemptCount={item.uploadMetadata?.attemptCount || 0}
						size="medium"
						showLabel
					/>
				</View>

				{/* Upload/Retry Button - only show if not SUCCESS */}
				{item.uploadStatus !== UploadStatus.SUCCESS && (
					<Button
						title={buttonTitle}
						variant={item.uploadStatus === UploadStatus.FAILED ? 'secondary' : 'primary'}
						iconName={isUploading ? 'cloud-upload' : 'cloud-upload-outline'}
						onPress={() => handleReupload(item)}
						style={styles.reuploadButton}
						disabled={
							isUploading ||
							item.uploadStatus === UploadStatus.PENDING ||
							item.uploadStatus === UploadStatus.UPLOADING
						}
						loading={isUploading}
					/>
				)}
				<Divider spacing="large" />
			</View>
		);
	};

	// Farben aus dem Theme-System
	const textColor = isDark ? '#FFFFFF' : '#000000';

	// Render-Funktion für leere Liste
	const renderEmptyList = () => {
		if (isLoading) {
			return (
				<View style={styles.emptyContainer}>
					<ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
					<Text style={[styles.emptyText, { color: textColor }]}>
						{t('audio_archive.loading', 'Aufnahmen werden geladen...')}
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.emptyContainer}>
				<Icon name="mic-off" size={48} color={textColor} />
				<Text style={[styles.emptyText, { color: textColor }]}>
					{t('audio_archive.no_recordings', 'Keine Aufnahmen vorhanden')}
				</Text>
				<Text style={[styles.emptySubtext, { color: textColor }]}>
					{t(
						'audio_archive.record_prompt',
						'Drücke den Aufnahme-Button, um dein erstes Memo aufzunehmen'
					)}
				</Text>
			</View>
		);
	};

	// Render-Funktion für "Mehr laden" Button
	const renderLoadMoreButton = () => {
		const hasMore = recordings.length < totalCount;

		if (!hasMore) {
			return (
				<View style={styles.loadMoreContainer}>
					<Text style={[styles.loadMoreText, { color: textColor }]}>
						{t('audio_archive.all_loaded', 'Alle {{totalCount}} Aufnahmen geladen', { totalCount })}
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.loadMoreContainer}>
				<Button
					title={
						loadingMore
							? t('audio_archive.loading_more', 'Lädt mehr...')
							: t('audio_archive.load_more_simple', 'Weitere laden')
					}
					variant="secondary"
					iconName={loadingMore ? 'reload1' : 'arrow-down'}
					onPress={loadMore}
					disabled={loadingMore}
					loading={loadingMore}
					style={styles.loadMoreButton}
				/>
			</View>
		);
	};

	const styles = StyleSheet.create({
		container: {
			flex: 1,
		},
		itemContainer: {
			marginBottom: 16,
			paddingHorizontal: 16,
		},
		statusRow: {
			marginTop: 12,
			marginBottom: 8,
			flexDirection: 'row',
			alignItems: 'center',
		},
		emptyContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 20,
		},
		emptyText: {
			fontSize: 18,
			fontWeight: 'bold',
			marginTop: 16,
			textAlign: 'center',
		},
		emptySubtext: {
			fontSize: 14,
			marginTop: 8,
			textAlign: 'center',
			opacity: 0.7,
		},
		reuploadButton: {
			marginTop: 8,
			width: '100%',
		},
		loadMoreContainer: {
			padding: 16,
			alignItems: 'center',
		},
		loadMoreButton: {
			width: '100%',
			maxWidth: 300,
		},
		loadMoreText: {
			fontSize: 14,
			opacity: 0.7,
			textAlign: 'center',
		},
	});

	// Render-Funktion für den Header mit Statistiken
	const renderListHeader = () => {
		return (
			<ArchiveStatistics
				totalCount={archiveStats?.totalCount || 0}
				totalDurationSeconds={archiveStats?.totalDurationSeconds || 0}
				totalSizeBytes={archiveStats?.totalSizeBytes || 0}
				isLoading={statsLoading}
			/>
		);
	};

	return (
		<View style={styles.container}>
			<FlatList
				data={enrichedRecordings}
				renderItem={renderItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ flexGrow: 1 }}
				ListHeaderComponent={renderListHeader}
				ListEmptyComponent={renderEmptyList}
				ListFooterComponent={enrichedRecordings.length > 0 ? renderLoadMoreButton : null}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={[isDark ? '#FFFFFF' : '#000000']}
						tintColor={isDark ? '#FFFFFF' : '#000000'}
					/>
				}
				removeClippedSubviews={true}
				windowSize={10}
				initialNumToRender={5}
				maxToRenderPerBatch={5}
				updateCellsBatchingPeriod={50}
				getItemLayout={(data, index) => ({
					length: 120, // Estimated item height
					offset: 120 * index,
					index,
				})}
			/>

			<LoadingOverlay
				visible={showReuploadLoading}
				message={t(
					'audio_archive.uploading_processing',
					'Audiodatei wird hochgeladen und verarbeitet...'
				)}
				modal={true}
				size="large"
			/>
		</View>
	);
};

export default RecordingsList;
