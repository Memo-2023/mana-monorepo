/**
 * Journal module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalJournalEntry } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const journalEntryTable = db.table<LocalJournalEntry>('journalEntries');

// ─── Guest Seed ────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

export const JOURNAL_GUEST_SEED = {
	journalEntries: [
		{
			id: 'journal-welcome',
			title: 'Willkommen im Tagebuch',
			content:
				'Schreibe täglich deine Gedanken und Gefühle auf. Je regelmäßiger, desto wertvoller wird dein Tagebuch über die Zeit.\n\n**Tipps:**\n- Schreibe frei, ohne Filter — niemand liest es außer dir.\n- Wähle eine Stimmung, um Muster zu erkennen.\n- Nutze Tags, um Themen zu verfolgen.\n- Deine Einträge sind verschlüsselt.',
			entryDate: today,
			mood: 'zufrieden',
			tags: ['Start'],
			isPinned: true,
			isArchived: false,
			isFavorite: false,
			wordCount: 42,
		},
		{
			id: 'journal-example',
			title: 'Ein guter Tag',
			content:
				'Heute war ein ruhiger Tag. Morgens Kaffee auf dem Balkon, danach produktiv gearbeitet. Am Nachmittag einen langen Spaziergang gemacht — das Wetter war perfekt. Abends gekocht und früh ins Bett.',
			entryDate: yesterday,
			mood: 'glücklich',
			tags: ['Alltag', 'Natur'],
			isPinned: false,
			isArchived: false,
			isFavorite: true,
			wordCount: 30,
		},
	] satisfies LocalJournalEntry[],
};
