/**
 * Tasks Store — Mutation-Only Service
 *
 * When a task is scheduled on the calendar, a TimeBlock is created.
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { taskTable } from '../collections';
import { toTask } from '../queries';
import type { LocalTask, TaskPriority, Subtask } from '../types';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { transcribeAudio } from '$lib/voice/transcribe';
import { TodoEvents } from '@mana/shared-utils/analytics';
import { tagCollection, type LocalTag } from '@mana/shared-stores';

/**
 * Normalize a tag-name-ish string for fuzzy comparison: lowercase,
 * strip diacritics, collapse whitespace. "Steuern" and "steuern " and
 * "Stéuern" all collapse to "steuern".
 *
 * Exported only so the matching unit tests can call it directly —
 * production code goes through matchLabelsToTagsPure.
 */
export function normalizeTagName(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ');
}

/**
 * Pure label-to-tag matcher. Given a list of free-text label hints
 * from the LLM and a list of {id, name} tag entries, return the IDs
 * of tags that match. No I/O, no Dexie — easy to unit-test.
 *
 * Match rules (in order, first hit wins per label):
 *   1. exact normalized match
 *   2. one is a substring of the other (both sides ≥3 chars to avoid
 *      noise — "ab" inside "abenteuer" would otherwise hit)
 *
 * Never invents new tags. The store wrapper around this never creates
 * one either — auto-creating tags from voice transcripts would clutter
 * the user's tag list with one-off "shopping" / "einkauf" / "groceries"
 * near-duplicates.
 */
export function matchLabelsToTagsPure(
	labels: string[],
	tags: { id: string; name: string }[]
): string[] {
	if (!labels.length || !tags.length) return [];
	const normalizedTags = tags.map((t) => ({ id: t.id, norm: normalizeTagName(t.name) }));
	const matched = new Set<string>();
	for (const raw of labels) {
		const norm = normalizeTagName(raw);
		if (!norm) continue;
		const exact = normalizedTags.find((t) => t.norm === norm);
		if (exact) {
			matched.add(exact.id);
			continue;
		}
		if (norm.length < 3) continue;
		const sub = normalizedTags.find(
			(t) => t.norm.length >= 3 && (t.norm.includes(norm) || norm.includes(t.norm))
		);
		if (sub) matched.add(sub.id);
	}
	return [...matched];
}

/**
 * Store-side wrapper: pull the tag list from the local Dexie collection
 * and delegate to the pure matcher. Returns an empty list if the tag
 * collection can't be read for any reason.
 */
async function matchLabelsToTagIds(labels: string[]): Promise<string[]> {
	if (!labels.length) return [];
	let tags: LocalTag[];
	try {
		tags = await tagCollection.getAll();
	} catch {
		return [];
	}
	return matchLabelsToTagsPure(labels, tags);
}

export const tasksStore = {
	async createTask(data: {
		title: string;
		description?: string;
		dueDate?: string;
		priority?: TaskPriority;
		projectId?: string | null;
		subtasks?: Subtask[];
		recurrenceRule?: string;
		estimatedDuration?: number;
		labelIds?: string[];
		// Optional: schedule on calendar
		scheduleStartDate?: string; // YYYY-MM-DD
		scheduleStartTime?: string; // HH:mm
	}) {
		const existing = await taskTable.toArray();
		const count = existing.filter((t) => !t.deletedAt).length;
		const taskId = crypto.randomUUID();

		let scheduledBlockId: string | null = null;

		// Create TimeBlock if scheduling on calendar
		if (data.scheduleStartDate) {
			const startISO = data.scheduleStartTime
				? `${data.scheduleStartDate}T${data.scheduleStartTime}:00`
				: `${data.scheduleStartDate}T09:00:00`;
			const durationMs = data.estimatedDuration ? data.estimatedDuration * 1000 : 3600000;
			const endISO = new Date(new Date(startISO).getTime() + durationMs).toISOString();

			scheduledBlockId = await createBlock({
				startDate: startISO,
				endDate: endISO,
				allDay: !data.scheduleStartTime,
				kind: 'scheduled',
				type: 'task',
				sourceModule: 'todo',
				sourceId: taskId,
				title: data.title,
				projectId: data.projectId ?? null,
				recurrenceRule: data.recurrenceRule ?? null,
			});
		}

		const newLocal: LocalTask = {
			id: taskId,
			title: data.title,
			description: data.description,
			priority: data.priority ?? 'medium',
			isCompleted: false,
			dueDate: data.dueDate ?? null,
			scheduledBlockId,
			estimatedDuration: data.estimatedDuration ?? null,
			order: count,
			subtasks: data.subtasks,
			metadata: data.labelIds && data.labelIds.length > 0 ? { labelIds: data.labelIds } : undefined,
		};

		if (data.projectId !== undefined) {
			newLocal.projectId = data.projectId;
		}

		// Snapshot plaintext for the return value before encryptRecord
		// mutates `newLocal` in place. Callers (UI) need plaintext title
		// + description; only the on-disk row is ciphertext.
		const plaintextSnapshot = toTask({ ...newLocal });
		await encryptRecord('tasks', newLocal);
		await taskTable.add(newLocal);
		emitDomainEvent('TaskCreated', 'todo', 'tasks', taskId, {
			taskId,
			title: plaintextSnapshot.title,
			dueDate: data.dueDate,
			priority: data.priority,
			projectId: data.projectId,
			labelIds: data.labelIds,
		});
		TodoEvents.taskCreated(!!data.dueDate);
		return plaintextSnapshot;
	},

	/**
	 * Create a task from a voice recording. Inserts a placeholder task
	 * immediately so the user sees instant feedback in the list, then
	 * runs transcription + LLM parsing in the background and updates
	 * the task with the structured result (title, due date, priority,
	 * labels). If the LLM step fails or mana-llm is unavailable, the
	 * server returns the raw transcript as the title and the user gets
	 * a usable task either way — see /api/v1/voice/parse-task.
	 */
	async createFromVoice(blob: Blob, _durationMs: number, language = 'de') {
		const placeholder = await this.createTask({ title: 'Sprachaufgabe wird transkribiert…' });
		void this.transcribeAndParseIntoTask(placeholder.id, blob, language);
		return placeholder;
	},

	/**
	 * Two-step pipeline: STT → LLM parse → updateTask. Both steps go
	 * through server-side proxies (/api/v1/voice/transcribe and
	 * /api/v1/voice/parse-task) so the browser never sees STT or LLM
	 * credentials. Failures at either step surface inline as the task
	 * title so the user isn't left with the "wird transkribiert…"
	 * placeholder forever.
	 */
	async transcribeAndParseIntoTask(taskId: string, blob: Blob, language?: string): Promise<void> {
		try {
			// Step 1: speech to text (shared helper)
			const sttResult = await transcribeAudio(blob, language);
			const transcript = sttResult.text;
			if (!transcript) {
				await this.updateTask(taskId, { title: 'Sprachaufgabe' });
				return;
			}

			// Step 2: structured extraction. For voice we always apply the
			// LLM's title since the raw transcript ("erinnere mich morgen
			// daran die steuererklärung zu machen") is much noisier than
			// what the user actually wants to see in the list.
			const parsed = await this.parseTaskText(transcript, language);
			const matchedLabelIds = await matchLabelsToTagIds(parsed.labels);

			const update: Record<string, unknown> = {
				title: parsed.title,
				transcriptModel: sttResult.model,
			};
			if (parsed.dueDate) update.dueDate = parsed.dueDate;
			if (parsed.priority) update.priority = parsed.priority;
			await this.updateTask(taskId, update);
			if (matchedLabelIds.length > 0) {
				await this.updateLabels(taskId, matchedLabelIds);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			await this.updateTask(taskId, { title: `Sprachaufgabe (Fehler: ${msg})` });
		}
	},

	/**
	 * Background enrichment for typed quick-add. Runs the same LLM
	 * parser the voice flow uses, but with a stricter rule: only update
	 * the task if the LLM actually found structured info (dueDate or
	 * priority). For typed input the user already sees their exact text
	 * as the title — silently rewriting it to a "cleaner" version when
	 * the LLM didn't find a date/priority would be surprising and
	 * occasionally wrong, so we leave it alone in that case.
	 */
	async enrichTaskFromText(taskId: string, text: string, language = 'de'): Promise<void> {
		const trimmed = text.trim();
		if (!trimmed) return;
		try {
			const parsed = await this.parseTaskText(trimmed, language);
			const matchedLabelIds = await matchLabelsToTagIds(parsed.labels);
			// Only touch the task if the LLM found something we'd actually
			// add — date, priority, or a label that maps to an existing tag.
			if (!parsed.dueDate && !parsed.priority && matchedLabelIds.length === 0) return;

			const update: Record<string, unknown> = {};
			if (parsed.title && parsed.title !== trimmed) update.title = parsed.title;
			if (parsed.dueDate) update.dueDate = parsed.dueDate;
			if (parsed.priority) update.priority = parsed.priority;
			if (Object.keys(update).length > 0) {
				await this.updateTask(taskId, update);
			}
			if (matchedLabelIds.length > 0) {
				await this.updateLabels(taskId, matchedLabelIds);
			}
		} catch {
			// Silent — typed quick-add already gave the user a usable
			// task; an LLM failure should never undo that.
		}
	},

	/**
	 * POST a transcript or typed text to the parse-task proxy and
	 * return the structured result. The proxy already falls back to
	 * { title: text, dueDate: null, ... } when mana-llm is unreachable
	 * or returns garbage, so callers can use the result unconditionally.
	 */
	async parseTaskText(
		text: string,
		language = 'de'
	): Promise<{
		title: string;
		dueDate: string | null;
		priority: 'low' | 'medium' | 'high' | null;
		labels: string[];
	}> {
		const response = await fetch('/api/v1/voice/parse-task', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ transcript: text, language }),
		});
		if (!response.ok) {
			return { title: text, dueDate: null, priority: null, labels: [] };
		}
		return (await response.json()) as {
			title: string;
			dueDate: string | null;
			priority: 'low' | 'medium' | 'high' | null;
			labels: string[];
		};
	},

	async updateTask(id: string, data: Record<string, unknown>) {
		const raw = await taskTable.get(id);
		if (!raw) return;
		// task.title/description are encrypted on disk — decrypt a clone so
		// fallbacks like `data.title ?? task.title` forward plaintext to
		// the linked TimeBlock instead of leaking ciphertext.
		const task = await decryptRecord('tasks', { ...raw });

		// Handle schedule changes via TimeBlock
		const schedStartDate = data._scheduleStartDate as string | null | undefined;
		const schedStartTime = data._scheduleStartTime as string | null | undefined;
		const recurrenceRule = data.recurrenceRule as string | null | undefined;
		delete data._scheduleStartDate;
		delete data._scheduleStartTime;
		// recurrenceRule lives on the TimeBlock — never on the task row
		delete data.recurrenceRule;

		if (schedStartDate !== undefined) {
			if (schedStartDate) {
				// Schedule or reschedule
				const startISO = schedStartTime
					? `${schedStartDate}T${schedStartTime}:00`
					: `${schedStartDate}T09:00:00`;
				const estDuration =
					(data.estimatedDuration as number | undefined) ?? task.estimatedDuration;
				const durationMs = estDuration ? estDuration * 1000 : 3600000;
				const endISO = new Date(new Date(startISO).getTime() + durationMs).toISOString();

				if (task.scheduledBlockId) {
					// Update existing block
					await updateBlock(task.scheduledBlockId, {
						startDate: startISO,
						endDate: endISO,
						allDay: !schedStartTime,
						title: (data.title as string) ?? task.title,
						...(recurrenceRule !== undefined ? { recurrenceRule } : {}),
					});
				} else {
					// Create new block
					const blockId = await createBlock({
						startDate: startISO,
						endDate: endISO,
						allDay: !schedStartTime,
						kind: 'scheduled',
						type: 'task',
						sourceModule: 'todo',
						sourceId: id,
						title: (data.title as string) ?? task.title,
						projectId: (data.projectId as string) ?? task.projectId ?? null,
						recurrenceRule: recurrenceRule ?? null,
					});
					data.scheduledBlockId = blockId;
				}
			} else {
				// Unschedule: delete the TimeBlock
				if (task.scheduledBlockId) {
					await deleteBlock(task.scheduledBlockId);
					data.scheduledBlockId = null;
				}
			}
		}

		// Keep TimeBlock title in sync if title changed
		if (data.title !== undefined && task.scheduledBlockId && schedStartDate === undefined) {
			await updateBlock(task.scheduledBlockId, { title: data.title as string });
		}

		// Update recurrence on existing TimeBlock when not also rescheduling
		if (recurrenceRule !== undefined && schedStartDate === undefined && task.scheduledBlockId) {
			await updateBlock(task.scheduledBlockId, { recurrenceRule });
		}

		const diff: Record<string, unknown> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('tasks', diff);
		await taskTable.update(id, diff);
		TodoEvents.taskEdited();
	},

	async deleteTask(id: string) {
		const task = await taskTable.get(id);
		const decrypted = task ? await decryptRecord('tasks', { ...task }) : null;
		if (task?.scheduledBlockId) {
			await deleteBlock(task.scheduledBlockId);
		}

		await taskTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('TaskDeleted', 'todo', 'tasks', id, {
			taskId: id,
			title: (decrypted?.title as string) ?? '',
		});
		TodoEvents.taskDeleted();
	},

	async completeTask(id: string) {
		const task = await taskTable.get(id);
		const decrypted = task ? await decryptRecord('tasks', { ...task }) : null;
		const now = new Date().toISOString();
		const wasOverdue = task?.dueDate != null && (task.dueDate as string) < now.slice(0, 10);
		await taskTable.update(id, {
			isCompleted: true,
			completedAt: now,
			updatedAt: now,
		});
		emitDomainEvent('TaskCompleted', 'todo', 'tasks', id, {
			taskId: id,
			title: (decrypted?.title as string) ?? '',
			projectId: task?.projectId,
			wasOverdue,
		});
		TodoEvents.taskCompleted();
	},

	async uncompleteTask(id: string) {
		const task = await taskTable.get(id);
		const decrypted = task ? await decryptRecord('tasks', { ...task }) : null;
		await taskTable.update(id, {
			isCompleted: false,
			completedAt: null,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('TaskUncompleted', 'todo', 'tasks', id, {
			taskId: id,
			title: (decrypted?.title as string) ?? '',
		});
	},

	async toggleComplete(id: string) {
		const task = await taskTable.get(id);
		if (!task) return;

		if (task.isCompleted) {
			await this.uncompleteTask(id);
		} else {
			await this.completeTask(id);
		}
	},

	async updateSubtasks(id: string, subtasks: Subtask[]) {
		const diff: Record<string, unknown> = {
			subtasks,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('tasks', diff);
		await taskTable.update(id, diff);
		emitDomainEvent('SubtasksUpdated', 'todo', 'tasks', id, {
			taskId: id,
			total: subtasks.length,
			completed: subtasks.filter((s) => s.isCompleted).length,
		});
	},

	async updateLabels(id: string, labelIds: string[]) {
		const raw = await taskTable.get(id);
		// metadata is in the encrypted-fields list — decrypt before
		// merging labelIds in, otherwise we'd splice a plaintext key
		// into a ciphertext blob.
		const existing = raw ? await decryptRecord('tasks', { ...raw }) : null;
		const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
		const diff: Record<string, unknown> = {
			metadata: { ...existingMeta, labelIds },
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('tasks', diff);
		await taskTable.update(id, diff);
	},

	async reorderTasks(taskIds: string[]) {
		for (let i = 0; i < taskIds.length; i++) {
			await taskTable.update(taskIds[i], {
				order: i,
				updatedAt: new Date().toISOString(),
			});
		}
	},
};
