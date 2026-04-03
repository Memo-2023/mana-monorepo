/**
 * Unified App Registrations — All app descriptors in one file.
 *
 * Apps with entity capabilities (todo, calendar, contacts) include
 * collection, paramKey, dragType, etc. for cross-module DnD and linking.
 * All other apps only declare identity + views.
 */

import { registerApp } from './registry';
import { Plus } from '@manacore/shared-icons';

// ── Apps with entity capabilities ───────────────────────────

registerApp({
	id: 'todo',
	name: 'Todo',
	color: '#8B5CF6',
	views: {
		list: { load: () => import('$lib/modules/todo/ListView.svelte') },
		detail: { load: () => import('$lib/modules/todo/views/DetailView.svelte') },
	},
	contextMenuActions: [
		{
			id: 'new-task',
			label: 'Neue Aufgabe',
			icon: Plus,
			action: () =>
				window.dispatchEvent(
					new CustomEvent('mana:quick-action', { detail: { app: 'todo', action: 'new' } })
				),
		},
	],
	collection: 'tasks',
	paramKey: 'taskId',
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
	getDisplayData: (item) => ({
		title: (item.title as string) || 'Aufgabe',
		subtitle: item.dueDate ? new Date(item.dueDate as string).toLocaleDateString('de') : undefined,
	}),
	createItem: async (data) => {
		const { tasksStore } = await import('$lib/modules/todo/stores/tasks.svelte');
		const task = await tasksStore.createTask(
			data as { title: string; dueDate?: string; description?: string }
		);
		return task.id;
	},
});

registerApp({
	id: 'calendar',
	name: 'Kalender',
	color: '#3B82F6',
	views: {
		list: { load: () => import('$lib/modules/calendar/ListView.svelte') },
		detail: { load: () => import('$lib/modules/calendar/views/DetailView.svelte') },
	},
	contextMenuActions: [
		{
			id: 'new-event',
			label: 'Neuer Termin',
			icon: Plus,
			action: () =>
				window.dispatchEvent(
					new CustomEvent('mana:quick-action', { detail: { app: 'calendar', action: 'new' } })
				),
		},
	],
	collection: 'events',
	paramKey: 'eventId',
	dragType: 'event',
	acceptsDropFrom: ['task', 'contact'],
	transformIncoming: {
		task: (source) => {
			const dueDate = (source.dueDate as string) || new Date().toISOString();
			const start = new Date(dueDate);
			const end = new Date(start.getTime() + 60 * 60 * 1000);
			return {
				title: source.title as string,
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				description: source.description as string | undefined,
			};
		},
		contact: (source) => {
			const name = [source.firstName, source.lastName].filter(Boolean).join(' ');
			const now = new Date();
			const end = new Date(now.getTime() + 60 * 60 * 1000);
			return {
				title: `Treffen mit ${name}`,
				startTime: now.toISOString(),
				endTime: end.toISOString(),
			};
		},
	},
	getDisplayData: (item) => ({
		title: (item.title as string) || 'Termin',
		subtitle: item.startDate
			? new Date(item.startDate as string).toLocaleDateString('de', {
					day: '2-digit',
					month: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
				})
			: undefined,
	}),
	createItem: async (data) => {
		const { db } = await import('$lib/data/database');
		const { eventsStore } = await import('$lib/modules/calendar/stores/events.svelte');

		const calendars = await db.table('calendars').toArray();
		const defaultCal = calendars.find((c: Record<string, unknown>) => !c.deletedAt);
		const calendarId = (defaultCal?.id as string) ?? 'default';

		const result = await eventsStore.createEvent({
			calendarId,
			title: data.title as string,
			startTime: data.startTime as string,
			endTime: data.endTime as string,
			description: (data.description as string) ?? undefined,
		});

		if (!result.success || !result.data) throw new Error(result.error || 'Failed to create event');
		return result.data.id;
	},
});

registerApp({
	id: 'contacts',
	name: 'Kontakte',
	color: '#22C55E',
	views: {
		list: { load: () => import('$lib/modules/contacts/ListView.svelte') },
		detail: { load: () => import('$lib/modules/contacts/views/DetailView.svelte') },
	},
	contextMenuActions: [
		{
			id: 'new-contact',
			label: 'Neuer Kontakt',
			icon: Plus,
			action: () =>
				window.dispatchEvent(
					new CustomEvent('mana:quick-action', { detail: { app: 'contacts', action: 'new' } })
				),
		},
	],
	collection: 'contacts',
	paramKey: 'contactId',
	dragType: 'contact',
	getDisplayData: (item) => {
		const name = [item.firstName, item.lastName].filter(Boolean).join(' ');
		return {
			title: name || (item.email as string) || 'Kontakt',
			subtitle: (item.company as string) ?? undefined,
		};
	},
	// Contacts are drag sources only -- dropping onto contacts doesn't create a new contact
});

// ── Apps without entity capabilities ────────────────────────

registerApp({
	id: 'habits',
	name: 'Habits',
	color: '#8B5CF6',
	views: {
		list: { load: () => import('$lib/modules/habits/ListView.svelte') },
	},
	contextMenuActions: [
		{
			id: 'new-habit',
			label: 'Neues Habit',
			icon: Plus,
			action: () =>
				window.dispatchEvent(
					new CustomEvent('mana:quick-action', { detail: { app: 'habits', action: 'new' } })
				),
		},
	],
	collection: 'habits',
	paramKey: 'habitId',
	dragType: 'habit',
	acceptsDropFrom: ['task'],
	transformIncoming: {
		task: (source) => ({
			title: source.title as string,
			icon: 'barbell',
			color: '#6366f1',
		}),
	},
	getDisplayData: (item) => ({
		title: item.title as string,
		subtitle: undefined,
	}),
	createItem: async (data) => {
		const { habitsStore } = await import('$lib/modules/habits/stores/habits.svelte');
		const habit = await habitsStore.createHabit({
			title: data.title as string,
			icon: (data.icon as string) ?? 'star',
			color: (data.color as string) ?? '#6366f1',
		});
		return habit.id;
	},
});

registerApp({
	id: 'notes',
	name: 'Notes',
	color: '#F59E0B',
	views: {
		list: { load: () => import('$lib/modules/notes/ListView.svelte') },
	},
	contextMenuActions: [
		{
			id: 'new-note',
			label: 'Neue Notiz',
			icon: Plus,
			action: () =>
				window.dispatchEvent(
					new CustomEvent('mana:quick-action', { detail: { app: 'notes', action: 'new' } })
				),
		},
	],
	collection: 'notes',
	paramKey: 'noteId',
	dragType: 'note',
	acceptsDropFrom: ['task', 'contact'],
	transformIncoming: {
		task: (source) => ({
			title: source.title as string,
			content: (source.description as string) ?? '',
		}),
		contact: (source) => ({
			title: `${[source.firstName, source.lastName].filter(Boolean).join(' ')}`,
			content: `Kontakt: ${[source.firstName, source.lastName].filter(Boolean).join(' ')}`,
		}),
	},
	getDisplayData: (item) => ({
		title: (item.title as string) || 'Notiz',
		subtitle: undefined,
	}),
	createItem: async (data) => {
		const { notesStore } = await import('$lib/modules/notes/stores/notes.svelte');
		const note = await notesStore.createNote({
			title: data.title as string,
			content: (data.content as string) ?? '',
		});
		return note.id;
	},
});

registerApp({
	id: 'finance',
	name: 'Finance',
	color: '#22C55E',
	views: {
		list: { load: () => import('$lib/modules/finance/ListView.svelte') },
	},
	collection: 'transactions',
	paramKey: 'transactionId',
	dragType: 'transaction',
	acceptsDropFrom: [],
	getDisplayData: (item) => ({
		title: (item.description as string) || 'Transaktion',
		subtitle: item.amount ? `${item.type === 'income' ? '+' : '-'}${item.amount}` : undefined,
	}),
	createItem: async (data) => {
		const { financeStore } = await import('$lib/modules/finance/stores/finance.svelte');
		const tx = await financeStore.addTransaction({
			type: 'expense',
			amount: (data.amount as number) ?? 0,
			description: (data.title as string) ?? (data.description as string) ?? '',
		});
		return tx.id;
	},
});

registerApp({
	id: 'places',
	name: 'Places',
	color: '#0EA5E9',
	views: {
		list: { load: () => import('$lib/modules/places/ListView.svelte') },
		detail: { load: () => import('$lib/modules/places/views/DetailView.svelte') },
	},
	collection: 'places',
	paramKey: 'placeId',
	dragType: 'place',
	acceptsDropFrom: ['contact'],
	transformIncoming: {
		contact: (source) => ({
			name: `Treffen mit ${[source.firstName, source.lastName].filter(Boolean).join(' ')}`,
			latitude: 0,
			longitude: 0,
		}),
	},
	getDisplayData: (item) => ({
		title: (item.name as string) || 'Ort',
		subtitle: (item.address as string) ?? undefined,
	}),
	createItem: async (data) => {
		const { placesStore } = await import('$lib/modules/places/stores/places.svelte');
		const place = await placesStore.createPlace({
			name: (data.name as string) ?? 'Neuer Ort',
			latitude: (data.latitude as number) ?? 0,
			longitude: (data.longitude as number) ?? 0,
		});
		return place.id;
	},
});

registerApp({
	id: 'chat',
	name: 'Chat',
	color: '#6366F1',
	views: {
		list: { load: () => import('$lib/modules/chat/ListView.svelte') },
	},
});

registerApp({
	id: 'context',
	name: 'Context',
	color: '#7C3AED',
	views: {
		list: { load: () => import('$lib/modules/context/ListView.svelte') },
	},
});

registerApp({
	id: 'times',
	name: 'Times',
	color: '#F59E0B',
	views: {
		list: { load: () => import('$lib/modules/times/ListView.svelte') },
		detail: { load: () => import('$lib/modules/times/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'zitare',
	name: 'Zitare',
	color: '#EC4899',
	views: {
		list: { load: () => import('$lib/modules/zitare/ListView.svelte') },
		detail: { load: () => import('$lib/modules/zitare/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'cards',
	name: 'Cards',
	color: '#EF4444',
	views: {
		list: { load: () => import('$lib/modules/cards/ListView.svelte') },
		detail: { load: () => import('$lib/modules/cards/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'picture',
	name: 'Picture',
	color: '#8B5CF6',
	views: {
		list: { load: () => import('$lib/modules/picture/ListView.svelte') },
	},
});

registerApp({
	id: 'mukke',
	name: 'Mukke',
	color: '#F97316',
	views: {
		list: { load: () => import('$lib/modules/mukke/ListView.svelte') },
		detail: { load: () => import('$lib/modules/mukke/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'photos',
	name: 'Photos',
	color: '#06B6D4',
	views: {
		list: { load: () => import('$lib/modules/photos/ListView.svelte') },
	},
});

registerApp({
	id: 'storage',
	name: 'Storage',
	color: '#6B7280',
	views: {
		list: { load: () => import('$lib/modules/storage/ListView.svelte') },
		detail: { load: () => import('$lib/modules/storage/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'nutriphi',
	name: 'Nutriphi',
	color: '#22C55E',
	views: {
		list: { load: () => import('$lib/modules/nutriphi/ListView.svelte') },
	},
});

registerApp({
	id: 'planta',
	name: 'Planta',
	color: '#16A34A',
	views: {
		list: { load: () => import('$lib/modules/planta/ListView.svelte') },
		detail: { load: () => import('$lib/modules/planta/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'presi',
	name: 'Presi',
	color: '#A855F7',
	views: {
		list: { load: () => import('$lib/modules/presi/ListView.svelte') },
		detail: { load: () => import('$lib/modules/presi/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'inventar',
	name: 'Inventar',
	color: '#78716C',
	views: {
		list: { load: () => import('$lib/modules/inventar/ListView.svelte') },
		detail: { load: () => import('$lib/modules/inventar/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'memoro',
	name: 'Memoro',
	color: '#F59E0B',
	views: {
		list: { load: () => import('$lib/modules/memoro/ListView.svelte') },
		detail: { load: () => import('$lib/modules/memoro/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'questions',
	name: 'Questions',
	color: '#2563EB',
	views: {
		list: { load: () => import('$lib/modules/questions/ListView.svelte') },
		detail: { load: () => import('$lib/modules/questions/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'skilltree',
	name: 'SkillTree',
	color: '#D946EF',
	views: {
		list: { load: () => import('$lib/modules/skilltree/ListView.svelte') },
		detail: { load: () => import('$lib/modules/skilltree/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'moodlit',
	name: 'Moodlit',
	color: '#F97316',
	views: {
		list: { load: () => import('$lib/modules/moodlit/ListView.svelte') },
	},
});

registerApp({
	id: 'citycorners',
	name: 'CityCorners',
	color: '#14B8A6',
	views: {
		list: { load: () => import('$lib/modules/citycorners/ListView.svelte') },
		detail: { load: () => import('$lib/modules/citycorners/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'uload',
	name: 'uLoad',
	color: '#0EA5E9',
	views: {
		list: { load: () => import('$lib/modules/uload/ListView.svelte') },
		detail: { load: () => import('$lib/modules/uload/views/DetailView.svelte') },
	},
});

registerApp({
	id: 'calc',
	name: 'Calc',
	color: '#6B7280',
	views: {
		list: { load: () => import('$lib/modules/calc/ListView.svelte') },
	},
});

registerApp({
	id: 'automations',
	name: 'Automations',
	color: '#8B5CF6',
	views: {
		list: { load: () => import('$lib/modules/automations/ListView.svelte') },
	},
});

registerApp({
	id: 'playground',
	name: 'Playground',
	color: '#9CA3AF',
	views: {
		list: { load: () => import('$lib/modules/playground/ListView.svelte') },
	},
});
