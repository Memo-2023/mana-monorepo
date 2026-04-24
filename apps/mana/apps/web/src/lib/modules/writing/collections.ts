/**
 * Writing module — Dexie accessors and guest seed.
 *
 * Four tables: `writingDrafts` (the briefing + pointer to current version),
 * `writingDraftVersions` (immutable snapshots of the text body), `writingGenerations`
 * (provider-level call records — prompt, status, duration, tokens), and
 * `writingStyles` (reusable named style definitions, preset or custom).
 */

import { db } from '$lib/data/database';
import type { LocalDraft, LocalDraftVersion, LocalGeneration, LocalWritingStyle } from './types';

export const draftTable = db.table<LocalDraft>('writingDrafts');
export const draftVersionTable = db.table<LocalDraftVersion>('writingDraftVersions');
export const generationTable = db.table<LocalGeneration>('writingGenerations');
export const writingStyleTable = db.table<LocalWritingStyle>('writingStyles');

// ─── Guest Seed ────────────────────────────────────────────
//
// One example draft + its initial version + a custom style, so first-run
// users can open the module and immediately see the briefing / version /
// style shape. Intentionally small — the interesting seeds are the
// preset styles (see `presets/styles.ts`), not sample drafts.

export const WRITING_GUEST_SEED = {
	writingDrafts: [
		{
			id: 'demo-draft-welcome',
			kind: 'blog' as const,
			status: 'draft' as const,
			title: 'Willkommen bei Writing',
			briefing: {
				topic: 'Was dieses Modul für dich tut',
				audience: 'Neue Mana-Nutzer',
				tone: 'freundlich, konkret',
				language: 'de',
				targetLength: { type: 'words' as const, value: 220 },
				extraInstructions: null,
				useResearch: false,
			},
			styleId: null,
			styleOverrides: null,
			references: [],
			currentVersionId: 'demo-draft-welcome-v1',
			isFavorite: false,
			publishedTo: [],
		},
	],
	writingDraftVersions: [
		{
			id: 'demo-draft-welcome-v1',
			draftId: 'demo-draft-welcome',
			versionNumber: 1,
			content:
				'Writing ist dein Ghostwriter in Mana. Beschreibe kurz, was du brauchst — Thema, Zielgruppe, Länge, Ton — und wähle einen Stil. Das Modul erzeugt einen ersten Entwurf, den du Absatz für Absatz verfeinern kannst. Bereit für deinen ersten Text?',
			wordCount: 41,
			generationId: null,
			isAiGenerated: false,
			parentVersionId: null,
			summary: null,
		},
	],
	writingGenerations: [],
	writingStyles: [],
};
