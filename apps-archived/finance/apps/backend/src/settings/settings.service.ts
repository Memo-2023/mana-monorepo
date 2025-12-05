import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { userSettings } from '../db/schema';
import { UpdateSettingsDto } from './dto';

const DEFAULT_SETTINGS = {
	defaultCurrency: 'EUR',
	locale: 'de-DE',
	dateFormat: 'dd.MM.yyyy',
	weekStartsOn: 1, // Monday
};

@Injectable()
export class SettingsService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async get(userId: string) {
		const [settings] = await this.db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId));

		if (!settings) {
			// Create default settings
			const [newSettings] = await this.db
				.insert(userSettings)
				.values({
					userId,
					...DEFAULT_SETTINGS,
				})
				.returning();
			return newSettings;
		}

		return settings;
	}

	async update(userId: string, dto: UpdateSettingsDto) {
		// Ensure settings exist
		await this.get(userId);

		const [settings] = await this.db
			.update(userSettings)
			.set({
				...(dto.defaultCurrency !== undefined && { defaultCurrency: dto.defaultCurrency }),
				...(dto.locale !== undefined && { locale: dto.locale }),
				...(dto.dateFormat !== undefined && { dateFormat: dto.dateFormat }),
				...(dto.weekStartsOn !== undefined && { weekStartsOn: dto.weekStartsOn }),
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		return settings;
	}
}
