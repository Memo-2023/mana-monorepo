/**
 * Todo Tools — LLM-accessible operations for the task module.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { tasksStore } from './stores/tasks.svelte';
import { taskTable } from './collections';
import { toTask, getTaskStats } from './queries';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalTask } from './types';

export const todoTools: ModuleTool[] = [
	{
		name: 'create_task',
		module: 'todo',
		description: 'Erstellt einen neuen Task mit optionalem Faelligkeitsdatum und Prioritaet',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Tasks', required: true },
			{
				name: 'dueDate',
				type: 'string',
				description: 'Faelligkeitsdatum (YYYY-MM-DD)',
				required: false,
			},
			{
				name: 'priority',
				type: 'string',
				description: 'Prioritaet',
				required: false,
				enum: ['low', 'medium', 'high'],
			},
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
		],
		async execute(params) {
			const task = await tasksStore.createTask({
				title: params.title as string,
				dueDate: params.dueDate as string | undefined,
				priority: (params.priority as 'low' | 'medium' | 'high') ?? undefined,
				description: params.description as string | undefined,
			});
			return { success: true, data: task, message: `Task "${task.title}" erstellt` };
		},
	},
	{
		name: 'complete_task',
		module: 'todo',
		description: 'Markiert einen Task als erledigt',
		parameters: [{ name: 'taskId', type: 'string', description: 'ID des Tasks', required: true }],
		async execute(params) {
			await tasksStore.completeTask(params.taskId as string);
			return { success: true, message: 'Task erledigt' };
		},
	},
	{
		name: 'get_task_stats',
		module: 'todo',
		description:
			'Gibt Statistiken ueber alle Tasks zurueck (total, erledigt, ueberfaellig, heute faellig)',
		parameters: [],
		async execute() {
			const all = await taskTable.toArray();
			const active = all.filter((t) => !t.deletedAt);
			const decrypted = await decryptRecords<LocalTask>('tasks', active);
			const tasks = decrypted.map(toTask);
			const stats = getTaskStats(tasks);
			return {
				success: true,
				data: stats,
				message: `${stats.total} Tasks (${stats.completed} erledigt, ${stats.overdue} ueberfaellig)`,
			};
		},
	},
];
