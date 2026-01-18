import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, lte, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { wateringSchedules, wateringLogs, plants } from '../db/schema';

@Injectable()
export class WateringService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async getUpcoming(userId: string) {
		const now = new Date();
		const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

		const schedules = await this.db
			.select({
				schedule: wateringSchedules,
				plant: plants,
			})
			.from(wateringSchedules)
			.innerJoin(plants, eq(wateringSchedules.plantId, plants.id))
			.where(
				and(
					eq(wateringSchedules.userId, userId),
					lte(wateringSchedules.nextWateringAt, threeDaysFromNow)
				)
			)
			.orderBy(wateringSchedules.nextWateringAt);

		return schedules.map(({ schedule, plant }) => {
			const nextWatering = schedule.nextWateringAt ? new Date(schedule.nextWateringAt) : null;
			const daysUntil = nextWatering
				? Math.ceil((nextWatering.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
				: 0;

			return {
				plantId: plant.id,
				plantName: plant.name,
				daysUntilWatering: daysUntil,
				isOverdue: daysUntil < 0,
				lastWateredAt: schedule.lastWateredAt,
				nextWateringAt: schedule.nextWateringAt,
			};
		});
	}

	async logWatering(plantId: string, userId: string, notes?: string) {
		// Verify plant ownership
		const [plant] = await this.db
			.select()
			.from(plants)
			.where(and(eq(plants.id, plantId), eq(plants.userId, userId)))
			.limit(1);

		if (!plant) {
			throw new NotFoundException('Plant not found');
		}

		const now = new Date();

		// Create watering log
		const [log] = await this.db
			.insert(wateringLogs)
			.values({
				plantId,
				userId,
				wateredAt: now,
				notes,
			})
			.returning();

		// Update or create watering schedule
		const [existingSchedule] = await this.db
			.select()
			.from(wateringSchedules)
			.where(eq(wateringSchedules.plantId, plantId))
			.limit(1);

		const frequencyDays = existingSchedule?.frequencyDays || plant.wateringFrequencyDays || 7;
		const nextWateringAt = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

		if (existingSchedule) {
			await this.db
				.update(wateringSchedules)
				.set({
					lastWateredAt: now,
					nextWateringAt,
					updatedAt: now,
				})
				.where(eq(wateringSchedules.id, existingSchedule.id));
		} else {
			await this.db.insert(wateringSchedules).values({
				plantId,
				userId,
				frequencyDays,
				lastWateredAt: now,
				nextWateringAt,
			});
		}

		return {
			success: true,
			log,
			nextWateringAt,
		};
	}

	async updateSchedule(plantId: string, userId: string, frequencyDays: number) {
		// Verify plant ownership
		const [plant] = await this.db
			.select()
			.from(plants)
			.where(and(eq(plants.id, plantId), eq(plants.userId, userId)))
			.limit(1);

		if (!plant) {
			throw new NotFoundException('Plant not found');
		}

		const [existingSchedule] = await this.db
			.select()
			.from(wateringSchedules)
			.where(eq(wateringSchedules.plantId, plantId))
			.limit(1);

		const now = new Date();

		if (existingSchedule) {
			const nextWateringAt = existingSchedule.lastWateredAt
				? new Date(
						new Date(existingSchedule.lastWateredAt).getTime() + frequencyDays * 24 * 60 * 60 * 1000
					)
				: new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

			await this.db
				.update(wateringSchedules)
				.set({
					frequencyDays,
					nextWateringAt,
					updatedAt: now,
				})
				.where(eq(wateringSchedules.id, existingSchedule.id));

			return { success: true, nextWateringAt };
		} else {
			const nextWateringAt = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

			await this.db.insert(wateringSchedules).values({
				plantId,
				userId,
				frequencyDays,
				nextWateringAt,
			});

			return { success: true, nextWateringAt };
		}
	}

	async getWateringHistory(plantId: string, userId: string) {
		const logs = await this.db
			.select()
			.from(wateringLogs)
			.where(and(eq(wateringLogs.plantId, plantId), eq(wateringLogs.userId, userId)))
			.orderBy(desc(wateringLogs.wateredAt))
			.limit(50);

		return logs;
	}
}
