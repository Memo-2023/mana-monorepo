import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { CloudSyncData } from './cloudSyncService';

export class iCloudSyncService {
	private static readonly BACKUP_FILENAME = 'zitare-backup.json';

	static async exportToiCloud(data: CloudSyncData): Promise<boolean> {
		if (Platform.OS !== 'ios') return false;

		try {
			// Create backup file in document directory
			const fileUri = (FileSystem.documentDirectory || '') + this.BACKUP_FILENAME;

			await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

			// Share to iCloud Drive using system share sheet
			if (await Sharing.isAvailableAsync()) {
				await Sharing.shareAsync(fileUri, {
					mimeType: 'application/json',
					dialogTitle: 'Backup in iCloud speichern',
					UTI: 'public.json',
				});
				return true;
			}

			return false;
		} catch (error) {
			console.error('iCloud export error:', error);
			return false;
		}
	}

	static async importFromiCloud(): Promise<CloudSyncData | null> {
		if (Platform.OS !== 'ios') return null;

		try {
			// Dynamically import DocumentPicker to avoid startup errors
			const DocumentPicker = await import('expo-document-picker');

			// Use document picker to select backup file from iCloud
			const result = await DocumentPicker.getDocumentAsync({
				type: 'application/json',
				copyToCacheDirectory: true,
				multiple: false,
			});

			if (result.canceled || !result.assets?.[0]) {
				return null;
			}

			const fileUri = result.assets[0].uri;
			const fileContent = await FileSystem.readAsStringAsync(fileUri);

			const backupData: CloudSyncData = JSON.parse(fileContent);

			// Validate backup structure
			if (!this.validateBackupData(backupData)) {
				throw new Error('Ungültiges Backup-Format');
			}

			return backupData;
		} catch (error) {
			console.error('iCloud import error:', error);
			return null;
		}
	}

	private static validateBackupData(data: any): data is CloudSyncData {
		return (
			data &&
			Array.isArray(data.favorites) &&
			Array.isArray(data.favoriteAuthors) &&
			Array.isArray(data.userQuotes) &&
			data.settings &&
			typeof data.settings === 'object' &&
			Array.isArray(data.viewHistory) &&
			typeof data.exportDate === 'string' &&
			typeof data.version === 'string'
		);
	}

	static async deleteBackup(fileUri: string): Promise<boolean> {
		try {
			const fileInfo = await FileSystem.getInfoAsync(fileUri);
			if (fileInfo.exists) {
				await FileSystem.deleteAsync(fileUri);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error deleting backup:', error);
			return false;
		}
	}
}
