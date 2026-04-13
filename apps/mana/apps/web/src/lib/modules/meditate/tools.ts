import type { ModuleTool } from '$lib/data/tools/types';
import type { MeditateCategory } from './types';

export const meditateTools: ModuleTool[] = [
	{
		name: 'log_meditation',
		module: 'meditate',
		description: 'Loggt eine Meditations-Session (Stille, Atemuebung oder Body Scan)',
		parameters: [
			{ name: 'durationMinutes', type: 'number', description: 'Dauer in Minuten', required: true },
			{
				name: 'category',
				type: 'string',
				description: 'Art',
				required: false,
				enum: ['silence', 'breathing', 'bodyscan'],
			},
		],
		async execute(params) {
			const { meditateStore } = await import('./stores/meditate.svelte');
			const session = await meditateStore.logSession({
				presetId: null,
				category: ((params.category as string) ?? 'silence') as MeditateCategory,
				startedAt: new Date(Date.now() - (params.durationMinutes as number) * 60000).toISOString(),
				durationSec: (params.durationMinutes as number) * 60,
				completed: true,
			});
			return {
				success: true,
				data: session,
				message: `${params.durationMinutes} min Meditation geloggt`,
			};
		},
	},
];
