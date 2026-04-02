/**
 * Todo QuickInputBar Adapter
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import type { QuickInputItem } from '@manacore/shared-ui';
import { goto } from '$app/navigation';
import { db } from '$lib/data/database';
import { parseTaskInput, resolveTaskIds, formatParsedTaskPreview } from './utils/task-parser';
import type { LocalTask } from './types';

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Neue Aufgabe oder suchen...',
		appIcon: 'todo',
		deferSearch: true,
		createText: 'Erstellen',
		emptyText: 'Keine Aufgaben gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			const tasks = await db.table<LocalTask>('tasks').toArray();
			return tasks
				.filter(
					(t) =>
						!t.deletedAt &&
						!t.isCompleted &&
						(t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
				)
				.slice(0, 10)
				.map((t) => ({
					id: t.id,
					title: t.title || '',
					subtitle: t.dueDate ? new Date(t.dueDate).toLocaleDateString('de-DE') : 'Keine Frist',
				}));
		},

		onSelect(item: QuickInputItem) {
			goto(`/todo?task=${item.id}`);
		},

		onParseCreate(query) {
			if (!query.trim()) return null;
			const parsed = parseTaskInput(query);
			return {
				title: `"${parsed.title}" erstellen`,
				subtitle: formatParsedTaskPreview(parsed) || 'Neue Aufgabe',
			};
		},

		async onCreate(query) {
			if (!query.trim()) return;
			const parsed = parseTaskInput(query);
			const allTags = await db.table('tags').toArray();
			const resolved = resolveTaskIds(parsed, allTags);
			const { tasksStore } = await import('./stores/tasks.svelte');
			await tasksStore.createTask({
				title: resolved.title,
				dueDate: resolved.dueDate,
				priority: resolved.priority,
				labelIds: resolved.labelIds,
			});
		},
	};
}
