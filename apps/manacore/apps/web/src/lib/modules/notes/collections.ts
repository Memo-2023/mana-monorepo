/**
 * Notes module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalNote } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const noteTable = db.table<LocalNote>('notes');

// ─── Guest Seed ────────────────────────────────────────────

export const NOTES_GUEST_SEED = {
	notes: [
		{
			id: 'note-welcome',
			title: 'Willkommen bei Notes',
			content:
				'Schnelle Notizen für alles, was dir einfällt.\n\nDu kannst Notizen **pinnen**, farblich markieren und durchsuchen.',
			color: '#3b82f6',
			isPinned: true,
			isArchived: false,
		},
		{
			id: 'note-ideas',
			title: 'Ideen',
			content: '- Feature X ausprobieren\n- Blog-Post schreiben\n- Design Review planen',
			color: '#f59e0b',
			isPinned: false,
			isArchived: false,
		},
	] satisfies LocalNote[],
};
