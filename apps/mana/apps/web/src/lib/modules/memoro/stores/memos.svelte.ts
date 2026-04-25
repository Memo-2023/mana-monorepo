/**
 * Memos Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles memo CRUD, archive, pin, delete.
 */

import { memoTable } from '../collections';
import { toMemo } from '../queries';
import { createArchiveOps } from '@mana/shared-stores';
import { MemoroEvents } from '@mana/shared-utils/analytics';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import { defaultVisibilityFor, type VisibilityLevel } from '@mana/shared-privacy';
import { transcribeAudio } from '$lib/voice/transcribe';
import { llmTaskQueue } from '$lib/llm-queue';
import { generateTitleTask } from '$lib/llm-tasks/generate-title';
import type { LocalMemo } from '../types';

/** Archive/soft-delete ops for memos. */
export const memoArchive = createArchiveOps({
	table: () => memoTable,
});

export const memosStore = {
	/** Create a new memo (e.g., after recording). */
	async create(data: {
		title?: string;
		transcript?: string;
		language?: string;
		blueprintId?: string;
		audioDurationMs?: number;
		processingStatus?: LocalMemo['processingStatus'];
	}) {
		const now = new Date().toISOString();
		const newLocal: LocalMemo = {
			id: crypto.randomUUID(),
			title: data.title ?? null,
			intro: null,
			transcript: data.transcript ?? null,
			audioDurationMs: data.audioDurationMs ?? null,
			transcriptModel: null,
			processingStatus: data.processingStatus ?? (data.transcript ? 'completed' : 'pending'),
			isArchived: false,
			isPinned: false,
			isPublic: false,
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
			blueprintId: data.blueprintId ?? null,
			language: data.language ?? null,
			// createdAt + updatedAt are required by LocalMemo's type but the
			// previous create() never set them — DetailView showed
			// "Erstellt: Invalid Date" for every memo. The Dexie creating
			// hook only auto-stamps userId + __fieldTimestamps; module
			// stores have to set their own createdAt/updatedAt explicitly
			// (consistent with the rest of the Mana modules).
			createdAt: now,
			updatedAt: now,
		} as LocalMemo;
		const plaintextSnapshot = toMemo(newLocal);
		await encryptRecord('memos', newLocal);
		await memoTable.add(newLocal);
		emitDomainEvent('MemoCreated', 'memoro', 'memos', newLocal.id, {
			memoId: newLocal.id,
			fromVoice: false,
		});
		MemoroEvents.memoCreated();
		return plaintextSnapshot;
	},

	/**
	 * Create a placeholder memo from a fresh voice recording and start the
	 * background transcription. Returns the new memo immediately so the UI
	 * can navigate / show a "processing" state without waiting.
	 */
	async createFromVoice(blob: Blob, durationMs: number, language?: string) {
		const memo = await this.create({
			audioDurationMs: durationMs,
			language,
			processingStatus: 'processing',
		});
		// Fire and forget — transcription updates the memo when it returns.
		void this.transcribeBlob(memo.id, blob, language);
		return memo;
	},

	/**
	 * Upload an audio blob to /api/v1/voice/transcribe and write the result
	 * back into the memo. Marks completed on success, failed on error.
	 */
	async transcribeBlob(memoId: string, blob: Blob, language?: string): Promise<void> {
		try {
			const result = await transcribeAudio(blob, language);

			const transcript = result.text;
			const existing = await memoTable.get(memoId);
			if (!existing) return;

			const diff: Partial<LocalMemo> = {
				transcript,
				transcriptModel: result.model,
				language: existing.language ?? result.language ?? null,
				processingStatus: 'completed',
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('memos', diff);
			await memoTable.update(memoId, diff);

			// Auto-title: if the user didn't already give the memo a title,
			// queue a background task to generate one from the transcript.
			// The task is fire-and-forget — the memoro LLM watcher
			// (./llm-watcher.svelte.ts) picks up the result reactively and
			// writes it back to memo.title. Works on every tier including
			// none (regex-based first-sentence fallback).
			if (!existing.title?.trim() && transcript.length > 0) {
				try {
					const taskId = await llmTaskQueue.enqueue(
						generateTitleTask,
						{ text: transcript, language: existing.language ?? result.language ?? 'de' },
						{ refType: 'memo', refId: memoId, priority: 1 }
					);
					console.info('[memoro] enqueued title task', { taskId, memoId });
				} catch (err) {
					// Don't let queue failures break the transcription path.
					// Worst case the memo stays untitled — the user can still
					// rename it manually.
					console.warn('[memoro] failed to enqueue title task:', err);
				}
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			await memoTable.update(memoId, {
				processingStatus: 'failed',
				metadata: { ...(((await memoTable.get(memoId))?.metadata as object) ?? {}), error: msg },
				updatedAt: new Date().toISOString(),
			});
		}
	},

	/** Update a memo's fields. */
	async update(
		id: string,
		data: Partial<Pick<LocalMemo, 'title' | 'intro' | 'transcript' | 'language' | 'isPublic'>>
	) {
		const diff: Partial<LocalMemo> = {
			...data,
			updatedAt: new Date().toISOString(),
		};

		// If the user is overwriting the title manually, clear the
		// auto-generated titleSource marker so the DetailView stops
		// showing "via Mana-Server" — the title is now the user's, not
		// the LLM's. We only touch metadata when title was actually in
		// the diff so we don't accidentally wipe other metadata fields
		// (e.g. STT failure markers) on a non-title update.
		if ('title' in data) {
			const existing = await memoTable.get(id);
			const existingMetadata = (existing?.metadata as Record<string, unknown> | null) ?? {};
			if ('titleSource' in existingMetadata) {
				const { titleSource: _omit, ...rest } = existingMetadata;
				void _omit;
				diff.metadata = rest;
			}
		}

		await encryptRecord('memos', diff);
		await memoTable.update(id, diff);
	},

	// Archive ops (delegated to shared factory)
	archive: (id: string) => memoArchive.archive(id),
	unarchive: (id: string) => memoArchive.unarchive(id),

	/**
	 * Flip a memo's visibility. M6 soft-migration: writes both
	 * `visibility` and the legacy `isPublic` mirror so older readers
	 * (search index, server snapshots) keep working until the M6.1
	 * hard-drop. Public memos surface in the user's website embed
	 * once a memoro embed-resolver lands.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await memoTable.get(id);
		if (!existing) throw new Error(`Memo ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? (existing.isPublic ? 'public' : 'space');
		if (before === next) return;

		const stamp = new Date().toISOString();
		await memoTable.update(id, {
			visibility: next,
			isPublic: next === 'public',
			visibilityChangedAt: stamp,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: stamp,
		});

		emitDomainEvent('VisibilityChanged', 'memoro', 'memos', id, {
			recordId: id,
			collection: 'memos',
			before,
			after: next,
		});
	},

	/** Pin a memo. */
	async pin(id: string) {
		await memoTable.update(id, {
			isPinned: true,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Unpin a memo. */
	async unpin(id: string) {
		await memoTable.update(id, {
			isPinned: false,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a memo. */
	async delete(id: string) {
		await memoArchive.softDelete(id);
		MemoroEvents.memoDeleted();
	},
};
