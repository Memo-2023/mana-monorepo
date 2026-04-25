import type { BaseRecord } from '@mana/local-store';
import type { VisibilityLevel } from '@mana/shared-privacy';

// ─── Enums ────────────────────────────────────────────────

export type AugurKind = 'omen' | 'fortune' | 'hunch';

export type AugurVibe = 'good' | 'bad' | 'mysterious';

export type AugurOutcome = 'open' | 'fulfilled' | 'partly' | 'not-fulfilled';

/**
 * Coarse category of the source — used for "Calibration per Source" in
 * the Oracle view. Free-form `source` (e.g. "Mutter", "schwarze Katze")
 * stays encrypted; the category stays plaintext for the aggregation
 * query path.
 */
export type AugurSourceCategory =
	| 'gut'
	| 'tarot'
	| 'horoscope'
	| 'fortune-cookie'
	| 'iching'
	| 'dream'
	| 'person'
	| 'media'
	| 'natural'
	| 'other';

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalAugurEntry extends BaseRecord {
	kind: AugurKind;
	source: string;
	sourceCategory: AugurSourceCategory;
	claim: string;
	vibe: AugurVibe;
	feltMeaning: string | null;
	expectedOutcome: string | null;
	expectedBy: string | null;
	probability: number | null;
	outcome: AugurOutcome;
	outcomeNote: string | null;
	resolvedAt: string | null;
	encounteredAt: string;
	tags: string[];
	relatedDreamId: string | null;
	relatedDecisionId: string | null;
	livingOracleSnapshot: string | null;
	isPrivate: boolean;
	isArchived: boolean;
	/**
	 * Visibility level — unified privacy system (docs/plans/visibility-system.md).
	 * Optional on the local record because M1–M5 rows pre-date the field;
	 * `toAugurEntry` narrows to a non-optional VisibilityLevel. Default is
	 * `'private'` because divinatory captures can be very personal.
	 */
	visibility?: VisibilityLevel;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
	unlistedToken?: string;
	unlistedExpiresAt?: string | null;
}

// ─── Domain Types ─────────────────────────────────────────

export interface AugurEntry {
	id: string;
	kind: AugurKind;
	source: string;
	sourceCategory: AugurSourceCategory;
	claim: string;
	vibe: AugurVibe;
	feltMeaning: string | null;
	expectedOutcome: string | null;
	expectedBy: string | null;
	probability: number | null;
	outcome: AugurOutcome;
	outcomeNote: string | null;
	resolvedAt: string | null;
	encounteredAt: string;
	tags: string[];
	relatedDreamId: string | null;
	relatedDecisionId: string | null;
	livingOracleSnapshot: string | null;
	isPrivate: boolean;
	isArchived: boolean;
	visibility: VisibilityLevel;
	unlistedToken: string;
	unlistedExpiresAt: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────

export const KIND_LABELS: Record<AugurKind, { de: string; en: string }> = {
	omen: { de: 'Omen', en: 'Omen' },
	fortune: { de: 'Wahrsagung', en: 'Fortune' },
	hunch: { de: 'Bauchgefühl', en: 'Hunch' },
};

export const VIBE_LABELS: Record<AugurVibe, { de: string; en: string }> = {
	good: { de: 'Gutes Zeichen', en: 'Good sign' },
	bad: { de: 'Warnung', en: 'Warning' },
	mysterious: { de: 'Rätselhaft', en: 'Mysterious' },
};

export const VIBE_COLORS: Record<AugurVibe, string> = {
	good: '#22c55e',
	bad: '#ef4444',
	mysterious: '#8b5cf6',
};

export const OUTCOME_LABELS: Record<AugurOutcome, { de: string; en: string }> = {
	open: { de: 'Offen', en: 'Open' },
	fulfilled: { de: 'Eingetreten', en: 'Fulfilled' },
	partly: { de: 'Teilweise', en: 'Partly' },
	'not-fulfilled': { de: 'Nicht eingetreten', en: 'Not fulfilled' },
};

export const SOURCE_CATEGORY_LABELS: Record<AugurSourceCategory, { de: string; en: string }> = {
	gut: { de: 'Bauchgefühl', en: 'Gut feeling' },
	tarot: { de: 'Tarot', en: 'Tarot' },
	horoscope: { de: 'Horoskop', en: 'Horoscope' },
	'fortune-cookie': { de: 'Glückskeks', en: 'Fortune cookie' },
	iching: { de: 'I Ging', en: 'I Ching' },
	dream: { de: 'Traum', en: 'Dream' },
	person: { de: 'Person', en: 'Person' },
	media: { de: 'Medium', en: 'Media' },
	natural: { de: 'Naturzeichen', en: 'Natural sign' },
	other: { de: 'Sonstiges', en: 'Other' },
};
