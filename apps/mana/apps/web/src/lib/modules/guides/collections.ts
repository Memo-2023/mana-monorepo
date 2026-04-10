/**
 * Guides module — collection accessors and guest seed data.
 *
 * The 6 starter guides ship as seed data so new users see content
 * immediately. Each guide includes sections and steps that can be
 * worked through interactively.
 */

import { db } from '$lib/data/database';
import type { LocalGuide, LocalSection, LocalStep, LocalGuideCollection, LocalRun } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const guideTable = db.table<LocalGuide>('guides');
export const sectionTable = db.table<LocalSection>('sections');
export const stepTable = db.table<LocalStep>('steps');
export const guideCollectionTable = db.table<LocalGuideCollection>('guideCollections');
export const runTable = db.table<LocalRun>('runs');

// ─── Guest Seed ────────────────────────────────────────────

export const GUIDES_GUEST_SEED = {
	guides: [
		{
			id: 'guide-welcome',
			title: 'Willkommen bei Mana',
			description: 'Ein Überblick über das Mana-Ökosystem und seine Apps.',
			category: 'getting-started' as const,
			difficulty: 'beginner' as const,
			estimatedMinutes: 5,
			collectionId: null,
			isPublished: true,
			order: 0,
		},
		{
			id: 'guide-local-first',
			title: 'Offline-First verstehen',
			description: 'Wie Mana lokal arbeitet und im Hintergrund synchronisiert.',
			category: 'getting-started' as const,
			difficulty: 'beginner' as const,
			estimatedMinutes: 8,
			collectionId: null,
			isPublished: true,
			order: 1,
		},
		{
			id: 'guide-keyboard',
			title: 'Tastaturkürzel',
			description: 'Navigiere schneller mit Tastaturkürzeln durch alle Apps.',
			category: 'productivity' as const,
			difficulty: 'beginner' as const,
			estimatedMinutes: 5,
			collectionId: null,
			isPublished: true,
			order: 2,
		},
		{
			id: 'guide-todo',
			title: 'Todo-Workflows',
			description: 'Projekte, Labels und Fokus-Modus effektiv nutzen.',
			category: 'productivity' as const,
			difficulty: 'intermediate' as const,
			estimatedMinutes: 10,
			collectionId: null,
			isPublished: true,
			order: 3,
		},
		{
			id: 'guide-ai',
			title: 'KI-Funktionen nutzen',
			description: 'Chat, Playground und KI-gestützte Features in Mana.',
			category: 'advanced' as const,
			difficulty: 'intermediate' as const,
			estimatedMinutes: 12,
			collectionId: null,
			isPublished: true,
			order: 4,
		},
		{
			id: 'guide-sync',
			title: 'Sync einrichten',
			description: 'Geräteübergreifende Synchronisation konfigurieren.',
			category: 'integrations' as const,
			difficulty: 'intermediate' as const,
			estimatedMinutes: 8,
			collectionId: null,
			isPublished: true,
			order: 5,
		},
	] satisfies LocalGuide[],

	sections: [
		// ── Welcome guide ─────────────────────────────────
		{
			id: 'sec-welcome-1',
			guideId: 'guide-welcome',
			title: 'Was ist Mana?',
			content: null,
			order: 0,
		},
		{
			id: 'sec-welcome-2',
			guideId: 'guide-welcome',
			title: 'Deine ersten Schritte',
			content: null,
			order: 1,
		},
		// ── Local-first guide ─────────────────────────────
		{
			id: 'sec-local-1',
			guideId: 'guide-local-first',
			title: 'Das Prinzip',
			content: null,
			order: 0,
		},
		{
			id: 'sec-local-2',
			guideId: 'guide-local-first',
			title: 'Sync & Konflikte',
			content: null,
			order: 1,
		},
		// ── Keyboard guide ────────────────────────────────
		{ id: 'sec-kb-1', guideId: 'guide-keyboard', title: 'Navigation', content: null, order: 0 },
		{
			id: 'sec-kb-2',
			guideId: 'guide-keyboard',
			title: 'Schnellaktionen',
			content: null,
			order: 1,
		},
		// ── Todo guide ────────────────────────────────────
		{ id: 'sec-todo-1', guideId: 'guide-todo', title: 'Projekte anlegen', content: null, order: 0 },
		{ id: 'sec-todo-2', guideId: 'guide-todo', title: 'Labels & Filter', content: null, order: 1 },
		{ id: 'sec-todo-3', guideId: 'guide-todo', title: 'Fokus-Modus', content: null, order: 2 },
		// ── AI guide ──────────────────────────────────────
		{ id: 'sec-ai-1', guideId: 'guide-ai', title: 'Chat nutzen', content: null, order: 0 },
		{ id: 'sec-ai-2', guideId: 'guide-ai', title: 'Playground', content: null, order: 1 },
		{
			id: 'sec-ai-3',
			guideId: 'guide-ai',
			title: 'KI in anderen Modulen',
			content: null,
			order: 2,
		},
		// ── Sync guide ────────────────────────────────────
		{
			id: 'sec-sync-1',
			guideId: 'guide-sync',
			title: 'Account verbinden',
			content: null,
			order: 0,
		},
		{
			id: 'sec-sync-2',
			guideId: 'guide-sync',
			title: 'Geräte hinzufügen',
			content: null,
			order: 1,
		},
	] satisfies LocalSection[],

	steps: [
		// ── Welcome > Was ist Mana? ───────────────────────
		{
			id: 'step-w1-1',
			guideId: 'guide-welcome',
			sectionId: 'sec-welcome-1',
			title: 'Mana öffnen und Dashboard ansehen',
			content: 'Öffne mana.how und sieh dir das Dashboard an. Hier findest du alle deine Module.',
			order: 0,
		},
		{
			id: 'step-w1-2',
			guideId: 'guide-welcome',
			sectionId: 'sec-welcome-1',
			title: 'Module entdecken',
			content:
				'Klicke auf verschiedene Module in der Seitenleiste, um zu sehen, was Mana alles kann.',
			order: 1,
		},
		// ── Welcome > Erste Schritte ──────────────────────
		{
			id: 'step-w2-1',
			guideId: 'guide-welcome',
			sectionId: 'sec-welcome-2',
			title: 'Erste Notiz erstellen',
			content: 'Öffne das Notes-Modul und erstelle deine erste Notiz.',
			order: 0,
		},
		{
			id: 'step-w2-2',
			guideId: 'guide-welcome',
			sectionId: 'sec-welcome-2',
			title: 'Erste Aufgabe anlegen',
			content: 'Wechsle zu Todo und lege deine erste Aufgabe an.',
			order: 1,
		},
		// ── Local-first > Das Prinzip ─────────────────────
		{
			id: 'step-l1-1',
			guideId: 'guide-local-first',
			sectionId: 'sec-local-1',
			title: 'Offline-Modus testen',
			content: 'Schalte dein WLAN aus und erstelle eine Notiz. Sie wird gespeichert!',
			order: 0,
		},
		{
			id: 'step-l1-2',
			guideId: 'guide-local-first',
			sectionId: 'sec-local-1',
			title: 'IndexedDB inspizieren',
			content:
				'Öffne die Browser DevTools → Application → IndexedDB → mana, um deine lokalen Daten zu sehen.',
			order: 1,
		},
		// ── Local-first > Sync ────────────────────────────
		{
			id: 'step-l2-1',
			guideId: 'guide-local-first',
			sectionId: 'sec-local-2',
			title: 'WLAN wieder aktivieren',
			content:
				'Schalte WLAN ein und beobachte, wie deine Offline-Änderungen synchronisiert werden.',
			order: 0,
		},
		// ── Keyboard > Navigation ─────────────────────────
		{
			id: 'step-kb1-1',
			guideId: 'guide-keyboard',
			sectionId: 'sec-kb-1',
			title: 'Cmd+K ausprobieren',
			content: 'Drücke Cmd+K (oder Ctrl+K), um die Schnellsuche zu öffnen.',
			order: 0,
		},
		{
			id: 'step-kb1-2',
			guideId: 'guide-keyboard',
			sectionId: 'sec-kb-1',
			title: 'Zwischen Modulen wechseln',
			content: 'Nutze die Schnellsuche, um direkt zu einem Modul zu springen.',
			order: 1,
		},
		// ── Keyboard > Schnellaktionen ────────────────────
		{
			id: 'step-kb2-1',
			guideId: 'guide-keyboard',
			sectionId: 'sec-kb-2',
			title: 'Schnell-Todo anlegen',
			content: 'Drücke Cmd+Shift+T, um sofort eine neue Aufgabe zu erstellen.',
			order: 0,
		},
		// ── Todo > Projekte ───────────────────────────────
		{
			id: 'step-td1-1',
			guideId: 'guide-todo',
			sectionId: 'sec-todo-1',
			title: 'Neues Projekt erstellen',
			content: 'Gehe zu Todo → Projekte und erstelle ein neues Projekt.',
			order: 0,
		},
		{
			id: 'step-td1-2',
			guideId: 'guide-todo',
			sectionId: 'sec-todo-1',
			title: 'Aufgaben zum Projekt hinzufügen',
			content: 'Füge mindestens 3 Aufgaben zum Projekt hinzu.',
			order: 1,
		},
		// ── Todo > Labels ─────────────────────────────────
		{
			id: 'step-td2-1',
			guideId: 'guide-todo',
			sectionId: 'sec-todo-2',
			title: 'Labels erstellen',
			content: 'Erstelle Labels wie "Dringend", "Idee" oder "Warten auf".',
			order: 0,
		},
		// ── Todo > Fokus ──────────────────────────────────
		{
			id: 'step-td3-1',
			guideId: 'guide-todo',
			sectionId: 'sec-todo-3',
			title: 'Fokus-Modus starten',
			content: 'Aktiviere den Fokus-Modus, um dich auf eine Aufgabe zu konzentrieren.',
			order: 0,
		},
		// ── AI > Chat ─────────────────────────────────────
		{
			id: 'step-ai1-1',
			guideId: 'guide-ai',
			sectionId: 'sec-ai-1',
			title: 'Chat öffnen',
			content: 'Öffne das Chat-Modul und starte eine Konversation.',
			order: 0,
		},
		{
			id: 'step-ai1-2',
			guideId: 'guide-ai',
			sectionId: 'sec-ai-1',
			title: 'Eine Frage stellen',
			content: 'Frage die KI etwas über deine Notizen oder Aufgaben.',
			order: 1,
		},
		// ── AI > Playground ───────────────────────────────
		{
			id: 'step-ai2-1',
			guideId: 'guide-ai',
			sectionId: 'sec-ai-2',
			title: 'Playground öffnen',
			content: 'Wechsle zum Playground-Modul, um verschiedene KI-Modelle auszuprobieren.',
			order: 0,
		},
		// ── AI > Andere Module ────────────────────────────
		{
			id: 'step-ai3-1',
			guideId: 'guide-ai',
			sectionId: 'sec-ai-3',
			title: 'KI in NutriPhi testen',
			content: 'Fotografiere eine Mahlzeit in NutriPhi und lass die KI die Nährwerte erkennen.',
			order: 0,
		},
		// ── Sync > Account ────────────────────────────────
		{
			id: 'step-sy1-1',
			guideId: 'guide-sync',
			sectionId: 'sec-sync-1',
			title: 'Account erstellen',
			content:
				'Gehe zu Einstellungen → Profil und erstelle einen Account, falls noch nicht geschehen.',
			order: 0,
		},
		// ── Sync > Geräte ─────────────────────────────────
		{
			id: 'step-sy2-1',
			guideId: 'guide-sync',
			sectionId: 'sec-sync-2',
			title: 'Auf zweitem Gerät anmelden',
			content: 'Öffne mana.how auf einem zweiten Gerät und melde dich mit demselben Account an.',
			order: 0,
		},
		{
			id: 'step-sy2-2',
			guideId: 'guide-sync',
			sectionId: 'sec-sync-2',
			title: 'Sync prüfen',
			content: 'Erstelle auf einem Gerät eine Notiz und prüfe, ob sie auf dem anderen erscheint.',
			order: 1,
		},
	] satisfies LocalStep[],

	runs: [] as LocalRun[],
	guideCollections: [] as LocalGuideCollection[],
	guideTags: [] as Array<Record<string, unknown>>,
};
