import { registerEntity } from '$lib/entities/registry';
import { habitsStore } from './stores/habits.svelte';
import type { EntityDescriptor } from '$lib/entities/types';

const habitsEntity: EntityDescriptor = {
	appId: 'habits',
	collection: 'habits',

	getDisplayData: (item) => ({
		title: `${item.emoji as string} ${item.title as string}`,
		subtitle: undefined,
	}),

	dragType: 'habit',
	acceptsDropFrom: ['task'],

	transformIncoming: {
		task: (source) => ({
			title: source.title as string,
			emoji: '\ud83d\udcaa',
			color: '#6366f1',
		}),
	},

	createItem: async (data) => {
		const habit = await habitsStore.createHabit({
			title: data.title as string,
			emoji: (data.emoji as string) ?? '\u2b50',
			color: (data.color as string) ?? '#6366f1',
		});
		return habit.id;
	},
};

registerEntity(habitsEntity);
