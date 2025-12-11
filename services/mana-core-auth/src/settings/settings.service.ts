import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { userSettings } from '../db/schema';
import {
	type UpdateGlobalSettingsDto,
	type UpdateAppOverrideDto,
	type UpdateDeviceAppSettingsDto,
	type GlobalSettings,
	type AppOverride,
	type DeviceAppSettings,
	type DeviceInfo,
	type UserSettingsResponse,
	type DevicesListResponse,
} from './dto';

// Default settings for new users
const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
	nav: { desktopPosition: 'top', sidebarCollapsed: false },
	theme: { mode: 'system', colorScheme: 'ocean', pinnedThemes: [] },
	locale: 'de',
};

@Injectable()
export class SettingsService {
	private readonly logger = new Logger(SettingsService.name);

	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Get user settings, creating defaults if they don't exist
	 */
	async getSettings(userId: string): Promise<UserSettingsResponse> {
		const db = this.getDb();

		// Try to get existing settings
		const [existing] = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId))
			.limit(1);

		if (existing) {
			return {
				globalSettings: existing.globalSettings as GlobalSettings,
				appOverrides: existing.appOverrides as Record<string, AppOverride>,
				deviceSettings: (existing.deviceSettings as Record<string, DeviceAppSettings>) || {},
			};
		}

		// Create default settings for new user
		const [created] = await db
			.insert(userSettings)
			.values({
				userId,
				globalSettings: DEFAULT_GLOBAL_SETTINGS,
				appOverrides: {},
				deviceSettings: {},
			})
			.returning();

		this.logger.debug(`Created default settings for user ${userId}`);

		return {
			globalSettings: created.globalSettings as GlobalSettings,
			appOverrides: created.appOverrides as Record<string, AppOverride>,
			deviceSettings: (created.deviceSettings as Record<string, DeviceAppSettings>) || {},
		};
	}

	/**
	 * Update global settings (merges with existing)
	 */
	async updateGlobalSettings(
		userId: string,
		dto: UpdateGlobalSettingsDto
	): Promise<UserSettingsResponse> {
		const db = this.getDb();

		// Get current settings
		const current = await this.getSettings(userId);

		// Deep merge the settings
		const updatedGlobal: GlobalSettings = {
			nav: { ...current.globalSettings.nav, ...dto.nav },
			theme: { ...current.globalSettings.theme, ...dto.theme },
			locale: dto.locale ?? current.globalSettings.locale,
		};

		// Update in database
		const [updated] = await db
			.update(userSettings)
			.set({
				globalSettings: updatedGlobal,
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		this.logger.debug(`Updated global settings for user ${userId}`);

		return {
			globalSettings: updated.globalSettings as GlobalSettings,
			appOverrides: updated.appOverrides as Record<string, AppOverride>,
			deviceSettings: (updated.deviceSettings as Record<string, DeviceAppSettings>) || {},
		};
	}

	/**
	 * Update or create app-specific override
	 */
	async updateAppOverride(
		userId: string,
		appId: string,
		dto: UpdateAppOverrideDto
	): Promise<UserSettingsResponse> {
		const db = this.getDb();

		// Get current settings
		const current = await this.getSettings(userId);

		// Merge with existing app override
		const existingOverride = current.appOverrides[appId] || {};
		const updatedOverride: AppOverride = {
			nav: dto.nav ? { ...existingOverride.nav, ...dto.nav } : existingOverride.nav,
			theme: dto.theme ? { ...existingOverride.theme, ...dto.theme } : existingOverride.theme,
		};

		// Clean up empty objects
		if (updatedOverride.nav && Object.keys(updatedOverride.nav).length === 0) {
			delete updatedOverride.nav;
		}
		if (updatedOverride.theme && Object.keys(updatedOverride.theme).length === 0) {
			delete updatedOverride.theme;
		}

		// Update app overrides
		const updatedOverrides = { ...current.appOverrides };
		if (Object.keys(updatedOverride).length > 0) {
			updatedOverrides[appId] = updatedOverride;
		} else {
			delete updatedOverrides[appId];
		}

		// Update in database
		const [updated] = await db
			.update(userSettings)
			.set({
				appOverrides: updatedOverrides,
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		this.logger.debug(`Updated app override for user ${userId}, app ${appId}`);

		return {
			globalSettings: updated.globalSettings as GlobalSettings,
			appOverrides: updated.appOverrides as Record<string, AppOverride>,
			deviceSettings: (updated.deviceSettings as Record<string, DeviceAppSettings>) || {},
		};
	}

	/**
	 * Remove app-specific override (revert to global settings)
	 */
	async removeAppOverride(userId: string, appId: string): Promise<UserSettingsResponse> {
		const db = this.getDb();

		// Get current settings
		const current = await this.getSettings(userId);

		// Remove the app override
		const updatedOverrides = { ...current.appOverrides };
		delete updatedOverrides[appId];

		// Update in database
		const [updated] = await db
			.update(userSettings)
			.set({
				appOverrides: updatedOverrides,
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		this.logger.debug(`Removed app override for user ${userId}, app ${appId}`);

		return {
			globalSettings: updated.globalSettings as GlobalSettings,
			appOverrides: updated.appOverrides as Record<string, AppOverride>,
			deviceSettings: (updated.deviceSettings as Record<string, DeviceAppSettings>) || {},
		};
	}

	// ============================================================================
	// Device Settings Methods
	// ============================================================================

	/**
	 * Get list of all devices for a user
	 */
	async getDevices(userId: string): Promise<DevicesListResponse> {
		const current = await this.getSettings(userId);
		const deviceSettings = current.deviceSettings || {};

		const devices: DeviceInfo[] = Object.entries(deviceSettings).map(([deviceId, device]) => ({
			deviceId,
			deviceName: device.deviceName || 'Unbekanntes Gerät',
			deviceType: device.deviceType || 'desktop',
			lastSeen: device.lastSeen || new Date().toISOString(),
			appCount: Object.keys(device.apps || {}).length,
		}));

		// Sort by lastSeen descending
		devices.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

		return { devices };
	}

	/**
	 * Get settings for a specific device and app
	 */
	async getDeviceAppSettings(
		userId: string,
		deviceId: string,
		appId: string
	): Promise<Record<string, unknown>> {
		const current = await this.getSettings(userId);
		const deviceSettings = current.deviceSettings || {};
		const device = deviceSettings[deviceId];

		if (!device || !device.apps || !device.apps[appId]) {
			return {};
		}

		return device.apps[appId];
	}

	/**
	 * Update settings for a specific device and app
	 */
	async updateDeviceAppSettings(
		userId: string,
		deviceId: string,
		appId: string,
		dto: UpdateDeviceAppSettingsDto
	): Promise<UserSettingsResponse> {
		const db = this.getDb();

		// Get current settings
		const current = await this.getSettings(userId);
		const deviceSettings = { ...(current.deviceSettings || {}) };

		// Get or create device entry
		const existingDevice = deviceSettings[deviceId] || {
			deviceName: dto.deviceName || 'Unbekanntes Gerät',
			deviceType: dto.deviceType || 'desktop',
			lastSeen: new Date().toISOString(),
			apps: {},
		};

		// Update device info if provided
		const updatedDevice: DeviceAppSettings = {
			deviceName: dto.deviceName || existingDevice.deviceName,
			deviceType: dto.deviceType || existingDevice.deviceType,
			lastSeen: new Date().toISOString(),
			apps: {
				...existingDevice.apps,
				[appId]: {
					...(existingDevice.apps?.[appId] || {}),
					...dto.settings,
				},
			},
		};

		deviceSettings[deviceId] = updatedDevice;

		// Update in database
		const [updated] = await db
			.update(userSettings)
			.set({
				deviceSettings,
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		this.logger.debug(
			`Updated device settings for user ${userId}, device ${deviceId}, app ${appId}`
		);

		return {
			globalSettings: updated.globalSettings as GlobalSettings,
			appOverrides: updated.appOverrides as Record<string, AppOverride>,
			deviceSettings: (updated.deviceSettings as Record<string, DeviceAppSettings>) || {},
		};
	}

	/**
	 * Remove a device entirely
	 */
	async removeDevice(userId: string, deviceId: string): Promise<UserSettingsResponse> {
		const db = this.getDb();

		// Get current settings
		const current = await this.getSettings(userId);
		const deviceSettings = { ...(current.deviceSettings || {}) };

		// Remove the device
		delete deviceSettings[deviceId];

		// Update in database
		const [updated] = await db
			.update(userSettings)
			.set({
				deviceSettings,
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		this.logger.debug(`Removed device ${deviceId} for user ${userId}`);

		return {
			globalSettings: updated.globalSettings as GlobalSettings,
			appOverrides: updated.appOverrides as Record<string, AppOverride>,
			deviceSettings: (updated.deviceSettings as Record<string, DeviceAppSettings>) || {},
		};
	}

	/**
	 * Remove app settings from a specific device
	 */
	async removeDeviceAppSettings(
		userId: string,
		deviceId: string,
		appId: string
	): Promise<UserSettingsResponse> {
		const db = this.getDb();

		// Get current settings
		const current = await this.getSettings(userId);
		const deviceSettings = { ...(current.deviceSettings || {}) };

		if (deviceSettings[deviceId]?.apps) {
			const device = { ...deviceSettings[deviceId] };
			const apps = { ...device.apps };
			delete apps[appId];
			device.apps = apps;
			device.lastSeen = new Date().toISOString();
			deviceSettings[deviceId] = device;
		}

		// Update in database
		const [updated] = await db
			.update(userSettings)
			.set({
				deviceSettings,
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		this.logger.debug(`Removed app ${appId} settings from device ${deviceId} for user ${userId}`);

		return {
			globalSettings: updated.globalSettings as GlobalSettings,
			appOverrides: updated.appOverrides as Record<string, AppOverride>,
			deviceSettings: (updated.deviceSettings as Record<string, DeviceAppSettings>) || {},
		};
	}
}
