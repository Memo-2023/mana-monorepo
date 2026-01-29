import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { preferences, type Preference, type NewPreference } from '../db/schema';

export interface UpdatePreferencesDto {
	emailEnabled?: boolean;
	pushEnabled?: boolean;
	quietHoursEnabled?: boolean;
	quietHoursStart?: string;
	quietHoursEnd?: string;
	timezone?: string;
	categoryPreferences?: Record<string, Record<string, boolean>>;
}

@Injectable()
export class PreferencesService {
	private readonly logger = new Logger(PreferencesService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

	async getByUserId(userId: string): Promise<Preference | null> {
		const [pref] = await this.db
			.select()
			.from(preferences)
			.where(eq(preferences.userId, userId))
			.limit(1);

		return pref || null;
	}

	async getOrCreate(userId: string): Promise<Preference> {
		const existingPref = await this.getByUserId(userId);

		if (existingPref) {
			return existingPref;
		}

		const [newPref] = await this.db
			.insert(preferences)
			.values({
				userId,
				emailEnabled: true,
				pushEnabled: true,
				quietHoursEnabled: false,
				timezone: 'Europe/Berlin',
			})
			.returning();

		this.logger.log(`Created default preferences for user ${userId}`);
		return newPref;
	}

	async update(userId: string, dto: UpdatePreferencesDto): Promise<Preference> {
		// First ensure preferences exist
		await this.getOrCreate(userId);

		const updateData: Partial<NewPreference> = {};

		if (dto.emailEnabled !== undefined) {
			updateData.emailEnabled = dto.emailEnabled;
		}
		if (dto.pushEnabled !== undefined) {
			updateData.pushEnabled = dto.pushEnabled;
		}
		if (dto.quietHoursEnabled !== undefined) {
			updateData.quietHoursEnabled = dto.quietHoursEnabled;
		}
		if (dto.quietHoursStart !== undefined) {
			updateData.quietHoursStart = dto.quietHoursStart;
		}
		if (dto.quietHoursEnd !== undefined) {
			updateData.quietHoursEnd = dto.quietHoursEnd;
		}
		if (dto.timezone !== undefined) {
			updateData.timezone = dto.timezone;
		}
		if (dto.categoryPreferences !== undefined) {
			updateData.categoryPreferences = dto.categoryPreferences;
		}

		updateData.updatedAt = new Date();

		const [updated] = await this.db
			.update(preferences)
			.set(updateData)
			.where(eq(preferences.userId, userId))
			.returning();

		this.logger.log(`Updated preferences for user ${userId}`);
		return updated;
	}

	async updateCategoryPreference(
		userId: string,
		appId: string,
		category: string,
		enabled: boolean
	): Promise<Preference> {
		const pref = await this.getOrCreate(userId);

		const categoryPrefs = pref.categoryPreferences || {};
		if (!categoryPrefs[appId]) {
			categoryPrefs[appId] = {};
		}
		categoryPrefs[appId][category] = enabled;

		return this.update(userId, { categoryPreferences: categoryPrefs });
	}

	isCategoryEnabled(pref: Preference, appId: string, category: string): boolean {
		if (!pref.categoryPreferences) {
			return true; // Default to enabled
		}

		const appPrefs = pref.categoryPreferences[appId];
		if (!appPrefs) {
			return true;
		}

		return appPrefs[category] !== false;
	}
}
