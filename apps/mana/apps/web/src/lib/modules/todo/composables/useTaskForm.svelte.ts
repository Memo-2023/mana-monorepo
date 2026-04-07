/**
 * useTaskForm — Shared form state logic for TaskEditModal & inline editing.
 */

import type { Task, TaskPriority, Subtask } from '../types';
import { reminderTable } from '../collections';
import { createBlock, updateBlock, deleteBlock, getBlock } from '$lib/data/time-blocks/service';

export interface TaskFormState {
	title: string;
	description: string;
	dueDate: string;
	dueTime: string;
	startDate: string;
	priority: TaskPriority;
	status: string;
	selectedLabelIds: string[];
	subtasks: Subtask[];
	recurrenceRule: string;
	storyPoints: number | null;
	effectiveDuration: number | null;
	funRating: number | null;
	reminderMinutes: number | null;
	showDeleteConfirm: boolean;
	isLoading: boolean;
}

export function useTaskForm() {
	let title = $state('');
	let description = $state('');
	let dueDate = $state('');
	let dueTime = $state('');
	let startDate = $state('');
	let priority = $state<TaskPriority>('medium');
	let status = $state('pending');
	let selectedLabelIds = $state<string[]>([]);
	let subtasks = $state<Subtask[]>([]);
	let recurrenceRule = $state('');
	let storyPoints = $state<number | null>(null);
	let effectiveDuration = $state<number | null>(null);
	let funRating = $state<number | null>(null);
	let reminderMinutes = $state<number | null>(null);
	let showDeleteConfirm = $state(false);
	let isLoading = $state(false);

	async function initFromTask(task: Task) {
		title = task.title;
		description = task.description ?? '';
		dueDate = task.dueDate ? task.dueDate.split('T')[0] : '';
		// Load scheduled time + recurrence from TimeBlock if scheduled
		recurrenceRule = '';
		if (task.scheduledBlockId) {
			const block = await getBlock(task.scheduledBlockId);
			if (block) {
				startDate = block.startDate.split('T')[0];
				dueTime = block.startDate.includes('T')
					? block.startDate.split('T')[1]?.substring(0, 5)
					: '';
				recurrenceRule = block.recurrenceRule ?? '';
			}
		} else {
			dueTime = '';
			startDate = '';
		}
		priority = task.priority;
		status = task.status;
		subtasks = task.subtasks ? [...task.subtasks] : [];
		effectiveDuration = task.estimatedDuration ?? null;
		showDeleteConfirm = false;
		isLoading = false;

		const meta = task.metadata as Record<string, unknown> | null;
		selectedLabelIds = (meta?.labelIds as string[]) ?? [];
		storyPoints = (meta?.storyPoints as number) ?? null;
		funRating = (meta?.funRating as number) ?? null;
		reminderMinutes = null;

		// Load existing reminder
		loadReminder(task.id);
	}

	async function loadReminder(taskId: string) {
		try {
			const reminders = await reminderTable.where('taskId').equals(taskId).toArray();
			const active = reminders.find((r) => !r.deletedAt && r.status === 'pending');
			if (active) {
				reminderMinutes = active.minutesBefore;
			}
		} catch {
			// Reminders table may not exist yet
		}
	}

	function buildUpdatePayload(): Record<string, unknown> {
		const update: Record<string, unknown> = {
			title: title.trim(),
			description: description || undefined,
			priority,
			dueDate: dueDate ? new Date(dueDate).toISOString() : null,
			// Schedule fields are handled via _scheduleStartDate and _scheduleStartTime
			// for the task store to create/update/delete the TimeBlock
			_scheduleStartDate: startDate || null,
			_scheduleStartTime: dueTime || null,
			estimatedDuration: effectiveDuration,
			recurrenceRule: recurrenceRule || null,
			subtasks: subtasks.length > 0 ? subtasks : null,
			isCompleted: status === 'completed',
			completedAt: status === 'completed' ? new Date().toISOString() : null,
			metadata: {
				labelIds: selectedLabelIds,
				storyPoints,
				funRating,
			},
		};
		return update;
	}

	async function persistReminder(taskId: string) {
		try {
			// Remove old reminders
			const existing = await reminderTable.where('taskId').equals(taskId).toArray();
			for (const r of existing) {
				if (!r.deletedAt) {
					await reminderTable.update(r.id, {
						deletedAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
				}
			}

			// Create new if set
			if (reminderMinutes != null && dueDate) {
				await reminderTable.add({
					id: crypto.randomUUID(),
					taskId,
					minutesBefore: reminderMinutes,
					type: 'push',
					status: 'pending',
				});
			}
		} catch {
			// Silently ignore if table doesn't exist
		}
	}

	return {
		get title() {
			return title;
		},
		set title(v: string) {
			title = v;
		},
		get description() {
			return description;
		},
		set description(v: string) {
			description = v;
		},
		get dueDate() {
			return dueDate;
		},
		set dueDate(v: string) {
			dueDate = v;
		},
		get dueTime() {
			return dueTime;
		},
		set dueTime(v: string) {
			dueTime = v;
		},
		get startDate() {
			return startDate;
		},
		set startDate(v: string) {
			startDate = v;
		},
		get priority() {
			return priority;
		},
		set priority(v: TaskPriority) {
			priority = v;
		},
		get status() {
			return status;
		},
		set status(v: string) {
			status = v;
		},
		get selectedLabelIds() {
			return selectedLabelIds;
		},
		set selectedLabelIds(v: string[]) {
			selectedLabelIds = v;
		},
		get subtasks() {
			return subtasks;
		},
		set subtasks(v: Subtask[]) {
			subtasks = v;
		},
		get recurrenceRule() {
			return recurrenceRule;
		},
		set recurrenceRule(v: string) {
			recurrenceRule = v;
		},
		get storyPoints() {
			return storyPoints;
		},
		set storyPoints(v: number | null) {
			storyPoints = v;
		},
		get effectiveDuration() {
			return effectiveDuration;
		},
		set effectiveDuration(v: number | null) {
			effectiveDuration = v;
		},
		get funRating() {
			return funRating;
		},
		set funRating(v: number | null) {
			funRating = v;
		},
		get reminderMinutes() {
			return reminderMinutes;
		},
		set reminderMinutes(v: number | null) {
			reminderMinutes = v;
		},
		get showDeleteConfirm() {
			return showDeleteConfirm;
		},
		set showDeleteConfirm(v: boolean) {
			showDeleteConfirm = v;
		},
		get isLoading() {
			return isLoading;
		},
		set isLoading(v: boolean) {
			isLoading = v;
		},

		initFromTask,
		buildUpdatePayload,
		persistReminder,
	};
}
