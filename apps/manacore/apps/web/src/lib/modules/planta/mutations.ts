/**
 * Planta — Mutation Helpers (Local-First)
 *
 * All writes go to IndexedDB first, sync handles the rest.
 */

import { db } from '$lib/data/database';
import { toPlant, toWateringSchedule } from './queries';
import { trackEvent } from '@manacore/shared-utils/analytics';
import type {
	LocalPlant,
	LocalWateringSchedule,
	LocalWateringLog,
	Plant,
	CreatePlantDto,
	UpdatePlantDto,
} from './types';

export const plantMutations = {
	async create(dto: CreatePlantDto): Promise<Plant | null> {
		try {
			const now = new Date().toISOString();
			const newLocal: LocalPlant = {
				id: crypto.randomUUID(),
				name: dto.name,
				scientificName: dto.scientificName ?? null,
				commonName: dto.commonName ?? null,
				species: null,
				lightRequirements: null,
				wateringFrequencyDays: null,
				humidity: null,
				temperature: null,
				soilType: null,
				careNotes: null,
				isActive: true,
				healthStatus: null,
				acquiredAt: dto.acquiredAt ?? null,
				createdAt: now,
				updatedAt: now,
			};
			await db.table('plants').add(newLocal);
			trackEvent('plant_created');
			return toPlant(newLocal);
		} catch (e) {
			console.error('Failed to create plant:', e);
			return null;
		}
	},

	async update(id: string, dto: UpdatePlantDto): Promise<Plant | null> {
		try {
			const updateData: Record<string, unknown> = {
				updatedAt: new Date().toISOString(),
			};
			if (dto.name !== undefined) updateData.name = dto.name;
			if (dto.scientificName !== undefined) updateData.scientificName = dto.scientificName ?? null;
			if (dto.commonName !== undefined) updateData.commonName = dto.commonName ?? null;
			if (dto.careNotes !== undefined) updateData.careNotes = dto.careNotes ?? null;
			if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
			if (dto.lightRequirements !== undefined)
				updateData.lightRequirements = dto.lightRequirements ?? null;
			if (dto.wateringFrequencyDays !== undefined)
				updateData.wateringFrequencyDays = dto.wateringFrequencyDays ?? null;
			if (dto.humidity !== undefined) updateData.humidity = dto.humidity ?? null;

			await db.table('plants').update(id, updateData);
			const updated = await db.table<LocalPlant>('plants').get(id);
			return updated ? toPlant(updated) : null;
		} catch (e) {
			console.error('Failed to update plant:', e);
			return null;
		}
	},

	async delete(id: string): Promise<boolean> {
		try {
			await db.table('plants').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			trackEvent('plant_deleted');
			return true;
		} catch (e) {
			console.error('Failed to delete plant:', e);
			return false;
		}
	},
};

export const wateringMutations = {
	async logWatering(plantId: string, notes?: string): Promise<boolean> {
		try {
			const now = new Date().toISOString();

			// Create watering log entry
			const logEntry: LocalWateringLog = {
				id: crypto.randomUUID(),
				plantId,
				wateredAt: now,
				notes: notes ?? null,
				createdAt: now,
				updatedAt: now,
			};
			await db.table('wateringLogs').add(logEntry);

			// Update watering schedule
			const schedules = await db.table<LocalWateringSchedule>('wateringSchedules').toArray();
			const schedule = schedules.find((s) => s.plantId === plantId && !s.deletedAt);
			if (schedule) {
				const nextDate = new Date();
				nextDate.setDate(nextDate.getDate() + schedule.frequencyDays);

				await db.table('wateringSchedules').update(schedule.id, {
					lastWateredAt: now,
					nextWateringAt: nextDate.toISOString(),
					updatedAt: now,
				});
			}

			trackEvent('plant_watered');
			return true;
		} catch (e) {
			console.error('Failed to log watering:', e);
			return false;
		}
	},

	async updateSchedule(plantId: string, frequencyDays: number): Promise<boolean> {
		try {
			const now = new Date().toISOString();
			const schedules = await db.table<LocalWateringSchedule>('wateringSchedules').toArray();
			const schedule = schedules.find((s) => s.plantId === plantId && !s.deletedAt);

			if (schedule) {
				const nextDate = schedule.lastWateredAt
					? new Date(new Date(schedule.lastWateredAt).getTime() + frequencyDays * 86400000)
					: new Date(Date.now() + frequencyDays * 86400000);

				await db.table('wateringSchedules').update(schedule.id, {
					frequencyDays,
					nextWateringAt: nextDate.toISOString(),
					updatedAt: now,
				});
			} else {
				const nextDate = new Date(Date.now() + frequencyDays * 86400000);
				await db.table('wateringSchedules').add({
					id: crypto.randomUUID(),
					plantId,
					frequencyDays,
					lastWateredAt: null,
					nextWateringAt: nextDate.toISOString(),
					reminderEnabled: false,
					reminderHoursBefore: 0,
					createdAt: now,
					updatedAt: now,
				});
			}
			return true;
		} catch (e) {
			console.error('Failed to update watering schedule:', e);
			return false;
		}
	},
};
