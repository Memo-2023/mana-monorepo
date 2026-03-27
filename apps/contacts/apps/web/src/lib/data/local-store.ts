/**
 * Contacts App — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Contact data.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestContacts } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalContact extends BaseRecord {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	company?: string;
	jobTitle?: string;
	address?: string;
	notes?: string;
	photoUrl?: string;
	birthday?: string;
	tags?: string[];
	isFavorite?: boolean;
	isArchived?: boolean;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const contactsLocalStore = createLocalStore({
	appId: 'contacts',
	collections: [
		{
			name: 'contacts',
			indexes: ['firstName', 'lastName', 'email', 'company', 'isFavorite', 'isArchived'],
			guestSeed: guestContacts,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessor
export const contactCollection = contactsLocalStore.collection<LocalContact>('contacts');
