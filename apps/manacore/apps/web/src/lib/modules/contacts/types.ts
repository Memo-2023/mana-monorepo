/**
 * Contacts module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

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

// ─── Shared Contact Type ──────────────────────────────────

export interface Contact {
	id: string;
	userId: string;
	firstName?: string | null;
	lastName?: string | null;
	displayName?: string | null;
	email?: string | null;
	phone?: string | null;
	company?: string | null;
	jobTitle?: string | null;
	notes?: string | null;
	photoUrl?: string | null;
	birthday?: string | null;
	tags: Array<{ id: string; name: string; color: string | null }>;
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export type SortField = 'firstName' | 'lastName';
export type ContactFilter = 'all' | 'favorites' | 'hasPhone' | 'hasEmail' | 'incomplete';
export type ContactView = 'grid' | 'alphabet';
