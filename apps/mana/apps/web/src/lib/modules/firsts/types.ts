import type { BaseRecord } from '@mana/local-store';

// ─── Enums ────────────────────────────────────────────────

export type FirstStatus = 'dream' | 'lived';

export type FirstCategory =
	| 'culinary'
	| 'adventure'
	| 'travel'
	| 'people'
	| 'career'
	| 'creative'
	| 'nature'
	| 'culture'
	| 'health'
	| 'tech'
	| 'other';

export type FirstPriority = 1 | 2 | 3; // 1 = someday, 2 = this year, 3 = asap

export type WouldRepeat = 'yes' | 'no' | 'definitely';

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalFirst extends BaseRecord {
	title: string;
	status: FirstStatus;
	category: FirstCategory;

	// Dream phase
	motivation: string | null;
	priority: FirstPriority | null;

	// Lived phase
	date: string | null; // ISO date (YYYY-MM-DD)
	note: string | null;
	expectation: string | null;
	reality: string | null;
	rating: number | null; // 1-5
	wouldRepeat: WouldRepeat | null;

	// Social
	personIds: string[];
	sharedWith: string | null;

	// Rich media
	mediaIds: string[];
	audioNoteId: string | null;
	placeId: string | null;

	// Meta
	isPinned: boolean;
	isArchived: boolean;
}

// ─── Domain Types ─────────────────────────────────────────

export interface First {
	id: string;
	title: string;
	status: FirstStatus;
	category: FirstCategory;
	motivation: string | null;
	priority: FirstPriority | null;
	date: string | null;
	note: string | null;
	expectation: string | null;
	reality: string | null;
	rating: number | null;
	wouldRepeat: WouldRepeat | null;
	personIds: string[];
	sharedWith: string | null;
	mediaIds: string[];
	audioNoteId: string | null;
	placeId: string | null;
	isPinned: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────

export const CATEGORY_LABELS: Record<FirstCategory, { de: string; en: string }> = {
	culinary: { de: 'Kulinarisch', en: 'Culinary' },
	adventure: { de: 'Abenteuer', en: 'Adventure' },
	travel: { de: 'Reisen', en: 'Travel' },
	people: { de: 'Menschen', en: 'People' },
	career: { de: 'Beruf', en: 'Career' },
	creative: { de: 'Kreativ', en: 'Creative' },
	nature: { de: 'Natur', en: 'Nature' },
	culture: { de: 'Kultur', en: 'Culture' },
	health: { de: 'Gesundheit', en: 'Health' },
	tech: { de: 'Technik', en: 'Tech' },
	other: { de: 'Sonstiges', en: 'Other' },
};

export const CATEGORY_COLORS: Record<FirstCategory, string> = {
	culinary: '#f97316',
	adventure: '#ef4444',
	travel: '#0ea5e9',
	people: '#ec4899',
	career: '#6366f1',
	creative: '#a855f7',
	nature: '#22c55e',
	culture: '#eab308',
	health: '#14b8a6',
	tech: '#64748b',
	other: '#9ca3af',
};

export const PRIORITY_LABELS: Record<FirstPriority, { de: string; en: string }> = {
	1: { de: 'Irgendwann', en: 'Someday' },
	2: { de: 'Dieses Jahr', en: 'This Year' },
	3: { de: 'So bald wie möglich', en: 'ASAP' },
};
