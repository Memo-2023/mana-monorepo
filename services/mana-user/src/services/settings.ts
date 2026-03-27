/**
 * Settings Service — User preferences, theme, nav, device settings
 */

import { eq } from 'drizzle-orm';
import { userSettings } from '../db/schema/settings';
import type { Database } from '../db/connection';

export class SettingsService {
	constructor(private db: Database) {}

	async getSettings(userId: string) {
		const [settings] = await this.db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId))
			.limit(1);

		if (!settings) return this.initializeSettings(userId);
		return settings;
	}

	async initializeSettings(userId: string) {
		const [settings] = await this.db
			.insert(userSettings)
			.values({ userId })
			.onConflictDoNothing()
			.returning();

		if (!settings) {
			// Already exists, fetch it
			const [existing] = await this.db
				.select()
				.from(userSettings)
				.where(eq(userSettings.userId, userId))
				.limit(1);
			return existing;
		}
		return settings;
	}

	async updateGlobalSettings(userId: string, updates: Record<string, unknown>) {
		const current = await this.getSettings(userId);
		const merged = { ...(current.globalSettings as Record<string, unknown>), ...updates };

		const [updated] = await this.db
			.update(userSettings)
			.set({ globalSettings: merged, updatedAt: new Date() })
			.where(eq(userSettings.userId, userId))
			.returning();

		return updated;
	}

	async updateAppOverride(userId: string, appId: string, overrides: Record<string, unknown>) {
		const current = await this.getSettings(userId);
		const appOverrides = { ...(current.appOverrides as Record<string, unknown>) };
		appOverrides[appId] = {
			...((appOverrides[appId] as Record<string, unknown>) || {}),
			...overrides,
		};

		const [updated] = await this.db
			.update(userSettings)
			.set({ appOverrides, updatedAt: new Date() })
			.where(eq(userSettings.userId, userId))
			.returning();

		return updated;
	}

	async updateDeviceSettings(userId: string, deviceId: string, settings: Record<string, unknown>) {
		const current = await this.getSettings(userId);
		const deviceSettings = { ...(current.deviceSettings as Record<string, unknown>) };
		deviceSettings[deviceId] = {
			...((deviceSettings[deviceId] as Record<string, unknown>) || {}),
			...settings,
		};

		const [updated] = await this.db
			.update(userSettings)
			.set({ deviceSettings, updatedAt: new Date() })
			.where(eq(userSettings.userId, userId))
			.returning();

		return updated;
	}

	async deleteSettings(userId: string) {
		await this.db.delete(userSettings).where(eq(userSettings.userId, userId));
	}
}
