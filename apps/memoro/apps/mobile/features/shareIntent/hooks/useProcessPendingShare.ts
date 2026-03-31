import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '~/features/auth/contexts/AuthContext';
import { useToast } from '~/features/toast/contexts/ToastContext';
import { fileStorageService } from '~/features/storage/fileStorage.service';
import { useShareIntentStore } from '../store/shareIntentStore';
import type { ShareIntentFile } from '../store/shareIntentStore';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp'];

function getExtension(filename: string): string {
	return filename.split('.').pop()?.toLowerCase() || '';
}

async function processSharedFile(file: ShareIntentFile): Promise<boolean> {
	try {
		const ext = getExtension(file.name);
		const isVideo = VIDEO_EXTENSIONS.includes(ext);

		// saveRecording accepts optional duration in seconds — skip duration detection if we have it
		const durationSeconds = file.durationMs ? Math.floor(file.durationMs / 1000) : undefined;
		const audioFile = await fileStorageService.saveRecording(file.uri, file.name, durationSeconds);
		if (!audioFile) {
			console.error('[ShareIntent] Failed to save file:', file.name);
			return false;
		}

		// If duration is still missing, set a fallback so upload doesn't fail — server determines actual duration
		if (!audioFile.duration || audioFile.duration <= 0) {
			audioFile.duration = 1;
		}

		const result = await fileStorageService.uploadForTranscription(
			audioFile,
			undefined, // memoId
			undefined, // spaceId
			null, // blueprintId
			[], // recordingLanguagesOverride — auto-detect
			undefined, // recordingStartedAt
			undefined, // enableDiarization
			undefined, // skipOfflineQueue
			false, // appendToMemo
			isVideo ? 'video' : 'audio'
		);

		return !!result;
	} catch (error) {
		console.error('[ShareIntent] Error processing file:', file.name, error);
		return false;
	}
}

export function useProcessPendingShare() {
	const { isAuthenticated } = useAuth();
	const { showLoading, updateToast, hideToast, showSuccess, showError } = useToast();
	const pendingIntent = useShareIntentStore((s) => s.pendingIntent);
	const isProcessing = useShareIntentStore((s) => s.isProcessing);
	const clear = useShareIntentStore((s) => s.clear);
	const setIsProcessing = useShareIntentStore((s) => s.setIsProcessing);
	const processingRef = useRef(false);

	useEffect(() => {
		if (!isAuthenticated || !pendingIntent || isProcessing || processingRef.current) return;

		// Discard stale intents
		if (Date.now() - pendingIntent.receivedAt > STALE_THRESHOLD_MS) {
			console.debug('[ShareIntent] Discarding stale intent');
			clear();
			return;
		}

		if (pendingIntent.type === 'file' && pendingIntent.files?.length) {
			processingRef.current = true;
			setIsProcessing(true);

			const files = pendingIntent.files;
			const toastId = showLoading(
				files.length === 1
					? 'Geteilte Datei wird verarbeitet...'
					: `${files.length} geteilte Dateien werden verarbeitet...`
			);

			(async () => {
				let successCount = 0;
				try {
					for (let i = 0; i < files.length; i++) {
						const file = files[i];
						console.debug(`[ShareIntent] Processing file ${i + 1}/${files.length}:`, file.name);

						if (files.length > 1 && toastId) {
							updateToast(toastId, {
								title: `Datei ${i + 1} von ${files.length} wird verarbeitet...`,
							});
						}

						const ok = await processSharedFile(file);
						if (ok) successCount++;
					}

					if (toastId) hideToast(toastId);

					if (successCount > 0) {
						showSuccess(
							successCount === 1
								? 'Geteilte Datei wird transkribiert'
								: `${successCount} Dateien werden transkribiert`
						);
					} else {
						showError('Fehler beim Verarbeiten der geteilten Datei');
					}
				} catch (error) {
					console.error('[ShareIntent] Error processing shared files:', error);
					if (toastId) hideToast(toastId);
					showError('Fehler beim Verarbeiten der geteilten Datei');
				} finally {
					clear();
					processingRef.current = false;
				}
			})();
		} else if (pendingIntent.type === 'text' || pendingIntent.type === 'url') {
			const content = pendingIntent.text || pendingIntent.webUrl || '';
			Alert.alert(
				'Geteilter Text',
				content.length > 200 ? content.substring(0, 200) + '...' : content,
				[
					{
						text: 'Kopieren',
						onPress: async () => {
							await Clipboard.setStringAsync(content);
							clear();
						},
					},
					{
						text: 'Abbrechen',
						style: 'cancel',
						onPress: () => clear(),
					},
				]
			);
		}
	}, [isAuthenticated, pendingIntent, isProcessing]);
}
