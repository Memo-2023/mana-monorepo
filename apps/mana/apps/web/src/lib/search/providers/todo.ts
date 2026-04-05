import { db } from '$lib/data/database';
import { getManaApp } from '@mana/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('todo');

export const todoSearchProvider: SearchProvider = {
	appId: 'todo',
	appName: 'Todo',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['task', 'project'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search tasks
		const tasks = await db.table('tasks').toArray();
		for (const task of tasks) {
			if (task.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'title', value: task.title, weight: 1.0 },
					{ name: 'description', value: task.description, weight: 0.7 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: task.id,
					type: 'task',
					appId: 'todo',
					title: task.title,
					subtitle: truncateSubtitle(task.description),
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/todo?task=${task.id}`,
					score,
					matchedField,
				});
			}
		}

		// Search projects
		const projects = await db.table('todoProjects').toArray();
		for (const project of projects) {
			if (project.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[{ name: 'name', value: project.name, weight: 1.0 }],
				query
			);
			if (score > 0) {
				results.push({
					id: project.id,
					type: 'project',
					appId: 'todo',
					title: project.name,
					subtitle: 'Projekt',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/todo?project=${project.id}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
