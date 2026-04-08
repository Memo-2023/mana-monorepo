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
import { TodoEvents } from '@mana/shared-utils/analytics';

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
		TodoEvents.taskCreated(!!data.dueDate);
		return plaintextSnapshot;
	},

	/**
	 * Create a task from a voice recording. Inserts a placeholder task
	 * immediately so the user sees instant feedback in the list, then
	 * fills in the real title once mana-stt returns the transcript.
	 *
	 * No date/priority parsing yet — that needs an LLM pass and is its
	 * own follow-up. The user can edit the task inline like any other.
	 */
	async createFromVoice(blob: Blob, _durationMs: number, language = 'de') {
		const placeholder = await this.createTask({ title: 'Sprachaufgabe wird transkribiert…' });
		void this.transcribeIntoTask(placeholder.id, blob, language);
		return placeholder;
	},

	/**
	 * Upload an audio blob to /api/v1/voice/transcribe and write the
	 * transcript into an existing task as the new title. On failure,
	 * surfaces the error inline so the user isn't left with the
	 * "wird transkribiert…" placeholder forever.
	 */
	async transcribeIntoTask(taskId: string, blob: Blob, language?: string): Promise<void> {
		try {
			const form = new FormData();
			const ext = blob.type.includes('webm')
				? '.webm'
				: blob.type.includes('mp4')
					? '.m4a'
					: '.audio';
			form.append('file', blob, `task${ext}`);
			if (language) form.append('language', language);

			const response = await fetch('/api/v1/voice/transcribe', {
				method: 'POST',
				body: form,
			});
			if (!response.ok) {
				const text = await response.text();
				throw new Error(text || `HTTP ${response.status}`);
			}
			const result = (await response.json()) as { text: string };
			const transcript = (result.text ?? '').trim() || 'Sprachaufgabe';
			await this.updateTask(taskId, { title: transcript });
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			await this.updateTask(taskId, { title: `Sprachaufgabe (Fehler: ${msg})` });
		}
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
		if (task?.scheduledBlockId) {
			await deleteBlock(task.scheduledBlockId);
		}

		await taskTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		TodoEvents.taskDeleted();
	},

	async completeTask(id: string) {
		await taskTable.update(id, {
			isCompleted: true,
			completedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		TodoEvents.taskCompleted();
	},

	async uncompleteTask(id: string) {
		await taskTable.update(id, {
			isCompleted: false,
			completedAt: null,
			updatedAt: new Date().toISOString(),
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
