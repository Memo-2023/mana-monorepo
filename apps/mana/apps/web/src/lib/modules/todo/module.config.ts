import type { ModuleConfig } from '$lib/data/module-registry';

export const todoModuleConfig: ModuleConfig = {
	appId: 'todo',
	tables: [
		{ name: 'tasks' },
		{ name: 'todoProjects', syncName: 'projects' },
		{ name: 'taskLabels' },
		{ name: 'reminders' },
		{ name: 'boardViews' },
	],
};
