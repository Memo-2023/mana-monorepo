import type { ModuleTool } from '$lib/data/tools/types';

export const timesTools: ModuleTool[] = [
	{
		name: 'start_timer',
		module: 'times',
		description: 'Startet einen Zeitmess-Timer',
		parameters: [
			{
				name: 'description',
				type: 'string',
				description: 'Beschreibung der Taetigkeit',
				required: false,
			},
		],
		async execute(params) {
			const { timerStore } = await import('./stores/timer.svelte');
			await timerStore.start({ description: params.description as string | undefined });
			return {
				success: true,
				message: `Timer gestartet${params.description ? `: "${params.description}"` : ''}`,
			};
		},
	},
	{
		name: 'stop_timer',
		module: 'times',
		description: 'Stoppt den laufenden Timer',
		parameters: [],
		async execute() {
			const { timerStore } = await import('./stores/timer.svelte');
			const entry = await timerStore.stop();
			if (!entry) return { success: false, message: 'Kein Timer aktiv' };
			return {
				success: true,
				data: entry,
				message: `Timer gestoppt (${Math.round(entry.duration / 60)} min)`,
			};
		},
	},
];
