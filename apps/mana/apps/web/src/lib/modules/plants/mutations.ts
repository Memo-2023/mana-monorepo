/**
 * Plants — Mutation Helpers (Local-First)
 *
 * All writes go to IndexedDB first, sync handles the rest. Mutations throw
 * on failure so UI callers can surface errors via toasts.
 */

import { db } from '$lib/data/database';
import { toPlant, toWateringSchedule } from './queries';
import { PlantsEvents } from '@mana/shared-utils/analytics';
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { createBlock } from '$lib/data/time-blocks/service';
import { uploadPlantPhoto, identifyPlant, type IdentifyResult } from './api';
import type {
	LocalPlant,
	LocalPlantPhoto,
	LocalWateringSchedule,
	LocalWateringLog,
	Plant,
	CreatePlantDto,
	UpdatePlantDto,
} from './types';

export const plantMutations = {
	async create(dto: CreatePlantDto): Promise<Plant> {
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
		const plaintextSnapshot = toPlant(newLocal);
		await encryptRecord('plants', newLocal);
		await db.table('plants').add(newLocal);
		emitDomainEvent('PlantCreated', 'plants', 'plants', newLocal.id, {
			plantId: newLocal.id,
			name: dto.name,
			species: dto.scientificName,
		});
		PlantsEvents.plantCreated();
		return plaintextSnapshot;
	},

	async update(id: string, dto: UpdatePlantDto): Promise<Plant> {
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

		await encryptRecord('plants', updateData);
		await db.table('plants').update(id, updateData);
		const updated = await db.table<LocalPlant>('plants').get(id);
		if (!updated) throw new Error('Plant disappeared after update');
		const decrypted = await decryptRecord('plants', { ...updated });
		return toPlant(decrypted);
	},

	async delete(id: string): Promise<void> {
		await db.table('plants').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('PlantDeleted', 'plants', 'plants', id, { plantId: id });
		PlantsEvents.plantDeleted();
	},

	/**
	 * Apply an AI identification result to a plant — fills in scientific
	 * name and watering frequency when available, leaves user-set fields
	 * untouched if the user already populated them.
	 */
	async applyIdentification(
		id: string,
		result: IdentifyResult,
		options: { overwrite?: boolean } = {}
	): Promise<Plant> {
		const existing = await db.table<LocalPlant>('plants').get(id);
		if (!existing) throw new Error('Plant not found');
		const decrypted = await decryptRecord('plants', { ...existing });

		const update: UpdatePlantDto = {};
		if (result.scientificName && (options.overwrite || !decrypted.scientificName)) {
			update.scientificName = result.scientificName;
		}
		if (result.commonNames?.[0] && (options.overwrite || !decrypted.commonName)) {
			update.commonName = result.commonNames[0];
		}
		const tipsBlock = [result.wateringAdvice, result.lightAdvice, ...(result.generalTips ?? [])]
			.filter(Boolean)
			.join('\n');
		if (tipsBlock && (options.overwrite || !decrypted.careNotes)) {
			update.careNotes = tipsBlock;
		}

		if (Object.keys(update).length === 0) return toPlant(decrypted);
		return plantMutations.update(id, update);
	},
};

export const wateringMutations = {
	async logWatering(plantId: string, notes?: string): Promise<void> {
		const now = new Date().toISOString();

		// Resolve plant name for TimeBlock title
		const plant = await db.table<LocalPlant>('plants').get(plantId);
		const decryptedPlant = plant ? await decryptRecord('plants', { ...plant }) : null;
		const plantName = decryptedPlant?.name ?? 'Pflanze';

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

		// Create a TimeBlock for the watering event
		await createBlock({
			startDate: now,
			endDate: now,
			kind: 'logged',
			type: 'watering',
			sourceModule: 'plants',
			sourceId: logEntry.id,
			title: `${plantName} gegossen`,
			color: '#06b6d4',
		});

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

		PlantsEvents.plantWatered();
	},

	async updateSchedule(plantId: string, frequencyDays: number): Promise<void> {
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
	},
};

export const photoMutations = {
	/**
	 * Upload a photo to mana-api and persist a plantPhoto record locally.
	 * Returns the new photo so callers can immediately trigger AI identification.
	 */
	async upload(plantId: string, file: File): Promise<LocalPlantPhoto> {
		const result = await uploadPlantPhoto(file, plantId);
		const now = new Date().toISOString();

		// Mark as primary if this is the first photo for the plant.
		const existing = await db.table<LocalPlantPhoto>('plantPhotos').toArray();
		const hasPrimary = existing.some((p) => p.plantId === plantId && p.isPrimary && !p.deletedAt);

		const photo: LocalPlantPhoto = {
			id: crypto.randomUUID(),
			plantId,
			storagePath: result.storagePath,
			publicUrl: result.publicUrl,
			filename: file.name,
			mimeType: file.type || null,
			fileSize: file.size,
			width: null,
			height: null,
			isPrimary: !hasPrimary,
			isAnalyzed: false,
			takenAt: now,
			createdAt: now,
			updatedAt: now,
		};
		await db.table('plantPhotos').add(photo);
		return photo;
	},

	async identify(photoId: string): Promise<IdentifyResult> {
		const photo = await db.table<LocalPlantPhoto>('plantPhotos').get(photoId);
		if (!photo?.publicUrl) throw new Error('Photo has no public URL');
		const result = await identifyPlant(photo.publicUrl);
		await db.table('plantPhotos').update(photoId, {
			isAnalyzed: true,
			updatedAt: new Date().toISOString(),
		});
		return result;
	},

	async setPrimary(plantId: string, photoId: string): Promise<void> {
		const all = await db.table<LocalPlantPhoto>('plantPhotos').toArray();
		const now = new Date().toISOString();
		for (const p of all) {
			if (p.plantId !== plantId || p.deletedAt) continue;
			const shouldBe = p.id === photoId;
			if (p.isPrimary !== shouldBe) {
				await db.table('plantPhotos').update(p.id, { isPrimary: shouldBe, updatedAt: now });
			}
		}
	},

	async remove(photoId: string): Promise<void> {
		const now = new Date().toISOString();
		await db.table('plantPhotos').update(photoId, { deletedAt: now, updatedAt: now });
	},
};
