/**
 * Context module — collection accessors and guest seed data.
 *
 * Uses table names from the unified DB: contextSpaces, documents.
 */

import { db } from '$lib/data/database';
import type { LocalContextSpace, LocalDocument } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const contextSpaceTable = db.table<LocalContextSpace>('contextSpaces');
export const documentTable = db.table<LocalDocument>('documents');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_SPACE_ID = 'demo-workspace';

export const CONTEXT_GUEST_SEED = {
	contextSpaces: [
		{
			id: DEMO_SPACE_ID,
			name: 'Mein Workspace',
			description: 'Beispiel-Space zum Kennenlernen von Context.',
			pinned: true,
			prefix: 'W',
		},
	],
	documents: [
		{
			id: 'doc-welcome',
			spaceId: DEMO_SPACE_ID,
			title: 'Willkommen bei Context',
			content:
				'Context ist dein KI-gestütztes Dokumenten-Management. Erstelle Texte, sammle Kontexte und nutze KI-Prompts.\n\nMelde dich an, um deine Dokumente zu synchronisieren.',
			type: 'text' as const,
			shortId: 'WD1',
			pinned: true,
			metadata: { tags: ['einführung'], wordCount: 22 },
		},
		{
			id: 'doc-prompt',
			spaceId: DEMO_SPACE_ID,
			title: 'Beispiel-Prompt',
			content: 'Fasse den folgenden Text in 3 Stichpunkten zusammen:\n\n{text}',
			type: 'prompt' as const,
			shortId: 'WP1',
			pinned: false,
			metadata: { tags: ['vorlage'] },
		},
	],
};
