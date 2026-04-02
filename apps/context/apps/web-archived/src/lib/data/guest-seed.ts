/**
 * Guest seed data for the Context app.
 *
 * Provides a demo space with sample documents.
 */

import type { LocalSpace, LocalDocument } from './local-store';

const DEMO_SPACE_ID = 'demo-workspace';

export const guestSpaces: LocalSpace[] = [
	{
		id: DEMO_SPACE_ID,
		name: 'Mein Workspace',
		description: 'Beispiel-Space zum Kennenlernen von Context.',
		pinned: true,
		prefix: 'W',
	},
];

export const guestDocuments: LocalDocument[] = [
	{
		id: 'doc-welcome',
		spaceId: DEMO_SPACE_ID,
		title: 'Willkommen bei Context',
		content:
			'Context ist dein KI-gestütztes Dokumenten-Management. Erstelle Texte, sammle Kontexte und nutze KI-Prompts.\n\nMelde dich an, um deine Dokumente zu synchronisieren.',
		type: 'text',
		shortId: 'WD1',
		pinned: true,
		metadata: { tags: ['einführung'], wordCount: 22 },
	},
	{
		id: 'doc-prompt',
		spaceId: DEMO_SPACE_ID,
		title: 'Beispiel-Prompt',
		content: 'Fasse den folgenden Text in 3 Stichpunkten zusammen:\n\n{text}',
		type: 'prompt',
		shortId: 'WP1',
		pinned: false,
		metadata: { tags: ['vorlage'] },
	},
];
