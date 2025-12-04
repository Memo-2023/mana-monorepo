import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { userSettings } from '../db/schema';
import {
	type UpdateGlobalSettingsDto,
	type UpdateAppOverrideDto,
	type GlobalSettings,
	type AppOverride,
	type UserSettingsResponse,
} from './dto';

// Default settings for new users
const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
	nav: { desktopPosition: 'top', sidebarCollapsed: false },
	theme: { mode: 'system', colorScheme: 'ocean' },
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
			};
		}

		// Create default settings for new user
		const [created] = await db
			.insert(userSettings)
			.values({
				userId,
				globalSettings: DEFAULT_GLOBAL_SETTINGS,
				appOverrides: {},
			})
			.returning();

		this.logger.debug(`Created default settings for user ${userId}`);

		return {
			globalSettings: created.globalSettings as GlobalSettings,
			appOverrides: created.appOverrides as Record<string, AppOverride>,
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
		};
	}
}
