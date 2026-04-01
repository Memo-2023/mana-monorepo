/**
 * Contacts module — collection accessors and guest seed data.
 *
 * Uses the 'contacts' table in the unified DB.
 */

import { db } from '$lib/data/database';
import type { LocalContact } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const contactTable = db.table<LocalContact>('contacts');

// ─── Guest Seed ────────────────────────────────────────────

export const CONTACTS_GUEST_SEED = {
	contacts: [
		{
			id: 'guest-contact-1',
			firstName: 'Anna',
			lastName: 'Mueller',
			email: 'anna.mueller@example.com',
			phone: '+49 30 12345678',
			company: 'Tech Solutions GmbH',
			jobTitle: 'Product Manager',
			address: 'Berlin, Deutschland',
			notes: 'Ansprechpartnerin fuer das neue Projekt',
			birthday: '1990-06-15',
			tags: ['Arbeit'],
			isFavorite: true,
			isArchived: false,
		},
		{
			id: 'guest-contact-2',
			firstName: 'Max',
			lastName: 'Schmidt',
			email: 'max.schmidt@example.com',
			phone: '+49 171 9876543',
			company: 'Design Studio',
			jobTitle: 'UX Designer',
			address: 'Muenchen, Deutschland',
			tags: ['Arbeit', 'Freunde'],
			isFavorite: false,
			isArchived: false,
		},
		{
			id: 'guest-contact-3',
			firstName: 'Lisa',
			lastName: 'Weber',
			email: 'lisa.w@example.com',
			phone: '+49 40 87654321',
			company: '',
			jobTitle: '',
			address: 'Hamburg, Deutschland',
			notes: 'Geburtstag nicht vergessen!',
			birthday: '1992-03-22',
			tags: ['Familie'],
			isFavorite: true,
			isArchived: false,
		},
	] satisfies LocalContact[],
};
