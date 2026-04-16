/**
 * Todo Tools — LLM-accessible operations for the task module.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { tasksStore } from './stores/tasks.svelte';
import { taskTable, taskTagTable } from './collections';
import { toTask, getTaskStats } from './queries';
import { decryptRecords } from '$lib/data/crypto';
import { filterByScope } from '$lib/data/ai/scope-context';
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
	{
		name: 'list_tasks',
		module: 'todo',
		description:
			'Listet Tasks mit Titel, Faelligkeit und Prioritaet auf. Nutze diese, wenn der Nutzer fragt welche Tasks er hat oder eine Liste sehen will.',
		parameters: [
			{
				name: 'filter',
				type: 'string',
				description: 'Welche Tasks zeigen',
				required: false,
				enum: ['open', 'completed', 'overdue', 'today', 'all'],
			},
			{
				name: 'limit',
				type: 'number',
				description: 'Maximale Anzahl (default: 20)',
				required: false,
			},
		],
		async execute(params) {
			const all = await taskTable.toArray();
			const active = all.filter((t) => !t.deletedAt);
			const decrypted = await decryptRecords<LocalTask>('tasks', active);
			const scoped = await filterByScope(decrypted, async (t) => {
				const links = await taskTagTable.where('taskId').equals(t.id).toArray();
				return links.filter((l) => !l.deletedAt).map((l) => l.tagId);
			});
			const tasks = scoped.map(toTask);

			const filter = (params.filter as string) ?? 'open';
			const today = new Date().toISOString().split('T')[0];
			let filtered = tasks;
			if (filter === 'open') filtered = tasks.filter((t) => !t.isCompleted);
			else if (filter === 'completed') filtered = tasks.filter((t) => t.isCompleted);
			else if (filter === 'overdue')
				filtered = tasks.filter(
					(t) => !t.isCompleted && t.dueDate != null && (t.dueDate as string) < today
				);
			else if (filter === 'today')
				filtered = tasks.filter((t) => !t.isCompleted && (t.dueDate as string) === today);

			const limit = (params.limit as number) ?? 20;
			const list = filtered.slice(0, limit).map((t) => ({
				id: t.id,
				title: t.title,
				dueDate: t.dueDate,
				priority: t.priority,
				isCompleted: t.isCompleted,
			}));

			return {
				success: true,
				data: list,
				message:
					list.length === 0
						? `Keine ${filter} Tasks`
						: list
								.map(
									(t) =>
										`• [${t.id}] ${t.title}${t.dueDate ? ` (faellig ${t.dueDate})` : ''}${t.priority === 'high' ? ' [HOHE PRIO]' : ''}`
								)
								.join('\n'),
			};
		},
	},
	{
		name: 'complete_tasks_by_title',
		module: 'todo',
		description:
			'Markiert alle offenen Tasks mit dem gegebenen Titel als erledigt (case-insensitive Substring-Match). Nutze diese, wenn der Nutzer eine Task per Name erledigen will und du nicht ihre ID kennst.',
		parameters: [
			{ name: 'titleMatch', type: 'string', description: 'Titel oder Teil davon', required: true },
		],
		async execute(params) {
			const all = await taskTable.toArray();
			const active = all.filter((t) => !t.deletedAt && !t.isCompleted);
			const decrypted = await decryptRecords<LocalTask>('tasks', active);
			const tasks = decrypted.map(toTask);

			const needle = (params.titleMatch as string).toLowerCase().trim();
			const matches = tasks.filter((t) => t.title.toLowerCase().includes(needle));

			if (matches.length === 0) {
				return { success: false, message: `Kein offener Task mit "${params.titleMatch}" gefunden` };
			}

			for (const t of matches) {
				await tasksStore.completeTask(t.id);
			}

			return {
				success: true,
				data: { completed: matches.length, titles: matches.map((m) => m.title) },
				message: `${matches.length} Task(s) erledigt: ${matches.map((m) => m.title).join(', ')}`,
			};
		},
	},
];
