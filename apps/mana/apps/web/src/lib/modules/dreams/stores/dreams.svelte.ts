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
			audioDurationMs: null,
			transcript: null,
			processingStatus: 'idle',
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
		// touchSymbols receives plaintext names — must run BEFORE the
		// snapshot mutation above doesn't matter because newLocal.symbols
		// is a non-encrypted field, but use the snapshot's symbols just
		// to be explicit about what we're feeding the symbol counter.
		await this.touchSymbols(plaintextSnapshot.symbols, +1);
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
	 * Upload an audio blob to /api/v1/dreams/transcribe and write the result
	 * back into the dream. Reset to idle on success, mark failed on error.
	 */
	async transcribeBlob(dreamId: string, blob: Blob, language?: string): Promise<void> {
		try {
			const form = new FormData();
			const ext = blob.type.includes('webm')
				? '.webm'
				: blob.type.includes('mp4')
					? '.m4a'
					: '.audio';
			form.append('file', blob, `dream${ext}`);
			if (language) form.append('language', language);

			const response = await fetch('/api/v1/dreams/transcribe', {
				method: 'POST',
				body: form,
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(text || `HTTP ${response.status}`);
			}

			const result = (await response.json()) as {
				text: string;
				language: string | null;
				durationSeconds: number | null;
			};

			const transcript = (result.text ?? '').trim();
			const existing = await dreamTable.get(dreamId);
			if (!existing) return;

			// `existing.content` may be ciphertext at this point — we need
			// the plaintext to decide whether to overwrite. Decrypt the
			// existing record first, then check the user-typed content.
			const { decryptRecord } = await import('$lib/data/crypto');
			const decryptedExisting = await decryptRecord('dreams', { ...existing });

			const diff: Partial<LocalDream> = {
				transcript,
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
