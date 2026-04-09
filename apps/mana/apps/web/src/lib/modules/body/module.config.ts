import type { ModuleConfig } from '$lib/data/module-registry';

export const bodyModuleConfig: ModuleConfig = {
	appId: 'body',
	tables: [
		{ name: 'bodyExercises' },
		{ name: 'bodyRoutines' },
		{ name: 'bodyWorkouts' },
		{ name: 'bodySets' },
		{ name: 'bodyMeasurements' },
		{ name: 'bodyChecks' },
		{ name: 'bodyPhases' },
	],
};
