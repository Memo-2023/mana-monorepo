/**
 * User Context types — structured profile + freeform markdown.
 *
 * Single singleton record that holds everything Mana knows about the user.
 * Encrypted at rest (all fields except id and interview state).
 */

import type { BaseRecord } from '@mana/local-store';

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

export interface UserContextSocial {
	communication?: string; // "Direkt", "Diplomatisch"
	workStyle?: string; // "Solo", "Team", "Hybrid"
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
		goals: local.goals ?? [],
		social: local.social ?? {},
		freeform: local.freeform ?? '',
		interview: local.interview ?? { answeredIds: [], skippedIds: [] },
		createdAt: local.createdAt ?? '',
		updatedAt: local.updatedAt ?? '',
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
		goals: [],
		social: {},
		freeform: '',
		interview: { answeredIds: [], skippedIds: [] },
	} as LocalUserContext;
}
