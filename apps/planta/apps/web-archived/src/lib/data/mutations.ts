/**
 * Planta — Mutation Helpers (Local-First)
 *
 * All writes go to IndexedDB first, sync handles the rest.
 */

import {
	plantCollection,
	wateringScheduleCollection,
	wateringLogCollection,
	type LocalPlant,
	type LocalWateringSchedule,
	type LocalWateringLog,
} from './local-store';
import { toPlant, toWateringSchedule } from './queries';
import { trackEvent } from '@manacore/shared-utils/analytics';
import type { Plant, CreatePlantDto, UpdatePlantDto } from '@planta/shared';

export const plantMutations = {
	async create(dto: CreatePlantDto): Promise<Plant | null> {
		try {
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
			};
			const inserted = await plantCollection.insert(newLocal);
			trackEvent('plant_created');
			return toPlant(inserted);
		} catch (e) {
			console.error('Failed to create plant:', e);
			return null;
		}
	},

	async update(id: string, dto: UpdatePlantDto): Promise<Plant | null> {
		try {
			const updateData: Partial<LocalPlant> = {};
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

			const updated = await plantCollection.update(id, updateData);
			return updated ? toPlant(updated) : null;
		} catch (e) {
			console.error('Failed to update plant:', e);
			return null;
		}
	},

	async delete(id: string): Promise<boolean> {
		try {
			await plantCollection.delete(id);
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
			};
			await wateringLogCollection.insert(logEntry);

			// Update watering schedule
			const schedules = await wateringScheduleCollection.getAll();
			const schedule = schedules.find((s) => s.plantId === plantId);
			if (schedule) {
				const nextDate = new Date();
				nextDate.setDate(nextDate.getDate() + schedule.frequencyDays);

				await wateringScheduleCollection.update(schedule.id, {
					lastWateredAt: now,
					nextWateringAt: nextDate.toISOString(),
				} as Partial<LocalWateringSchedule>);
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
			const schedules = await wateringScheduleCollection.getAll();
			const schedule = schedules.find((s) => s.plantId === plantId);

			if (schedule) {
				const nextDate = schedule.lastWateredAt
					? new Date(new Date(schedule.lastWateredAt).getTime() + frequencyDays * 86400000)
					: new Date(Date.now() + frequencyDays * 86400000);

				await wateringScheduleCollection.update(schedule.id, {
					frequencyDays,
					nextWateringAt: nextDate.toISOString(),
				} as Partial<LocalWateringSchedule>);
			} else {
				const nextDate = new Date(Date.now() + frequencyDays * 86400000);
				await wateringScheduleCollection.insert({
					id: crypto.randomUUID(),
					plantId,
					frequencyDays,
					lastWateredAt: null,
					nextWateringAt: nextDate.toISOString(),
					reminderEnabled: false,
					reminderHoursBefore: 0,
				} as LocalWateringSchedule);
			}
			return true;
		} catch (e) {
			console.error('Failed to update watering schedule:', e);
			return false;
		}
	},
};
