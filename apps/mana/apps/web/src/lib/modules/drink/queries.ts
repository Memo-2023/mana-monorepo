/**
 * Reactive Queries & Pure Helpers for Drink module.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalDrinkEntry, LocalDrinkPreset, DrinkEntry, DrinkPreset } from './types';

// ─── Type Converters ──────────────────────────────────────

export function toDrinkEntry(local: LocalDrinkEntry): DrinkEntry {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		drinkType: local.drinkType,
		quantityMl: local.quantityMl,
		date: local.date,
		time: local.time,
		note: local.note ?? null,
		presetId: local.presetId ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toDrinkPreset(local: LocalDrinkPreset): DrinkPreset {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		icon: local.icon,
		color: local.color,
		drinkType: local.drinkType,
		defaultQuantityMl: local.defaultQuantityMl,
		order: local.order,
		isArchived: local.isArchived,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

// ─── Live Queries ─────────────────────────────────────────

export function useAllDrinkEntries() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db
			.table<LocalDrinkEntry>('drinkEntries')
			.orderBy('date')
			.reverse()
			.toArray();
		const visible = locals.filter((e) => !e.deletedAt);
		const decrypted = await decryptRecords('drinkEntries', visible);
		return decrypted.map(toDrinkEntry);
	}, [] as DrinkEntry[]);
}

export function useAllDrinkPresets() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalDrinkPreset, string>('drink', 'drinkPresets').sortBy(
			'order'
		);
		const visible = locals.filter((p) => !p.deletedAt);
		const decrypted = await decryptRecords('drinkPresets', visible);
		return decrypted.map(toDrinkPreset);
	}, [] as DrinkPreset[]);
}

// ─── Pure Helpers ─────────────────────────────────────────

/** Get today's date string (YYYY-MM-DD) */
export function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Current time as HH:mm */
export function nowTime(): string {
	const d = new Date();
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Filter entries for a specific date */
export function getEntriesForDate(entries: DrinkEntry[], date: string): DrinkEntry[] {
	return entries.filter((e) => e.date === date).sort((a, b) => b.time.localeCompare(a.time));
}

/** Total ml for a given date */
export function getTotalMlForDate(entries: DrinkEntry[], date: string): number {
	return entries.filter((e) => e.date === date).reduce((sum, e) => sum + e.quantityMl, 0);
}

/** Total ml for a given date and drink type */
export function getTotalMlByType(entries: DrinkEntry[], date: string, drinkType: string): number {
	return entries
		.filter((e) => e.date === date && e.drinkType === drinkType)
		.reduce((sum, e) => sum + e.quantityMl, 0);
}

/** Group entries by date (most recent first) */
export function groupEntriesByDate(entries: DrinkEntry[]): Map<string, DrinkEntry[]> {
	const groups = new Map<string, DrinkEntry[]>();
	for (const entry of entries) {
		const existing = groups.get(entry.date) || [];
		existing.push(entry);
		groups.set(entry.date, existing);
	}
	// Sort entries within each group by time descending
	for (const [, group] of groups) {
		group.sort((a, b) => b.time.localeCompare(a.time));
	}
	return groups;
}

/** Get active (non-archived) presets sorted by order */
export function getActivePresets(presets: DrinkPreset[]): DrinkPreset[] {
	return presets.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order);
}

/** Format ml as a readable string */
export function formatMl(ml: number): string {
	if (ml >= 1000) {
		const liters = ml / 1000;
		return `${liters % 1 === 0 ? liters.toFixed(0) : liters.toFixed(1)} L`;
	}
	return `${ml} ml`;
}
