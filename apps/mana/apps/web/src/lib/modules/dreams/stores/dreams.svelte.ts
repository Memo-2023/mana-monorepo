/**
 * Dreams Store — Mutation-Only Service
 *
 * Phase 5 encryption: title, content, transcript, interpretation,
 * aiInterpretation, location are encrypted at rest. Symbol metadata
 * (dreamSymbols.meaning) is encrypted; symbol `name` stays plaintext
 * because it's used as the unique lookup key in touchSymbols /
 * updateSymbol via where('name').equals(...).
 */

import { dreamSymbolTable, dreamTable } from '../collections';
import { toDream } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { createBlock, deleteBlock } from '$lib/data/time-blocks/service';
import { transcribeAudio } from '$lib/voice/transcribe';
import type {
	Dream,
	DreamClarity,
	DreamMood,
	DreamProcessingStatus,
	LocalDream,
	SleepQuality,
} from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

/**
 * Build ISO start/end timestamps for a sleep session.
 * bedtime is assumed to be the evening before dreamDate,
 * wakeTime is the morning of dreamDate.
 */
function buildSleepRange(
	dreamDate: string,
	bedtime: string,
	wakeTime: string
): { startDate: string; endDate: string } {
	const bedHour = parseInt(bedtime.split(':')[0], 10);
	// If bedtime is before 12:00, assume same day; otherwise previous day
	const bedDay =
		bedHour < 12
			? dreamDate
			: (() => {
					const d = new Date(dreamDate);
					d.setDate(d.getDate() - 1);
					return d.toISOString().slice(0, 10);
				})();
	return {
		startDate: `${bedDay}T${bedtime}:00.000Z`,
		endDate: `${dreamDate}T${wakeTime}:00.000Z`,
	};
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
		bedtime?: string | null;
		wakeTime?: string | null;
	}) {
		const dreamDate = data.dreamDate ?? todayIsoDate();
		const dreamId = crypto.randomUUID();

		// Create sleep TimeBlock if both bedtime and wakeTime are provided
		let timeBlockId: string | null = null;
		if (data.bedtime && data.wakeTime) {
			const range = buildSleepRange(dreamDate, data.bedtime, data.wakeTime);
			timeBlockId = await createBlock({
				startDate: range.startDate,
				endDate: range.endDate,
				kind: 'logged',
				type: 'sleep',
				sourceModule: 'dreams',
				sourceId: dreamId,
				title: data.title ?? 'Schlaf',
				color: '#6366f1',
			});
		}

		const newLocal: LocalDream = {
			id: dreamId,
			title: data.title ?? null,
			content: data.content ?? '',
			dreamDate,
			mood: data.mood ?? null,
			clarity: data.clarity ?? null,
			isLucid: data.isLucid ?? false,
			isRecurring: false,
			sleepQuality: null,
			bedtime: data.bedtime ?? null,
			wakeTime: data.wakeTime ?? null,
			location: null,
			people: [],
			emotions: data.emotions ?? [],
			symbols: data.symbols ?? [],
			audioPath: null,
			audioDurationMs: null,
			transcript: null,
			transcriptModel: null,
			processingStatus: 'idle',
			processingError: null,
			interpretation: null,
			aiInterpretation: null,
			isPrivate: false,
			isPinned: false,
			isArchived: false,
			timeBlockId,
		};

		const plaintextSnapshot = toDream(newLocal);
		await encryptRecord('dreams', newLocal);
		await dreamTable.add(newLocal);
		await this.touchSymbols(plaintextSnapshot.symbols, +1);
		emitDomainEvent('DreamCreated', 'dreams', 'dreams', dreamId, {
			dreamId,
			title: data.title ?? undefined,
			isLucid: data.isLucid ?? false,
			mood: data.mood ?? undefined,
		});
		return plaintextSnapshot;
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
		const existing = await dreamTable.get(id);

		if (data.symbols && existing) {
			const oldSet = new Set(existing.symbols ?? []);
			const newSet = new Set(data.symbols);
			const added = [...newSet].filter((s) => !oldSet.has(s));
			const removed = [...oldSet].filter((s) => !newSet.has(s));
			if (added.length) await this.touchSymbols(added, +1);
			if (removed.length) await this.touchSymbols(removed, -1);
		}

		// Create or update sleep TimeBlock when bedtime/wakeTime change
		if (existing && (data.bedtime !== undefined || data.wakeTime !== undefined)) {
			const bedtime = data.bedtime ?? existing.bedtime;
			const wakeTime = data.wakeTime ?? existing.wakeTime;
			const dreamDate = data.dreamDate ?? existing.dreamDate;

			if (bedtime && wakeTime) {
				const range = buildSleepRange(dreamDate, bedtime, wakeTime);
				if (!existing.timeBlockId) {
					const timeBlockId = await createBlock({
						startDate: range.startDate,
						endDate: range.endDate,
						kind: 'logged',
						type: 'sleep',
						sourceModule: 'dreams',
						sourceId: id,
						title: data.title ?? existing.title ?? 'Schlaf',
						color: '#6366f1',
					});
					data = { ...data, timeBlockId } as typeof data;
				} else {
					const { updateBlock } = await import('$lib/data/time-blocks/service');
					await updateBlock(existing.timeBlockId, {
						startDate: range.startDate,
						endDate: range.endDate,
					});
				}
			}
		}

		const diff: Partial<LocalDream> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('dreams', diff);
		await dreamTable.update(id, diff);
	},

	/**
	 * Create a placeholder dream from a fresh voice recording and start the
	 * background transcription. Returns the new dream immediately so the UI
	 * can navigate / show a "transcribing" state without waiting.
	 */
	async createFromVoice(blob: Blob, durationMs: number, language?: string): Promise<Dream> {
		const newLocal: LocalDream = {
			id: crypto.randomUUID(),
			title: null,
			content: '',
			dreamDate: todayIsoDate(),
			mood: null,
			clarity: null,
			isLucid: false,
			isRecurring: false,
			sleepQuality: null,
			bedtime: null,
			wakeTime: null,
			location: null,
			people: [],
			emotions: [],
			symbols: [],
			audioPath: null,
			audioDurationMs: durationMs,
			transcript: null,
			transcriptModel: null,
			processingStatus: 'transcribing',
			processingError: null,
			interpretation: null,
			aiInterpretation: null,
			isPrivate: false,
			isPinned: false,
			isArchived: false,
		};
		const plaintextSnapshot = toDream(newLocal);
		await encryptRecord('dreams', newLocal);
		await dreamTable.add(newLocal);

		// Fire and forget — transcription updates the dream when it returns.
		void this.transcribeBlob(newLocal.id, blob, language);

		return plaintextSnapshot;
	},

	async setProcessingStatus(
		id: string,
		status: DreamProcessingStatus,
		error: string | null = null
	) {
		await dreamTable.update(id, {
			processingStatus: status,
			processingError: error,
			updatedAt: new Date().toISOString(),
		});
	},

	/**
	 * Upload an audio blob to /api/v1/voice/transcribe and write the result
	 * back into the dream. Reset to idle on success, mark failed on error.
	 */
	async transcribeBlob(dreamId: string, blob: Blob, language?: string): Promise<void> {
		try {
			const result = await transcribeAudio(blob, language);

			const transcript = result.text;
			const existing = await dreamTable.get(dreamId);
			if (!existing) return;

			// `existing.content` may be ciphertext at this point — we need
			// the plaintext to decide whether to overwrite. Decrypt the
			// existing record first, then check the user-typed content.
			const { decryptRecord } = await import('$lib/data/crypto');
			const decryptedExisting = await decryptRecord('dreams', { ...existing });

			const diff: Partial<LocalDream> = {
				transcript,
				transcriptModel: result.model,
				// Only fill content if user hasn't typed anything yet
				content: decryptedExisting.content?.trim() ? decryptedExisting.content : transcript,
				processingStatus: 'idle',
				processingError: null,
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('dreams', diff);
			await dreamTable.update(dreamId, diff);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			await dreamTable.update(dreamId, {
				processingStatus: 'failed',
				processingError: msg,
				updatedAt: new Date().toISOString(),
			});
		}
	},

	async deleteDream(id: string) {
		const existing = await dreamTable.get(id);
		if (existing?.symbols?.length) {
			await this.touchSymbols(existing.symbols, -1);
		}
		if (existing?.timeBlockId) {
			await deleteBlock(existing.timeBlockId);
		}
		await dreamTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('DreamDeleted', 'dreams', 'dreams', id, { dreamId: id });
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

	/** Edit a symbol's metadata (name, meaning, color). */
	async updateSymbol(
		id: string,
		data: { name?: string; meaning?: string | null; color?: string | null }
	) {
		const existing = await dreamSymbolTable.get(id);
		if (!existing) return;

		// If renaming, propagate to all dreams that reference the old name
		if (data.name && data.name !== existing.name) {
			const newName = data.name.trim();
			if (!newName) return;

			// Check if a symbol with the new name already exists -> merge instead
			const collision = await dreamSymbolTable.where('name').equals(newName).first();
			if (collision && collision.id !== id) {
				await this.mergeSymbols(id, collision.id);
				return;
			}

			const allDreams = await dreamTable.toArray();
			for (const dream of allDreams) {
				if (dream.deletedAt || !dream.symbols?.includes(existing.name)) continue;
				const updated = dream.symbols.map((s) => (s === existing.name ? newName : s));
				await dreamTable.update(dream.id, {
					symbols: updated,
					updatedAt: new Date().toISOString(),
				});
			}
		}

		const symbolDiff: Record<string, unknown> = {
			...data,
			...(data.name ? { name: data.name.trim() } : {}),
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('dreamSymbols', symbolDiff);
		await dreamSymbolTable.update(id, symbolDiff);
	},

	/** Soft-delete a symbol and remove it from all dreams that reference it. */
	async deleteSymbol(id: string) {
		const symbol = await dreamSymbolTable.get(id);
		if (!symbol) return;

		const allDreams = await dreamTable.toArray();
		for (const dream of allDreams) {
			if (dream.deletedAt || !dream.symbols?.includes(symbol.name)) continue;
			await dreamTable.update(dream.id, {
				symbols: dream.symbols.filter((s) => s !== symbol.name),
				updatedAt: new Date().toISOString(),
			});
		}

		await dreamSymbolTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/** Merge `sourceId` into `targetId`: rewrite all dreams, sum counts, soft-delete source. */
	async mergeSymbols(sourceId: string, targetId: string) {
		if (sourceId === targetId) return;
		const source = await dreamSymbolTable.get(sourceId);
		const target = await dreamSymbolTable.get(targetId);
		if (!source || !target) return;

		const allDreams = await dreamTable.toArray();
		for (const dream of allDreams) {
			if (dream.deletedAt || !dream.symbols?.includes(source.name)) continue;
			const set = new Set(dream.symbols);
			set.delete(source.name);
			set.add(target.name);
			await dreamTable.update(dream.id, {
				symbols: Array.from(set),
				updatedAt: new Date().toISOString(),
			});
		}

		await dreamSymbolTable.update(targetId, {
			count: (target.count ?? 0) + (source.count ?? 0),
			updatedAt: new Date().toISOString(),
		});
		await dreamSymbolTable.update(sourceId, {
			deletedAt: new Date().toISOString(),
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
