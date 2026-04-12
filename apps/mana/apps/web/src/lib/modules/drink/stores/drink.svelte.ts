/**
 * Drink Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { encryptRecord } from '$lib/data/crypto';
import { drinkEntryTable, drinkPresetTable } from '../collections';
import { toDrinkEntry, toDrinkPreset, todayStr, nowTime } from '../queries';
import type { LocalDrinkEntry, LocalDrinkPreset, DrinkType } from '../types';

export const drinkStore = {
	// ─── Entries ──────────────────────────────────────────────

	async logDrink(input: {
		name: string;
		drinkType: DrinkType;
		quantityMl: number;
		date?: string;
		time?: string;
		note?: string | null;
		presetId?: string | null;
	}) {
		const newLocal: LocalDrinkEntry = {
			id: crypto.randomUUID(),
			name: input.name,
			drinkType: input.drinkType,
			quantityMl: input.quantityMl,
			date: input.date ?? todayStr(),
			time: input.time ?? nowTime(),
			note: input.note ?? null,
			presetId: input.presetId ?? null,
		};
		const snapshot = toDrinkEntry({ ...newLocal });
		await encryptRecord('drinkEntries', newLocal);
		await drinkEntryTable.add(newLocal);
		return snapshot;
	},

	/** Quick-log from a preset (one tap) */
	async logFromPreset(presetId: string) {
		const preset = await drinkPresetTable.get(presetId);
		if (!preset) return null;
		return this.logDrink({
			name: preset.name,
			drinkType: preset.drinkType,
			quantityMl: preset.defaultQuantityMl,
			presetId: preset.id,
		});
	},

	async updateEntry(
		id: string,
		patch: Partial<
			Pick<LocalDrinkEntry, 'name' | 'quantityMl' | 'drinkType' | 'note' | 'time' | 'date'>
		>
	) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('drinkEntries', wrapped);
		await drinkEntryTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteEntry(id: string) {
		await drinkEntryTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async undoLastEntry() {
		const all = await drinkEntryTable.toArray();
		const active = all
			.filter((e) => !e.deletedAt)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		if (active.length > 0) {
			await drinkEntryTable.update(active[0].id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		}
	},

	// ─── Presets ──────────────────────────────────────────────

	async createPreset(input: {
		name: string;
		icon: string;
		color: string;
		drinkType: DrinkType;
		defaultQuantityMl: number;
	}) {
		const existing = await drinkPresetTable.toArray();
		const count = existing.filter((p) => !p.deletedAt).length;

		const newLocal: LocalDrinkPreset = {
			id: crypto.randomUUID(),
			name: input.name,
			icon: input.icon,
			color: input.color,
			drinkType: input.drinkType,
			defaultQuantityMl: input.defaultQuantityMl,
			order: count,
			isArchived: false,
		};
		const snapshot = toDrinkPreset({ ...newLocal });
		await encryptRecord('drinkPresets', newLocal);
		await drinkPresetTable.add(newLocal);
		return snapshot;
	},

	async updatePreset(
		id: string,
		patch: Partial<
			Pick<
				LocalDrinkPreset,
				'name' | 'icon' | 'color' | 'drinkType' | 'defaultQuantityMl' | 'isArchived' | 'order'
			>
		>
	) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('drinkPresets', wrapped);
		await drinkPresetTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deletePreset(id: string) {
		await drinkPresetTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async reorderPresets(presetIds: string[]) {
		const now = new Date().toISOString();
		for (let i = 0; i < presetIds.length; i++) {
			await drinkPresetTable.update(presetIds[i], {
				order: i,
				updatedAt: now,
			});
		}
	},
};
