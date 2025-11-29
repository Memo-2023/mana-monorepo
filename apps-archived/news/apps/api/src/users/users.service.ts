import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { Database, users, User, eq } from '@manacore/news-database';

@Injectable()
export class UsersService {
	constructor(@Inject(DATABASE_CONNECTION) private database: Database) {}

	async getUserById(userId: string): Promise<User | null> {
		const [user] = await this.database.select().from(users).where(eq(users.id, userId)).limit(1);

		return user || null;
	}

	async updateUser(
		userId: string,
		data: {
			name?: string;
			preferredCategories?: string[];
			blockedSources?: string[];
			readingSpeed?: 'slow' | 'normal' | 'fast';
			notificationSettings?: string;
			onboardingCompleted?: boolean;
		}
	): Promise<User> {
		const [user] = await this.database
			.update(users)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId))
			.returning();

		return user;
	}

	async completeOnboarding(userId: string): Promise<void> {
		await this.database
			.update(users)
			.set({
				onboardingCompleted: true,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));
	}
}
