/**
 * Contacts module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

export interface LocalContact extends BaseRecord {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	company?: string;
	jobTitle?: string;
	street?: string;
	city?: string;
	postalCode?: string;
	country?: string;
	address?: string;
	notes?: string;
	photoUrl?: string;
	birthday?: string;
	linkedin?: string;
	twitter?: string;
	instagram?: string;
	github?: string;
	website?: string;
	tags?: string[];
	tagIds?: string[];
	isFavorite?: boolean;
	isArchived?: boolean;
}

// ─── Shared Contact Type ──────────────────────────────────

export interface Contact {
	id: string;
	firstName?: string | null;
	lastName?: string | null;
	displayName?: string | null;
	email?: string | null;
	phone?: string | null;
	mobile?: string | null;
	company?: string | null;
	jobTitle?: string | null;
	street?: string | null;
	city?: string | null;
	postalCode?: string | null;
	country?: string | null;
	notes?: string | null;
	photoUrl?: string | null;
	birthday?: string | null;
	website?: string | null;
	linkedin?: string | null;
	twitter?: string | null;
	instagram?: string | null;
	github?: string | null;
	tags: Array<{ id: string; name: string; color: string | null }>;
	tagIds: string[];
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export type SortField = 'firstName' | 'lastName';
export type ContactFilter = 'all' | 'favorites' | 'hasPhone' | 'hasEmail' | 'incomplete';
export type ContactView = 'grid' | 'alphabet';
