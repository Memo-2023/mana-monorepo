import { db } from '$lib/data/database';
import type { LocalFirst } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const firstTable = db.table<LocalFirst>('firsts');

// ─── Guest Seed ────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);

export const FIRSTS_GUEST_SEED = {
	firsts: [
		{
			id: 'first-welcome',
			title: 'Willkommen bei Firsts!',
			status: 'lived',
			category: 'other',
			motivation: null,
			priority: null,
			date: today,
			note: 'Mein erstes Mal die Firsts-App benutzen. Hier halte ich alle meine ersten Male fest.',
			expectation: 'Einfach mal ausprobieren',
			reality: 'Einfach und macht Spaß!',
			rating: 5,
			wouldRepeat: 'definitely',
			personIds: [],
			sharedWith: null,
			mediaIds: [],
			audioNoteId: null,
			placeId: null,
			isPinned: true,
			isArchived: false,
		},
		{
			id: 'first-dream-example',
			title: 'Nordlichter sehen',
			status: 'dream',
			category: 'travel',
			motivation: 'Soll eines der beeindruckendsten Naturschauspiele sein.',
			priority: 2,
			date: null,
			note: null,
			expectation: null,
			reality: null,
			rating: null,
			wouldRepeat: null,
			personIds: [],
			sharedWith: null,
			mediaIds: [],
			audioNoteId: null,
			placeId: null,
			isPinned: false,
			isArchived: false,
		},
	] satisfies LocalFirst[],
};
