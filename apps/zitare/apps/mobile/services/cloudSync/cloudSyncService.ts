import { Platform } from 'react-native';
import { iCloudSyncService } from './iCloudSync';
import { GoogleDriveSyncService } from './googleDriveSync';

export interface CloudSyncData {
	favorites: string[];
	favoriteAuthors: string[];
	userQuotes: any[];
	settings: any;
	viewHistory: string[];
	exportDate: string;
	version: string;
	deviceId: string;
}

export class CloudSyncService {
	static async initialize() {
		if (Platform.OS === 'android') {
			await GoogleDriveSyncService.initialize();
		}
	}

	static async authenticate(): Promise<boolean> {
		if (Platform.OS === 'ios') {
			// iCloud uses system authentication
			return true;
		} else if (Platform.OS === 'android') {
			return await GoogleDriveSyncService.authenticate();
		}
		return false;
	}

	static async exportData(data: CloudSyncData): Promise<boolean> {
		try {
			if (Platform.OS === 'ios') {
				return await iCloudSyncService.exportToiCloud(data);
			} else if (Platform.OS === 'android') {
				return await GoogleDriveSyncService.exportToGoogleDrive(data);
			}
			return false;
		} catch (error) {
			console.error('Export data error:', error);
			return false;
		}
	}

	static async importData(): Promise<CloudSyncData | null> {
		try {
			if (Platform.OS === 'ios') {
				return await iCloudSyncService.importFromiCloud();
			} else if (Platform.OS === 'android') {
				return await GoogleDriveSyncService.importFromGoogleDrive();
			}
			return null;
		} catch (error) {
			console.error('Import data error:', error);
			return null;
		}
	}

	static async getDeviceId(): Promise<string> {
		try {
			return Platform.OS + '-' + Date.now();
		} catch (error) {
			return 'unknown-device';
		}
	}
}
