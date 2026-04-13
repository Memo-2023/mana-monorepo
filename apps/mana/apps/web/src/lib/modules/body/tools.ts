import type { ModuleTool } from '$lib/data/tools/types';

export const bodyTools: ModuleTool[] = [
	{
		name: 'start_workout',
		module: 'body',
		description: 'Startet ein neues Workout',
		parameters: [
			{ name: 'title', type: 'string', description: 'Name des Workouts', required: false },
		],
		async execute(params) {
			const { bodyStore } = await import('./stores/body.svelte');
			const workout = await bodyStore.startWorkout({
				title: (params.title as string) ?? 'Workout',
			});
			return {
				success: true,
				data: workout,
				message: `Workout "${params.title ?? 'Workout'}" gestartet`,
			};
		},
	},
	{
		name: 'finish_workout',
		module: 'body',
		description: 'Beendet das aktuelle Workout',
		parameters: [
			{ name: 'workoutId', type: 'string', description: 'ID des Workouts', required: true },
		],
		async execute(params) {
			const { bodyStore } = await import('./stores/body.svelte');
			await bodyStore.finishWorkout(params.workoutId as string);
			return { success: true, message: 'Workout beendet' };
		},
	},
	{
		name: 'log_measurement',
		module: 'body',
		description: 'Loggt eine Koerpermessung (Gewicht, Koerperfett, etc.)',
		parameters: [
			{
				name: 'type',
				type: 'string',
				description: 'Art der Messung',
				required: true,
				enum: ['weight', 'bodyFat', 'chest', 'waist', 'hips', 'biceps', 'thighs'],
			},
			{ name: 'value', type: 'number', description: 'Messwert', required: true },
			{
				name: 'unit',
				type: 'string',
				description: 'Einheit',
				required: false,
				enum: ['kg', 'lbs', 'percent', 'cm', 'in'],
			},
		],
		async execute(params) {
			const { bodyStore } = await import('./stores/body.svelte');
			const measurement = await bodyStore.logMeasurement({
				type: params.type as 'weight',
				value: params.value as number,
				unit: (params.unit as 'kg') ?? 'kg',
			});
			return {
				success: true,
				data: measurement,
				message: `${params.type}: ${params.value} ${params.unit ?? 'kg'}`,
			};
		},
	},
];
