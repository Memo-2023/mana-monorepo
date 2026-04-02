/**
 * Cross-App Search for ManaLinkPicker
 *
 * Searches across multiple apps' IndexedDB databases to find
 * records that can be linked to. Used by the ManaLinkPicker component.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';

// ─── Minimal types for search ───────────────────────────────

interface SearchableRecord extends BaseRecord {
	title?: string;
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	description?: string;
	startDate?: string;
	allDay?: boolean;
	color?: string;
	deletedAt?: string | null;
}

interface SearchResult {
	app: string;
	collection: string;
	id: string;
	title: string;
	subtitle?: string;
	color?: string;
}

// ─── Readers (opened lazily on first search) ────────────────

let calendarReader: ReturnType<typeof createLocalStore> | null = null;
let contactsReader: ReturnType<typeof createLocalStore> | null = null;

async function getCalendarReader() {
	if (!calendarReader) {
		calendarReader = createLocalStore({
			appId: 'calendar',
			collections: [{ name: 'events', indexes: ['startDate'] }],
		});
		await calendarReader.initialize();
	}
	return calendarReader;
}

async function getContactsReader() {
	if (!contactsReader) {
		contactsReader = createLocalStore({
			appId: 'contacts',
			collections: [{ name: 'contacts', indexes: ['firstName', 'lastName', 'email'] }],
		});
		await contactsReader.initialize();
	}
	return contactsReader;
}

// ─── Search ─────────────────────────────────────────────────

function matchesQuery(record: SearchableRecord, q: string): boolean {
	const lower = q.toLowerCase();
	const fields = [
		record.title,
		record.name,
		record.firstName,
		record.lastName,
		record.email,
		record.description,
	];
	return fields.some((f) => f?.toLowerCase().includes(lower));
}

/**
 * Search across calendar events and contacts.
 * Todo tasks are excluded since we're linking FROM a todo task.
 */
export async function searchCrossApp(query: string): Promise<SearchResult[]> {
	const results: SearchResult[] = [];
	const q = query.toLowerCase();

	// Search calendar events
	try {
		const cal = await getCalendarReader();
		const events = await cal.collection<SearchableRecord>('events').getAll();
		for (const event of events) {
			if (event.deletedAt) continue;
			if (matchesQuery(event, q)) {
				const startDate = event.startDate
					? new Date(event.startDate).toLocaleDateString('de-DE', {
							day: 'numeric',
							month: 'short',
						})
					: undefined;
				results.push({
					app: 'calendar',
					collection: 'events',
					id: event.id,
					title: event.title ?? 'Termin',
					subtitle: startDate,
					color: (event.color as string) ?? '#3B82F6',
				});
			}
		}
	} catch {
		// Calendar DB may not exist yet
	}

	// Search contacts
	try {
		const con = await getContactsReader();
		const contacts = await con.collection<SearchableRecord>('contacts').getAll();
		for (const contact of contacts) {
			if (contact.deletedAt) continue;
			if (matchesQuery(contact, q)) {
				const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
				results.push({
					app: 'contacts',
					collection: 'contacts',
					id: contact.id,
					title: name || contact.email || 'Kontakt',
					subtitle: contact.email,
					color: '#EC4899',
				});
			}
		}
	} catch {
		// Contacts DB may not exist yet
	}

	return results.slice(0, 20);
}
