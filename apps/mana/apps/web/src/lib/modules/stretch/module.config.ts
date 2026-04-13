import type { ModuleConfig } from '$lib/data/module-registry';

export const stretchModuleConfig: ModuleConfig = {
	appId: 'stretch',
	tables: [
		{ name: 'stretchExercises' },
		{ name: 'stretchRoutines' },
		{ name: 'stretchSessions' },
		{ name: 'stretchAssessments' },
		{ name: 'stretchReminders' },
	],
};
