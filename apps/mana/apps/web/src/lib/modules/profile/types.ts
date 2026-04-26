/**
 * User Context types — structured profile + freeform markdown.
 *
 * Single singleton record that holds everything Mana knows about the user.
 * Encrypted at rest (all fields except id and interview state).
 */

import type { BaseRecord } from '@mana/local-store';
import { deriveUpdatedAt } from '$lib/data/sync';

export const USER_CONTEXT_SINGLETON_ID = 'singleton' as const;

// ── Structured sections ────────────────────────────────────

export interface UserContextAbout {
	bio?: string;
	occupation?: string;
	location?: string;
	birthday?: string; // YYYY-MM-DD
	languages?: string[];
}

export interface UserContextRoutine {
	wakeUp?: string; // "07:00"
	workStart?: string;
	workEnd?: string;
	bedtime?: string;
	workDays?: number[]; // [1,2,3,4,5] = Mon-Fri
}

export interface UserContextNutrition {
	diet?: string; // "Vegetarisch", "Vegan", "Omnivor", …
	allergies?: string[];
	preferences?: string; // freeform
}

export interface UserContextLeisure {
	media?: string[]; // ["Podcasts", "Bücher", "Serien"]
	sports?: string[]; // ["Laufen", "Yoga"]
	pets?: string; // "Hund, Katze"
}

export interface UserContextSocial {
	communication?: string; // "Direkt", "Diplomatisch"
	workStyle?: string; // "Solo", "Team", "Hybrid"
	livingSetup?: string; // "Allein", "Mit Partner/in", "WG", "Familie"
}

export interface InterviewProgress {
	answeredIds: string[];
	skippedIds: string[];
	lastSessionAt?: string; // ISO
}

// ── Main record ────────────────────────────────────────────

export interface LocalUserContext extends BaseRecord {
	id: typeof USER_CONTEXT_SINGLETON_ID;

	about: UserContextAbout;
	interests: string[];
	routine: UserContextRoutine;
	nutrition: UserContextNutrition;
	leisure: UserContextLeisure;
	goals: string[];
	social: UserContextSocial;

	/** Freeform markdown — "Was soll Mana sonst noch wissen?" */
	freeform: string;

	/** Interview progress tracking (not encrypted) */
	interview: InterviewProgress;
}

export interface UserContext {
	id: string;
	about: UserContextAbout;
	interests: string[];
	routine: UserContextRoutine;
	nutrition: UserContextNutrition;
	leisure: UserContextLeisure;
	goals: string[];
	social: UserContextSocial;
	freeform: string;
	interview: InterviewProgress;
	createdAt: string;
	updatedAt: string;
}

/** Convert a LocalUserContext to the public UserContext type. */
export function toUserContext(local: LocalUserContext): UserContext {
	return {
		id: local.id,
		about: local.about ?? {},
		interests: local.interests ?? [],
		routine: local.routine ?? {},
		nutrition: local.nutrition ?? {},
		leisure: local.leisure ?? {},
		goals: local.goals ?? [],
		social: local.social ?? {},
		freeform: local.freeform ?? '',
		interview: local.interview ?? { answeredIds: [], skippedIds: [] },
		createdAt: local.createdAt ?? '',
		updatedAt: deriveUpdatedAt(local),
	};
}

/** Empty defaults for a new user context. */
export function emptyUserContext(): LocalUserContext {
	return {
		id: USER_CONTEXT_SINGLETON_ID,
		about: {},
		interests: [],
		routine: {},
		nutrition: {},
		leisure: {},
		goals: [],
		social: {},
		freeform: '',
		interview: { answeredIds: [], skippedIds: [] },
	} as LocalUserContext;
}

// ── Me-Images: user-owned reference images for AI generation ───────
// Plan: docs/plans/me-images-and-reference-generation.md
//
// Small, curated pool (typically 2–10 images) the user uploads once —
// a face portrait, a fullbody shot, maybe hands for ring try-ons.
// Per-bild opt-in (`usage.aiReference`) gates whether a given image
// may be sent to OpenAI `/v1/images/edits` when the Picture generator
// runs in reference mode.
//
// User-level table (like userContext): no spaceId, no authorId. The
// same human uses the same face across every Space.

/**
 * Reference kind. `face` and `fullbody` have dedicated primary slots
 * in the UI (M2). `halfbody`, `hands`, and generic `reference` exist
 * so the user can hold additional context (hands for rings, half-body
 * for chest-up generations) without overloading the two main slots.
 */
export type MeImageKind = 'face' | 'fullbody' | 'halfbody' | 'hands' | 'reference';

/**
 * Primary slot a given image fills. At most one image per slot is
 * active at a time — setPrimary(id, slot) clears the previous holder.
 *   - `avatar`: drives the derived auth.users.image (M2 sync hook).
 *   - `face-ref`: default face fed to the reference generator.
 *   - `body-ref`: default fullbody reference.
 */
export type MeImagePrimarySlot = 'avatar' | 'face-ref' | 'body-ref';

export interface MeImageUsage {
	/** Explicit opt-in per image: may KI verwenden? Default false on upload. */
	aiReference: boolean;
	/** Counts towards avatar fallback if primary=avatar is not set. */
	showInProfile: boolean;
}

export interface LocalMeImage extends BaseRecord {
	id: string;
	kind: MeImageKind;
	label?: string;
	mediaId: string;
	storagePath: string;
	publicUrl: string;
	thumbnailUrl?: string | null;
	width: number;
	height: number;
	tags: string[];
	usage: MeImageUsage;
	primaryFor?: MeImagePrimarySlot | null;
	// Space-scope fields (added in Dexie v40 — see
	// docs/plans/me-images-space-scope-migration.md). Stamped by the
	// Dexie creating-hook like any other data table; the initial
	// `_personal:<userId>` sentinel is rewritten to the real space id
	// by reconcileSentinels() on the first active-space bootstrap.
	spaceId?: string;
	authorId?: string;
	visibility?: 'space' | 'private';
}

export interface MeImage {
	id: string;
	kind: MeImageKind;
	label?: string;
	mediaId: string;
	storagePath: string;
	publicUrl: string;
	thumbnailUrl?: string | null;
	width: number;
	height: number;
	tags: string[];
	usage: MeImageUsage;
	primaryFor?: MeImagePrimarySlot | null;
	spaceId?: string;
	createdAt: string;
	updatedAt: string;
}

/** Convert a LocalMeImage (Dexie row) to the public MeImage type. */
export function toMeImage(local: LocalMeImage): MeImage {
	return {
		id: local.id,
		kind: local.kind,
		label: local.label,
		mediaId: local.mediaId,
		storagePath: local.storagePath,
		publicUrl: local.publicUrl,
		thumbnailUrl: local.thumbnailUrl ?? null,
		width: local.width,
		height: local.height,
		tags: local.tags ?? [],
		usage: local.usage ?? { aiReference: false, showInProfile: true },
		primaryFor: local.primaryFor ?? null,
		spaceId: local.spaceId,
		createdAt: local.createdAt ?? '',
		updatedAt: deriveUpdatedAt(local),
	};
}
