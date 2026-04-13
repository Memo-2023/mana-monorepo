import type { ModuleTool } from '$lib/data/tools/types';
export const sleepTools: ModuleTool[] = [
	{
		name: 'log_sleep',
		module: 'sleep',
		description: 'Loggt Schlaf (Schlafenszeit, Aufwachzeit, Qualitaet 1-5)',
		parameters: [
			{ name: 'bedtime', type: 'string', description: 'Schlafenszeit (HH:mm)', required: true },
			{ name: 'wakeTime', type: 'string', description: 'Aufwachzeit (HH:mm)', required: true },
			{ name: 'quality', type: 'number', description: 'Qualitaet 1-5', required: true },
		],
		async execute(params) {
			const { sleepStore } = await import('./stores/sleep.svelte');
			const today = new Date().toISOString().split('T')[0];
			const entry = await sleepStore.logSleep({
				date: today,
				bedtime: params.bedtime as string,
				wakeTime: params.wakeTime as string,
				quality: params.quality as number,
			});
			return {
				success: true,
				data: entry,
				message: `Schlaf geloggt: ${params.bedtime}–${params.wakeTime} (Qualitaet: ${params.quality}/5)`,
			};
		},
	},
];
