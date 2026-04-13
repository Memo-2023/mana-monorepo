import type { ModuleTool } from '$lib/data/tools/types';
import { habitsStore } from './stores/habits.svelte';
import { habitTable } from './collections';

export const habitsTools: ModuleTool[] = [
	{
		name: 'log_habit',
		module: 'habits',
		description: 'Loggt ein Habit (z.B. Sport, Meditation, Lesen)',
		parameters: [
			{ name: 'habitId', type: 'string', description: 'ID des Habits', required: true },
			{ name: 'note', type: 'string', description: 'Optionale Notiz', required: false },
		],
		async execute(params) {
			const log = await habitsStore.logHabit(
				params.habitId as string,
				params.note as string | undefined
			);
			return { success: true, data: log, message: 'Habit geloggt' };
		},
	},
	{
		name: 'get_habits',
		module: 'habits',
		description: 'Gibt alle aktiven Habits zurueck',
		parameters: [],
		async execute() {
			const all = await habitTable.toArray();
			const active = all.filter((h) => !h.deletedAt && !h.isArchived);
			return {
				success: true,
				data: active.map((h) => ({ id: h.id, title: h.title, icon: h.icon, color: h.color })),
				message: `${active.length} Habits`,
			};
		},
	},
	{
		name: 'create_habit',
		module: 'habits',
		description: 'Erstellt ein neues Habit',
		parameters: [
			{ name: 'title', type: 'string', description: 'Name des Habits', required: true },
			{ name: 'icon', type: 'string', description: 'Emoji-Icon', required: false },
			{ name: 'color', type: 'string', description: 'Hex-Farbe', required: false },
		],
		async execute(params) {
			const habit = await habitsStore.createHabit({
				title: params.title as string,
				icon: (params.icon as string) ?? 'star',
				color: (params.color as string) ?? '#6366f1',
			});
			return { success: true, data: habit, message: `Habit "${habit.title}" erstellt` };
		},
	},
];
