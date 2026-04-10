/**
 * Who module — character dossier types.
 *
 * A "dossier" is a structured, pre-researched fact sheet for a single
 * historical figure. It is generated ONCE by a strong cloud LLM via the
 * generator script (apps/api/scripts/generate-who-dossiers.ts) and then
 * fed to the small runtime model (gemma3:4b) in carefully staged chunks
 * during gameplay. This compensates for the small model's weak factual
 * recall and instruction-following: instead of asking it to "be"
 * Hatschepsut, we hand it the relevant facts for the current turn and
 * ask it to roleplay using only those.
 *
 * Dossiers are bilingual (DE + EN) so the runtime can pick the language
 * the user is playing in. They live as one JSON file per character at
 * apps/api/src/modules/who/data/dossiers/{id}.json.
 *
 * Design notes:
 * - voice / values define HOW the character speaks. They go into the
 *   prompt from turn 1 and stay there.
 * - era / region / role / achievements / anecdotes / relationships are
 *   FACTS. They are released in stages — vague hints first, concrete
 *   facts later — so the puzzle has a difficulty curve.
 * - forbiddenEarly is a hard blocklist of words that would trivially
 *   give away the character. Enforced in the prompt and (eventually)
 *   server-side post-processing. Language-agnostic — names of places,
 *   key terms, the character's own name parts.
 * - commonWrongGuesses gives the small model pre-chewed reasoning for
 *   the most likely user misdirections, so it doesn't have to figure
 *   them out itself.
 */
import { z } from 'zod';

/** Localized single string (DE + EN) */
export const LocalizedStringSchema = z.object({
	de: z.string().min(1).max(2000),
	en: z.string().min(1).max(2000),
});
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

/** Localized list of strings */
export const LocalizedStringsSchema = z.object({
	de: z.array(z.string().min(1).max(2000)).min(1).max(20),
	en: z.array(z.string().min(1).max(2000)).min(1).max(20),
});
export type LocalizedStrings = z.infer<typeof LocalizedStringsSchema>;

/** A common misdirection guess + how the character should correct it */
export const WrongGuessSchema = z.object({
	guess: z.string().min(1).max(200),
	correction: LocalizedStringSchema,
});
export type WrongGuess = z.infer<typeof WrongGuessSchema>;

export const CharacterDossierSchema = z.object({
	/** Matches WhoCharacter.id — sanity check on load */
	id: z.number().int().positive(),
	/** Matches WhoCharacter.name — sanity check on load */
	name: z.string().min(1).max(200),

	/** HOW the character speaks. Always present in the system prompt. */
	voice: LocalizedStringSchema,
	/** 3-5 keyword traits that shape replies. Always present. */
	values: LocalizedStringsSchema,

	// ─── Staged facts ────────────────────────────────────────
	era: LocalizedStringSchema,
	region: LocalizedStringSchema,
	role: LocalizedStringSchema,
	achievements: LocalizedStringsSchema,
	anecdotes: LocalizedStringsSchema,
	relationships: LocalizedStringsSchema,

	// ─── Negative constraints ────────────────────────────────
	/** Words/names that must NOT appear in the first 5 turns. Language-agnostic. */
	forbiddenEarly: z.array(z.string().min(1).max(100)).min(1).max(30),
	/** Pre-chewed misdirections the small model would otherwise blow */
	commonWrongGuesses: z.array(WrongGuessSchema).min(0).max(8),

	// ─── Hint texts ──────────────────────────────────────────
	hints: z.object({
		vague: LocalizedStringSchema,
		medium: LocalizedStringSchema,
		strong: LocalizedStringSchema,
	}),
});
export type CharacterDossier = z.infer<typeof CharacterDossierSchema>;

/** Pick the right language slice from a localized string */
export function pickLang(localized: LocalizedString, lang: 'de' | 'en'): string {
	return localized[lang];
}
export function pickLangList(localized: LocalizedStrings, lang: 'de' | 'en'): string[] {
	return localized[lang];
}
