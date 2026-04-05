/**
 * Contacts Integration Store — Task assignment via Contacts app.
 *
 * Checks if the Contacts module is available and provides search functionality.
 */

import { db } from '$lib/data/database';

export interface ContactResult {
	id: string;
	name: string;
	email?: string;
}

let isAvailable = $state(false);
let cache = $state<Map<string, ContactResult>>(new Map());

async function checkAvailability() {
	try {
		const tables = db.tables.map((t) => t.name);
		isAvailable = tables.includes('contacts');
	} catch {
		isAvailable = false;
	}
}

// Check on init
checkAvailability();

export const contactsStore = {
	get isAvailable() {
		return isAvailable;
	},

	async searchContacts(query: string): Promise<ContactResult[]> {
		if (!isAvailable || !query.trim()) return [];

		try {
			const q = query.toLowerCase();
			const all = await db.table('contacts').toArray();
			return all
				.filter((c: any) => {
					if (c.deletedAt) return false;
					const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase();
					const email = (c.email ?? '').toLowerCase();
					return name.includes(q) || email.includes(q);
				})
				.slice(0, 10)
				.map((c: any) => {
					const result: ContactResult = {
						id: c.id,
						name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
						email: c.email,
					};
					cache.set(c.id, result);
					return result;
				});
		} catch {
			return [];
		}
	},

	getFromCache(id: string): ContactResult | undefined {
		return cache.get(id);
	},
};
