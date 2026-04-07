/**
 * QR Export Service
 *
 * Builds a QR-encoded snapshot of the user's most relevant contacts,
 * upcoming calendar events and todo tasks. Reads from the local
 * IndexedDB (Dexie) directly — there is no longer a per-app HTTP backend
 * to call, all module data lives in the unified `mana` database via
 * the local-first sync layer.
 */

import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { toTimeBlock } from '$lib/data/time-blocks/queries';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
import type { LocalContact } from '$lib/modules/contacts/types';
import type { LocalEvent } from '$lib/modules/calendar/types';
import type { LocalTask } from '$lib/modules/todo/types';
import type { UserDataSummary } from './my-data';
import {
	createManaQRExport,
	type EncodeResult,
	type ContactInput,
	type EventInput,
	type TodoInput,
	type ContactRelation,
	type TodoPriority,
} from '@mana/qr-export';

/** Data collected for QR export. */
export interface QRExportData {
	contacts: LocalContact[];
	events: Array<LocalEvent & { startTime: string; endTime: string | null; isAllDay: boolean }>;
	tasks: LocalTask[];
	userData: UserDataSummary | null;
}

/** Result of QR export generation. */
export interface QRExportResult {
	encodeResult: EncodeResult;
	stats: {
		contactCount: number;
		eventCount: number;
		todoCount: number;
	};
}

// ─── Local helpers (replace the deleted *Service modules) ─────

/** Best-effort display name for a contact. Mirrors the legacy
 *  contactsService.getDisplayName so QR output stays consistent. */
function getContactDisplayName(c: LocalContact): string {
	const anyC = c as unknown as Record<string, unknown>;
	const displayName = anyC.displayName as string | undefined;
	if (displayName) return displayName;
	if (c.firstName && c.lastName) return `${c.firstName} ${c.lastName}`;
	if (c.firstName) return c.firstName;
	if (c.lastName) return c.lastName;
	if (c.email) return c.email;
	return 'Unknown';
}

/** Top N favorite (or recently updated) contacts. */
async function loadFavoriteContacts(limit: number): Promise<LocalContact[]> {
	const all = await db.table<LocalContact>('contacts').toArray();
	const live = all.filter((c) => !c.deletedAt && !c.isArchived);
	live.sort((a, b) => {
		// Favorites first, then by updatedAt descending.
		if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
		return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
	});
	return live.slice(0, limit);
}

/** Upcoming calendar events for the next `days` days. Pulls scheduling
 *  info from the linked timeBlocks (events table no longer holds dates
 *  directly after the v3 schema migration). */
async function loadUpcomingEvents(days: number): Promise<QRExportData['events']> {
	const horizon = new Date(Date.now() + days * 86_400_000).toISOString();
	const now = new Date().toISOString();

	const blocks = await db.table<LocalTimeBlock>('timeBlocks').toArray();
	const candidateBlocks = blocks
		.filter(
			(b) =>
				!b.deletedAt &&
				b.sourceModule === 'calendar' &&
				b.type === 'event' &&
				b.startDate >= now &&
				b.startDate <= horizon
		)
		.sort((a, b) => a.startDate.localeCompare(b.startDate));
	const upcomingBlocks = await decryptRecords('timeBlocks', candidateBlocks);

	const allEvents = await db.table<LocalEvent>('events').toArray();
	const visibleEvents = allEvents.filter((e) => !e.deletedAt);
	const decryptedEvents = await decryptRecords('events', visibleEvents);
	const eventsById = new Map<string, LocalEvent>();
	for (const e of decryptedEvents) {
		eventsById.set(e.id, e);
	}

	return upcomingBlocks
		.map((block) => {
			const tb = toTimeBlock(block);
			const event = eventsById.get(block.sourceId);
			if (!event) return null;
			return {
				...event,
				startTime: tb.startDate,
				endTime: tb.endDate,
				isAllDay: tb.allDay,
			};
		})
		.filter((e): e is NonNullable<typeof e> => e !== null);
}

/** Tasks with a dueDate inside the next `days` days, soft-deleted out. */
async function loadUpcomingTasks(days: number): Promise<LocalTask[]> {
	const horizon = new Date(Date.now() + days * 86_400_000).toISOString();
	const all = await db.table<LocalTask>('tasks').toArray();
	const visible = all.filter(
		(t) => !t.deletedAt && !t.isCompleted && t.dueDate && t.dueDate <= horizon
	);
	const decrypted = await decryptRecords('tasks', visible);
	return decrypted.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
}

// ─── Mappers (unchanged in spirit, retargeted at the local types) ───

function mapContactToInput(contact: LocalContact): ContactInput {
	const displayName = getContactDisplayName(contact);
	const relation: ContactRelation = 3; // default Freund

	const anyC = contact as unknown as Record<string, unknown>;
	return {
		name: displayName,
		phone: (anyC.mobile as string | undefined) ?? contact.phone,
		email: contact.email,
		relation,
		importance: contact.isFavorite ? 100 : 0,
	};
}

function mapEventToInput(event: QRExportData['events'][number]): EventInput {
	return {
		title: event.title ?? '',
		start: new Date(event.startTime),
		end: new Date(event.endTime ?? event.startTime),
		location: (event as { location?: string }).location,
		allDay: event.isAllDay,
	};
}

function mapTaskToInput(task: LocalTask): TodoInput {
	const priorityMap: Record<string, TodoPriority> = {
		urgent: 1,
		high: 1,
		medium: 2,
		low: 3,
	};
	const priority = priorityMap[task.priority ?? 'medium'] ?? 2;

	return {
		title: task.title,
		priority,
		dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
		completed: task.isCompleted,
	};
}

// ─── Public service ───────────────────────────────────────────

export const qrExportService = {
	/** Collect contacts/events/tasks needed for the QR export. */
	async collectExportData(): Promise<QRExportData> {
		const [contacts, events, tasks] = await Promise.all([
			loadFavoriteContacts(10),
			loadUpcomingEvents(30),
			loadUpcomingTasks(30),
		]);
		return { contacts, events, tasks, userData: null };
	},

	/** Encode an already-collected dataset into a QR result. */
	generateExport(
		data: QRExportData,
		options?: {
			maxContacts?: number;
			maxEvents?: number;
			maxTodos?: number;
		}
	): QRExportResult {
		const maxContacts = options?.maxContacts ?? 5;
		const maxEvents = options?.maxEvents ?? 10;
		const maxTodos = options?.maxTodos ?? 15;

		const contactInputs = data.contacts.map(mapContactToInput);
		const eventInputs = data.events.map(mapEventToInput);
		const taskInputs = data.tasks.map(mapTaskToInput);

		const builder = createManaQRExport();

		if (data.userData?.user) {
			builder.user({
				n: data.userData.user.name || data.userData.user.email.split('@')[0],
				l: 'de',
				z: 'Europe/Berlin',
			});
		} else {
			builder.userName('Mana User');
		}

		builder.contactsFrom(contactInputs, maxContacts);
		builder.eventsFrom(eventInputs, maxEvents);
		builder.todosFrom(taskInputs, maxTodos);

		const encodeResult = builder.encode();

		return {
			encodeResult,
			stats: {
				contactCount: Math.min(contactInputs.length, maxContacts),
				eventCount: Math.min(eventInputs.length, maxEvents),
				todoCount: Math.min(taskInputs.filter((t) => !t.completed).length, maxTodos),
			},
		};
	},

	/** One-shot helper used by the QR Export modal. */
	async generateFullExport(
		userData?: UserDataSummary | null,
		options?: {
			maxContacts?: number;
			maxEvents?: number;
			maxTodos?: number;
		}
	): Promise<QRExportResult> {
		const data = await this.collectExportData();
		data.userData = userData || null;
		return this.generateExport(data, options);
	},
};
