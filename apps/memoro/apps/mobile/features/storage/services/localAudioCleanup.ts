import AsyncStorage from '@react-native-async-storage/async-storage';
import { fileStorageService } from '../fileStorage.service';
import { userSettingsService } from '~/features/settings/services/userSettingsService';

const CLEANUP_INTERVAL_KEY = 'last_local_audio_cleanup';
const MIN_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Runs local audio file cleanup if the user has enabled auto-delete and
 * enough time has passed since the last cleanup.
 *
 * This deletes local audio files older than 30 days when the
 * `autoDeleteAudiosAfter30Days` setting is enabled.
 *
 * Should be called after successful authentication.
 */
export async function runLocalAudioCleanupIfNeeded(): Promise<void> {
	try {
		// Check if 24 hours have passed since last cleanup
		const lastCleanup = await AsyncStorage.getItem(CLEANUP_INTERVAL_KEY);
		const now = Date.now();

		if (lastCleanup && now - parseInt(lastCleanup, 10) < MIN_CLEANUP_INTERVAL_MS) {
			console.debug('[LocalCleanup] Skipping - ran recently');
			return;
		}

		// Fetch user settings
		const settings = await userSettingsService.getMemoroSettings();

		if (!settings?.autoDeleteAudiosAfter30Days) {
			console.debug('[LocalCleanup] Auto-delete disabled');
			return;
		}

		console.debug('[LocalCleanup] Starting cleanup (30-day retention)');

		// Run cleanup with 30-day retention
		fileStorageService.setConfig({ retentionPeriodDays: 30 });
		await fileStorageService.cleanupOldFiles();

		// Record cleanup time
		await AsyncStorage.setItem(CLEANUP_INTERVAL_KEY, now.toString());
		console.debug('[LocalCleanup] Completed');
	} catch (error) {
		console.debug('[LocalCleanup] Error:', error);
		// Don't throw - cleanup is non-critical
	}
}
