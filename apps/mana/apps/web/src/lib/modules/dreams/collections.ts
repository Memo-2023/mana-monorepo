/**
 * Dreams module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalDream, LocalDreamSymbol, LocalDreamTag } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const dreamTable = db.table<LocalDream>('dreams');
export const dreamSymbolTable = db.table<LocalDreamSymbol>('dreamSymbols');
export const dreamTagTable = db.table<LocalDreamTag>('dreamTags');

// ─── Guest Seed ────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

export const DREAMS_GUEST_SEED = {
	dreams: [
		{
			id: 'dream-welcome',
			title: 'Willkommen im Traumtagebuch',
			content:
				'Notiere deine Träume direkt nach dem Aufwachen. Je früher du sie festhältst, desto mehr Details bleiben dir.\n\n**Tipps:**\n- Stichworte reichen — Sätze bilden sich später.\n- Stimmung und Klarheit helfen bei Mustern über Wochen.\n- Pinne wiederkehrende Träume.',
			dreamDate: today,
			mood: 'angenehm',
			clarity: 4,
			isLucid: false,
			isRecurring: false,
			sleepQuality: null,
			bedtime: null,
			wakeTime: null,
			location: null,
			people: [],
			emotions: ['Ruhe', 'Neugier'],
			symbols: [],
			audioPath: null,
			audioDurationMs: null,
			transcript: null,
			processingStatus: 'idle',
			processingError: null,
			interpretation: null,
			aiInterpretation: null,
			isPrivate: false,
			isPinned: true,
			isArchived: false,
		},
		{
			id: 'dream-fliegen',
			title: 'Über der Stadt geflogen',
			content:
				'Ich konnte mich aus dem Bett heben und über die Stadt fliegen. Alles war weich und leuchtete in goldenem Licht.',
			dreamDate: yesterday,
			mood: 'angenehm',
			clarity: 5,
			isLucid: true,
			isRecurring: false,
			sleepQuality: 4,
			bedtime: '23:30',
			wakeTime: '07:15',
			location: 'Über einer fremden Stadt',
			people: [],
			emotions: ['Freiheit', 'Staunen'],
			symbols: ['Fliegen', 'Licht'],
			audioPath: null,
			audioDurationMs: null,
			transcript: null,
			processingStatus: 'idle',
			processingError: null,
			interpretation: 'Gefühl von Kontrolle und Leichtigkeit nach einer entspannten Woche.',
			aiInterpretation: null,
			isPrivate: false,
			isPinned: false,
			isArchived: false,
		},
	] satisfies LocalDream[],
	dreamSymbols: [
		{
			id: 'dream-symbol-fliegen',
			name: 'Fliegen',
			meaning: 'Freiheit, Loslösung, Kontrolle',
			color: '#6366f1',
			count: 1,
		},
		{
			id: 'dream-symbol-licht',
			name: 'Licht',
			meaning: 'Klarheit, Bewusstsein',
			color: '#f59e0b',
			count: 1,
		},
	] satisfies LocalDreamSymbol[],
};
