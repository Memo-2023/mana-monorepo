import { registerEntity } from '$lib/entities/registry';
import { tasksStore } from './stores/tasks.svelte';
import type { EntityDescriptor } from '$lib/entities/types';

const todoEntity: EntityDescriptor = {
	appId: 'todo',
	collection: 'tasks',
	paramKey: 'taskId',

	getDisplayData: (item) => ({
		title: (item.title as string) || 'Aufgabe',
		subtitle: item.dueDate ? new Date(item.dueDate as string).toLocaleDateString('de') : undefined,
	}),

	dragType: 'task',
	acceptsDropFrom: ['event', 'contact'],

	transformIncoming: {
		event: (source) => ({
			title: source.title as string,
			dueDate: source.startDate as string,
			description: source.description as string | undefined,
		}),
		contact: (source) => ({
			title: `Kontaktieren: ${[source.firstName, source.lastName].filter(Boolean).join(' ')}`,
		}),
	},

	createItem: async (data) => {
		const task = await tasksStore.createTask(
			data as { title: string; dueDate?: string; description?: string }
		);
		return task.id;
	},
};

registerEntity(todoEntity);
