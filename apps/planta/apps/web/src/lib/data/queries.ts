/**
 * Reactive Queries & Pure Helpers for Planta
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	plantCollection,
	plantPhotoCollection,
	wateringScheduleCollection,
	wateringLogCollection,
	type LocalPlant,
	type LocalPlantPhoto,
	type LocalWateringSchedule,
	type LocalWateringLog,
} from './local-store';
import type { Plant, PlantPhoto, WateringSchedule, WateringLog } from '@planta/shared';

// ─── Type Converters ───────────────────────────────────────

/** Convert a LocalPlant (IndexedDB) to the shared Plant type. */
export function toPlant(local: LocalPlant): Plant {
	return {
		id: local.id,
		userId: 'local',
		name: local.name,
		scientificName: local.scientificName ?? undefined,
		commonName: local.commonName ?? undefined,
		species: local.species ?? undefined,
		lightRequirements: local.lightRequirements ?? undefined,
		wateringFrequencyDays: local.wateringFrequencyDays ?? undefined,
		humidity: local.humidity ?? undefined,
		temperature: local.temperature ?? undefined,
		soilType: local.soilType ?? undefined,
		careNotes: local.careNotes ?? undefined,
		isActive: local.isActive,
		healthStatus: local.healthStatus ?? undefined,
		acquiredAt: local.acquiredAt ? new Date(local.acquiredAt) : undefined,
		createdAt: new Date(local.createdAt ?? new Date().toISOString()),
		updatedAt: new Date(local.updatedAt ?? new Date().toISOString()),
	};
}

/** Convert a LocalPlantPhoto (IndexedDB) to the shared PlantPhoto type. */
export function toPlantPhoto(local: LocalPlantPhoto): PlantPhoto {
	return {
		id: local.id,
		plantId: local.plantId,
		userId: 'local',
		storagePath: local.storagePath,
		publicUrl: local.publicUrl ?? undefined,
		filename: local.filename,
		mimeType: local.mimeType ?? undefined,
		fileSize: local.fileSize ?? undefined,
		width: local.width ?? undefined,
		height: local.height ?? undefined,
		isPrimary: local.isPrimary,
		isAnalyzed: local.isAnalyzed,
		takenAt: local.takenAt ? new Date(local.takenAt) : undefined,
		createdAt: new Date(local.createdAt ?? new Date().toISOString()),
	};
}

/** Convert a LocalWateringSchedule (IndexedDB) to the shared WateringSchedule type. */
export function toWateringSchedule(local: LocalWateringSchedule): WateringSchedule {
	return {
		id: local.id,
		plantId: local.plantId,
		userId: 'local',
		frequencyDays: local.frequencyDays,
		lastWateredAt: local.lastWateredAt ? new Date(local.lastWateredAt) : undefined,
		nextWateringAt: local.nextWateringAt ? new Date(local.nextWateringAt) : undefined,
		reminderEnabled: local.reminderEnabled,
		reminderHoursBefore: local.reminderHoursBefore,
		createdAt: new Date(local.createdAt ?? new Date().toISOString()),
		updatedAt: new Date(local.updatedAt ?? new Date().toISOString()),
	};
}

/** Convert a LocalWateringLog (IndexedDB) to the shared WateringLog type. */
export function toWateringLog(local: LocalWateringLog): WateringLog {
	return {
		id: local.id,
		plantId: local.plantId,
		userId: 'local',
		wateredAt: new Date(local.wateredAt),
		notes: local.notes ?? undefined,
		createdAt: new Date(local.createdAt ?? new Date().toISOString()),
	};
}

// ─── Live Query Hooks (call during component init) ─────────

/** All plants. Auto-updates on any change. */
export function useAllPlants() {
	return useLiveQueryWithDefault(async () => {
		const locals = await plantCollection.getAll();
		return locals.map(toPlant);
	}, [] as Plant[]);
}

/** All plant photos. Auto-updates on any change. */
export function useAllPlantPhotos() {
	return useLiveQueryWithDefault(async () => {
		const locals = await plantPhotoCollection.getAll();
		return locals.map(toPlantPhoto);
	}, [] as PlantPhoto[]);
}

/** All watering schedules. Auto-updates on any change. */
export function useAllWateringSchedules() {
	return useLiveQueryWithDefault(async () => {
		const locals = await wateringScheduleCollection.getAll();
		return locals.map(toWateringSchedule);
	}, [] as WateringSchedule[]);
}

/** All watering logs. Auto-updates on any change. */
export function useAllWateringLogs() {
	return useLiveQueryWithDefault(async () => {
		const locals = await wateringLogCollection.getAll();
		return locals.map(toWateringLog);
	}, [] as WateringLog[]);
}

// ─── Pure Plant Helpers ────────────────────────────────────

/** Get a plant by ID. */
export function getPlantById(plants: Plant[], id: string): Plant | undefined {
	return plants.find((p) => p.id === id);
}

/** Get active plants only. */
export function getActivePlants(plants: Plant[]): Plant[] {
	return plants.filter((p) => p.isActive);
}

/** Get photos for a specific plant. */
export function getPhotosForPlant(photos: PlantPhoto[], plantId: string): PlantPhoto[] {
	return photos.filter((p) => p.plantId === plantId);
}

/** Get the primary photo for a plant. */
export function getPrimaryPhoto(photos: PlantPhoto[], plantId: string): PlantPhoto | undefined {
	return photos.find((p) => p.plantId === plantId && p.isPrimary);
}

// ─── Pure Watering Helpers ─────────────────────────────────

/** Get watering schedule for a specific plant. */
export function getScheduleForPlant(
	schedules: WateringSchedule[],
	plantId: string
): WateringSchedule | undefined {
	return schedules.find((s) => s.plantId === plantId);
}

/** Get watering logs for a specific plant, sorted by date (newest first). */
export function getLogsForPlant(logs: WateringLog[], plantId: string): WateringLog[] {
	return logs
		.filter((l) => l.plantId === plantId)
		.sort((a, b) => new Date(b.wateredAt).getTime() - new Date(a.wateredAt).getTime());
}

/** Calculate days until next watering. Negative means overdue. */
export function getDaysUntilWatering(schedule: WateringSchedule | undefined): number | null {
	if (!schedule?.nextWateringAt) return null;
	const now = new Date();
	const next = new Date(schedule.nextWateringAt);
	return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Check if a plant's watering is overdue. */
export function isWateringOverdue(schedule: WateringSchedule | undefined): boolean {
	const days = getDaysUntilWatering(schedule);
	return days !== null && days < 0;
}
