import type { BaseRecord } from '@mana/local-store';
import type { MilestoneCategory } from '$lib/data/milestones/categories';

export { CATEGORY_LABELS, CATEGORY_COLORS } from '$lib/data/milestones/categories';

// ─── Enums ────────────────────────────────────────────────

export type FirstStatus = 'dream' | 'lived';

/**
 * `FirstCategory` is the same vocabulary as `MilestoneCategory`. Re-exported
 * under the local name so existing imports from `firsts/types` keep working;
 * the underlying definition lives in `$lib/data/milestones/categories`.
 */
export type FirstCategory = MilestoneCategory;

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

export const PRIORITY_LABELS: Record<FirstPriority, { de: string; en: string }> = {
	1: { de: 'Irgendwann', en: 'Someday' },
	2: { de: 'Dieses Jahr', en: 'This Year' },
	3: { de: 'So bald wie möglich', en: 'ASAP' },
};
