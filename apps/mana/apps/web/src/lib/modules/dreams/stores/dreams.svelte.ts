/**
 * Dreams Store — Mutation-Only Service
 */

import { dreamSymbolTable, dreamTable } from '../collections';
import { toDream } from '../queries';
import type { DreamClarity, DreamMood, LocalDream, SleepQuality } from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

export const dreamsStore = {
	async createDream(data: {
		title?: string | null;
		content?: string;
		dreamDate?: string;
		mood?: DreamMood | null;
		clarity?: DreamClarity | null;
		isLucid?: boolean;
		symbols?: string[];
		emotions?: string[];
	}) {
		const newLocal: LocalDream = {
			id: crypto.randomUUID(),
			title: data.title ?? null,
			content: data.content ?? '',
			dreamDate: data.dreamDate ?? todayIsoDate(),
			mood: data.mood ?? null,
			clarity: data.clarity ?? null,
			isLucid: data.isLucid ?? false,
			isRecurring: false,
			sleepQuality: null,
			bedtime: null,
			wakeTime: null,
			location: null,
			people: [],
			emotions: data.emotions ?? [],
			symbols: data.symbols ?? [],
			audioPath: null,
			transcript: null,
			interpretation: null,
			aiInterpretation: null,
			isPrivate: false,
			isPinned: false,
			isArchived: false,
		};

		await dreamTable.add(newLocal);
		await this.touchSymbols(newLocal.symbols, +1);
		return toDream(newLocal);
	},

	async updateDream(
		id: string,
		data: Partial<
			Pick<
				LocalDream,
				| 'title'
				| 'content'
				| 'dreamDate'
				| 'mood'
				| 'clarity'
				| 'isLucid'
				| 'isRecurring'
				| 'sleepQuality'
				| 'bedtime'
				| 'wakeTime'
				| 'location'
				| 'people'
				| 'emotions'
				| 'symbols'
				| 'interpretation'
				| 'aiInterpretation'
				| 'isPrivate'
				| 'isPinned'
				| 'isArchived'
			>
		>
	) {
		if (data.symbols) {
			const existing = await dreamTable.get(id);
			if (existing) {
				const oldSet = new Set(existing.symbols ?? []);
				const newSet = new Set(data.symbols);
				const added = [...newSet].filter((s) => !oldSet.has(s));
				const removed = [...oldSet].filter((s) => !newSet.has(s));
				if (added.length) await this.touchSymbols(added, +1);
				if (removed.length) await this.touchSymbols(removed, -1);
			}
		}

		await dreamTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteDream(id: string) {
		const existing = await dreamTable.get(id);
		if (existing?.symbols?.length) {
			await this.touchSymbols(existing.symbols, -1);
		}
		await dreamTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async togglePin(id: string) {
		const dream = await dreamTable.get(id);
		if (!dream) return;
		await dreamTable.update(id, {
			isPinned: !dream.isPinned,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleLucid(id: string) {
		const dream = await dreamTable.get(id);
		if (!dream) return;
		await dreamTable.update(id, {
			isLucid: !dream.isLucid,
			updatedAt: new Date().toISOString(),
		});
	},

	async setMood(id: string, mood: DreamMood | null) {
		await dreamTable.update(id, {
			mood,
			updatedAt: new Date().toISOString(),
		});
	},

	async setSleepQuality(id: string, quality: SleepQuality | null) {
		await dreamTable.update(id, {
			sleepQuality: quality,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Increment or decrement counts for the given symbol names. Creates symbols on demand. */
	async touchSymbols(names: string[], delta: number) {
		for (const name of names) {
			const trimmed = name.trim();
			if (!trimmed) continue;
			const existing = await dreamSymbolTable.where('name').equals(trimmed).first();
			if (existing) {
				const next = Math.max(0, (existing.count ?? 0) + delta);
				await dreamSymbolTable.update(existing.id, {
					count: next,
					updatedAt: new Date().toISOString(),
				});
			} else if (delta > 0) {
				await dreamSymbolTable.add({
					id: crypto.randomUUID(),
					name: trimmed,
					meaning: null,
					color: null,
					count: delta,
				});
			}
		}
	},
};
