/**
 * Central configuration for all Mana ecosystem apps
 * This is the single source of truth for AppSlider components
 */

import { APP_ICONS } from './app-icons';
import type { AppIconId } from './app-icons';

export type AppStatus = 'published' | 'beta' | 'development' | 'planning';

/**
 * Access tier hierarchy (higher number = more access):
 * guest(0) < public(1) < beta(2) < alpha(3) < founder(4)
 */
export type AccessTier = 'guest' | 'public' | 'beta' | 'alpha' | 'founder';

const TIER_LEVELS: Record<AccessTier, number> = {
	guest: 0,
	public: 1,
	beta: 2,
	alpha: 3,
	founder: 4,
};

/**
 * Check if a user's tier meets the required tier for an app
 */
export function hasAppAccess(userTier: string, requiredTier: AccessTier): boolean {
	const userLevel = TIER_LEVELS[userTier as AccessTier] ?? 0;
	const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;
	return userLevel >= requiredLevel;
}

/**
 * Get the numeric level for a tier (for comparisons)
 */
export function getTierLevel(tier: string): number {
	return TIER_LEVELS[tier as AccessTier] ?? 0;
}

/**
 * Tier display labels
 */
export const ACCESS_TIER_LABELS = {
	de: {
		guest: 'Gast',
		public: 'Standard',
		beta: 'Beta',
		alpha: 'Alpha',
		founder: 'Founder',
	},
	en: {
		guest: 'Guest',
		public: 'Standard',
		beta: 'Beta',
		alpha: 'Alpha',
		founder: 'Founder',
	},
} as const;

export interface ManaApp {
	id: AppIconId;
	name: string;
	description: {
		de: string;
		en: string;
	};
	longDescription: {
		de: string;
		en: string;
	};
	icon: string; // Data URL from APP_ICONS
	color: string;
	comingSoon: boolean;
	status: AppStatus;
	/** Minimum access tier required to use this app */
	requiredTier: AccessTier;
	url?: string; // Optional URL for the app
	/** Whether this app is archived (in apps-archived folder) */
	archived?: boolean;
}

/**
 * All apps in the Mana ecosystem
 * Order determines display order in AppSlider
 */
export const MANA_APPS: ManaApp[] = [
	{
		id: 'mana',
		name: 'Mana',
		description: {
			de: 'Multi-App Ecosystem',
			en: 'Multi-App Ecosystem',
		},
		longDescription: {
			de: 'Das zentrale Dashboard für alle Mana-Apps mit SSO, Credits und App-Verwaltung.',
			en: 'The central dashboard for all Mana apps with SSO, credits, and app management.',
		},
		icon: APP_ICONS.mana,
		color: '#6366f1',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'chat',
		name: 'ManaChat',
		description: {
			de: 'KI Chat Assistent',
			en: 'AI Chat Assistant',
		},
		longDescription: {
			de: 'Dein intelligenter KI-Begleiter für Gespräche, Fragen und kreative Aufgaben.',
			en: 'Your intelligent AI companion for conversations, questions, and creative tasks.',
		},
		icon: APP_ICONS.chat,
		color: '#0ea5e9',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'memoro',
		name: 'Memoro',
		description: {
			de: 'KI Sprachnotizen',
			en: 'AI Voice Memos',
		},
		longDescription: {
			de: 'Verwandle deine Sprachnotizen in organisiertes, durchsuchbares Wissen mit KI-gestützter Transkription.',
			en: 'Transform your voice memos into organized, searchable knowledge with AI-powered transcription.',
		},
		icon: APP_ICONS.memoro,
		color: '#f8d62b',
		comingSoon: false,
		status: 'published',
		requiredTier: 'guest',
	},
	{
		id: 'presi',
		name: 'Presi',
		description: {
			de: 'Präsentations-Creator',
			en: 'Presentation Creator',
		},
		longDescription: {
			de: 'Erstelle beeindruckende Präsentationen mit KI-gestützten Design-Vorschlägen.',
			en: 'Create stunning presentations with AI-powered design suggestions.',
		},
		icon: APP_ICONS.presi,
		color: '#f97316',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'cards',
		name: 'Cards',
		description: {
			de: 'KI Karteikarten',
			en: 'AI Flashcards',
		},
		longDescription: {
			de: 'Lerne intelligenter mit KI-generierten Karteikarten und Spaced Repetition.',
			en: 'Learn smarter with AI-generated flashcards and spaced repetition.',
		},
		icon: APP_ICONS.cards,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'picture',
		name: 'ManaPicture',
		description: {
			de: 'KI Bildgenerierung',
			en: 'AI Image Generation',
		},
		longDescription: {
			de: 'Erschaffe einzigartige Bilder mit der Kraft künstlicher Intelligenz.',
			en: 'Create unique images with the power of artificial intelligence.',
		},
		icon: APP_ICONS.picture,
		color: '#22c55e',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'zitare',
		name: 'Zitare',
		description: {
			de: 'Tägliche Inspiration',
			en: 'Daily Inspiration',
		},
		longDescription: {
			de: 'Entdecke inspirierende Zitate und Weisheiten für jeden Tag.',
			en: 'Discover inspiring quotes and wisdom for every day.',
		},
		icon: APP_ICONS.zitare,
		color: '#f59e0b',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'wisekeep',
		name: 'WiseKeep',
		description: {
			de: 'KI Wissensextraktion',
			en: 'AI Knowledge Extraction',
		},
		longDescription: {
			de: 'Extrahiere Weisheiten und Erkenntnisse aus Videos und Texten.',
			en: 'Extract wisdom and insights from videos and texts.',
		},
		icon: APP_ICONS.wisekeep,
		color: '#6366f1',
		comingSoon: false,
		status: 'planning',
		requiredTier: 'guest',
		archived: true,
	},
	{
		id: 'nutriphi',
		name: 'Nutriphi',
		description: {
			de: 'KI Ernährungstracker',
			en: 'AI Nutrition Tracker',
		},
		longDescription: {
			de: 'Tracke deine Ernährung mit KI-gestützter Foto-Analyse und erhalte detaillierte Nährwertinformationen.',
			en: 'Track your nutrition with AI-powered photo analysis and get detailed nutritional information.',
		},
		icon: APP_ICONS.nutriphi,
		color: '#10b981',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
		archived: true,
	},
	{
		id: 'contacts',
		name: 'Kontakte',
		description: {
			de: 'Kontaktverwaltung',
			en: 'Contact Management',
		},
		longDescription: {
			de: 'Verwalte deine Kontakte übersichtlich mit Gruppen, Tags und Notizen.',
			en: 'Manage your contacts clearly with groups, tags, and notes.',
		},
		icon: APP_ICONS.contacts,
		color: '#3b82f6',
		comingSoon: false,
		status: 'published',
		requiredTier: 'guest',
	},
	{
		id: 'calendar',
		name: 'Kalender',
		description: {
			de: 'Smarte Kalenderverwaltung',
			en: 'Smart Calendar Management',
		},
		longDescription: {
			de: 'Organisiere deine Zeit intelligent mit persönlichen und geteilten Kalendern, wiederkehrenden Terminen und Erinnerungen.',
			en: 'Organize your time intelligently with personal and shared calendars, recurring events, and reminders.',
		},
		icon: APP_ICONS.calendar,
		color: '#0ea5e9',
		comingSoon: false,
		status: 'published',
		requiredTier: 'guest',
	},
	{
		id: 'storage',
		name: 'Storage',
		description: {
			de: 'Cloud-Speicherung',
			en: 'Cloud Storage',
		},
		longDescription: {
			de: 'Sichere Cloud-Speicherung für deine Dateien mit Ordnern, Versionierung, Sharing und mehr.',
			en: 'Secure cloud storage for your files with folders, versioning, sharing, and more.',
		},
		icon: APP_ICONS.storage,
		color: '#3b82f6',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	// Clock consolidated into Times
	{
		id: 'todo',
		name: 'Todo',
		description: {
			de: 'Aufgabenverwaltung',
			en: 'Task Management',
		},
		longDescription: {
			de: 'Verwalte Aufgaben mit Projekten, Labels, Subtasks und wiederkehrenden Terminen.',
			en: 'Manage tasks with projects, labels, subtasks, and recurring schedules.',
		},
		icon: APP_ICONS.todo,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'published',
		requiredTier: 'guest',
	},
	{
		id: 'mail',
		name: 'ManaMail',
		description: {
			de: 'Smart Email Client',
			en: 'Smart Email Client',
		},
		longDescription: {
			de: 'Intelligenter E-Mail-Client mit KI-Zusammenfassungen, Smart Reply und Multi-Account-Unterstützung.',
			en: 'Intelligent email client with AI summaries, smart reply, and multi-account support.',
		},
		icon: APP_ICONS.mail,
		color: '#6366f1',
		comingSoon: false,
		status: 'planning',
		requiredTier: 'guest',
	},
	{
		id: 'moodlit',
		name: 'Moodlit',
		description: {
			de: 'Ambient Lighting & Moods',
			en: 'Ambient Lighting & Moods',
		},
		longDescription: {
			de: 'Erstelle beruhigende Lichtstimmungen mit animierten Farbverläufen für entspannte Atmosphäre.',
			en: 'Create calming ambient lighting with animated color gradients for a relaxed atmosphere.',
		},
		icon: APP_ICONS.moodlit,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'inventory',
		name: 'Inventory',
		description: {
			de: 'Besitz-Verwaltung',
			en: 'Inventory Management',
		},
		longDescription: {
			de: 'Verwalte deinen Besitz mit Fotos, Kaufbelegen, Garantie-Dokumenten, Kategorien und Standorten.',
			en: 'Manage your belongings with photos, receipts, warranty documents, categories, and locations.',
		},
		icon: APP_ICONS.inventory,
		color: '#14b8a6',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'questions',
		name: 'Questions',
		description: {
			de: 'KI Recherche-Assistent',
			en: 'AI Research Assistant',
		},
		longDescription: {
			de: 'Sammle Fragen und erhalte umfassende Antworten durch KI-gestützte Web-Recherche.',
			en: 'Collect questions and get comprehensive answers through AI-powered web research.',
		},
		icon: APP_ICONS.questions,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'context',
		name: 'Context',
		description: {
			de: 'Wissensmanagement',
			en: 'Knowledge Management',
		},
		longDescription: {
			de: 'AI-gestütztes Dokumenten- und Wissensmanagement mit Spaces, Kontextreferenzen und KI-Generierung.',
			en: 'AI-powered document and knowledge management with spaces, context references, and AI generation.',
		},
		icon: APP_ICONS.context,
		color: '#0ea5e9',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'times',
		name: 'Times',
		description: {
			de: 'Zeiterfassung, Uhren & Timer',
			en: 'Time Tracking, Clocks & Timers',
		},
		longDescription: {
			de: 'Professionelle Zeiterfassung mit Timer, Projekten, Kunden, Reports, Weltzeituhr, Wecker, Stoppuhr und Pomodoro.',
			en: 'Professional time tracking with timer, projects, clients, reports, world clock, alarms, stopwatch, and pomodoro.',
		},
		icon: APP_ICONS.times,
		color: '#f59e0b',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'citycorners',
		name: 'CityCorners',
		description: {
			de: 'Stadtführer für Konstanz',
			en: 'City Guide for Konstanz',
		},
		longDescription: {
			de: 'Entdecke Sehenswürdigkeiten, Restaurants, Museen und Läden in Konstanz am Bodensee.',
			en: 'Discover sights, restaurants, museums, and shops in Konstanz at Lake Constance.',
		},
		icon: APP_ICONS.citycorners,
		color: '#2563eb',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'uload',
		name: 'uLoad',
		description: {
			de: 'URL-Shortener & Link-Management',
			en: 'URL Shortener & Link Management',
		},
		longDescription: {
			de: 'Kürze URLs, tracke Klicks und verwalte deine Links.',
			en: 'Shorten URLs, track clicks, and manage your links.',
		},
		icon: APP_ICONS.uload,
		color: '#6366f1',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'news',
		name: 'News Hub',
		description: {
			de: 'Kuratierter Newsfeed',
			en: 'Curated News Feed',
		},
		longDescription: {
			de: 'Kuratierter Newsfeed aus öffentlichen Quellen mit persönlicher Leseliste — wähle Themen aus, blende Quellen aus und bau dir deinen eigenen Feed.',
			en: 'Curated news feed from public sources with a personal reading list — pick topics, hide sources, and shape your own feed.',
		},
		icon: APP_ICONS.news,
		color: '#10b981',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'calc',
		name: 'Calc',
		description: {
			de: 'Taschenrechner & Umrechner',
			en: 'Calculator & Converter',
		},
		longDescription: {
			de: 'Taschenrechner mit Standard, Wissenschaftlich, Programmierer, Einheiten, Währung und Finanzrechnern.',
			en: 'Calculator with standard, scientific, programmer, unit, currency and finance modes.',
		},
		icon: APP_ICONS.calc,
		color: '#ec4899',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'guides',
		name: 'Guides',
		description: {
			de: 'Schritt-für-Schritt Anleitungen',
			en: 'Step-by-Step Guides',
		},
		longDescription: {
			de: 'Erstelle und führe strukturierte Anleitungen aus — Rezepte, SOPs, Lernpfade und Playbooks mit Ausführungshistorie.',
			en: 'Create and execute structured guides — recipes, SOPs, learning paths, and playbooks with run history.',
		},
		icon: APP_ICONS.guides,
		color: '#0d9488',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'music',
		name: 'Music',
		description: {
			de: 'Musikproduktion',
			en: 'Music Production',
		},
		longDescription: {
			de: 'Erstelle und verwalte Songs, Playlists und Musikprojekte mit Markern und Arrangements.',
			en: 'Create and manage songs, playlists, and music projects with markers and arrangements.',
		},
		icon: APP_ICONS.music,
		color: '#ec4899',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'photos',
		name: 'Photos',
		description: {
			de: 'Fotoverwaltung',
			en: 'Photo Management',
		},
		longDescription: {
			de: 'Verwalte deine Fotos mit Alben, Tags und Favoriten.',
			en: 'Manage your photos with albums, tags, and favorites.',
		},
		icon: APP_ICONS.photos,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'planta',
		name: 'Planta',
		description: {
			de: 'Pflanzenpflege',
			en: 'Plant Care',
		},
		longDescription: {
			de: 'Verwalte deine Pflanzen mit Gießplänen, Fotos und Pflegeprotokollen.',
			en: 'Manage your plants with watering schedules, photos, and care logs.',
		},
		icon: APP_ICONS.planta,
		color: '#22c55e',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'skilltree',
		name: 'SkillTree',
		description: {
			de: 'Skill-Tracking',
			en: 'Skill Tracking',
		},
		longDescription: {
			de: 'Verfolge deinen Lernfortschritt mit Skills, Aktivitäten und Achievements.',
			en: 'Track your learning progress with skills, activities, and achievements.',
		},
		icon: APP_ICONS.skilltree,
		color: '#f59e0b',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'body',
		name: 'Body',
		description: {
			de: 'Training & Körper-Tracking',
			en: 'Training & Body Tracking',
		},
		longDescription: {
			de: 'Logge Workouts, Sätze und progressive Steigerung neben Gewicht, Maßen und täglichen Energie-Checks. Eine App für alles, was deinen Körper bewegt und verändert.',
			en: 'Log workouts, sets, and progressive overload alongside weight, measurements, and daily energy check-ins. One app for everything that moves and changes your body.',
		},
		icon: APP_ICONS.body,
		color: '#ef4444',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'habits',
		name: 'Habits',
		description: {
			de: 'Gewohnheiten tracken',
			en: 'Habit Tracking',
		},
		longDescription: {
			de: 'Schnelles Tally-Tracking für Gewohnheiten wie Kaffee, Zigaretten, Wasser — ein Tap pro Eintrag mit Tagesstatistiken und Streaks.',
			en: 'Quick tally tracking for habits like coffee, cigarettes, water — one tap per entry with daily stats and streaks.',
		},
		icon: APP_ICONS.habits,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'journal',
		name: 'Journal',
		description: {
			de: 'Tagebuch',
			en: 'Journal',
		},
		longDescription: {
			de: 'Täglich deine Gedanken und Gefühle festhalten. Mit Stimmungen, Tags, Streak-Tracking und historischen Rückblicken.',
			en: 'Capture your thoughts and feelings daily. With moods, tags, streak tracking, and historical recaps.',
		},
		icon: APP_ICONS.journal,
		color: '#6366f1',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'notes',
		name: 'Notes',
		description: {
			de: 'Schnelle Notizen',
			en: 'Quick Notes',
		},
		longDescription: {
			de: 'Leichtgewichtige Notizen mit Suche, Farbmarkierungen und Pin-Funktion. Kein Overhead, sofort losschreiben.',
			en: 'Lightweight notes with search, color tags, and pinning. No overhead, start writing immediately.',
		},
		icon: APP_ICONS.notes,
		color: '#f59e0b',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'dreams',
		name: 'Dreams',
		description: {
			de: 'Traumtagebuch',
			en: 'Dream Journal',
		},
		longDescription: {
			de: 'Halte deine Träume fest, bevor sie verblassen. Stimmung, Klartraum-Status, wiederkehrende Symbole und Insights über die Zeit.',
			en: 'Capture your dreams before they fade. Mood, lucid status, recurring symbols, and insights over time.',
		},
		icon: APP_ICONS.dreams,
		color: '#6366f1',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'firsts',
		name: 'Firsts',
		description: {
			de: 'Erste Male',
			en: 'First Times',
		},
		longDescription: {
			de: 'Halte deine ersten Male fest — von Bucket-List-Träumen bis zu erlebten Momenten. Mit Personen, Orten, Fotos und dem Vorher/Nachher-Gefühl.',
			en: 'Track your first times — from bucket list dreams to lived moments. With people, places, photos, and the before/after feeling.',
		},
		icon: APP_ICONS.firsts,
		color: '#f59e0b',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'cycles',
		name: 'Cycles',
		description: {
			de: 'Menstruationszyklus-Tracking',
			en: 'Menstrual Cycle Tracking',
		},
		longDescription: {
			de: 'Tracke deinen Zyklus mit Blutungstagen, Symptomen, Stimmung und Basaltemperatur. Phasen-Erkennung und Vorhersage für die nächste Periode und das fruchtbare Fenster.',
			en: 'Track your cycle with flow days, symptoms, mood, and basal temperature. Phase detection and prediction of the next period and fertile window.',
		},
		icon: APP_ICONS.cycles,
		color: '#ec4899',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'events',
		name: 'Events',
		description: {
			de: 'Veranstaltungen mit Gästeliste',
			en: 'Gatherings with guest lists',
		},
		longDescription: {
			de: 'Plane Geburtstage, Dinner und Workshops mit Gästeliste, RSVPs und teilbaren Einladungslinks. Events erscheinen automatisch in deinem Kalender.',
			en: 'Plan birthdays, dinners, and workshops with guest lists, RSVPs, and shareable invite links. Events appear automatically in your calendar.',
		},
		icon: APP_ICONS.events,
		color: '#f43f5e',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'finance',
		name: 'Finance',
		description: {
			de: 'Einnahmen & Ausgaben',
			en: 'Income & Expenses',
		},
		longDescription: {
			de: 'Einfaches Finanztracking mit Kategorien, Monatsbudgets und Übersicht deiner Einnahmen und Ausgaben.',
			en: 'Simple finance tracking with categories, monthly budgets, and overview of your income and expenses.',
		},
		icon: APP_ICONS.finance,
		color: '#22c55e',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'places',
		name: 'Places',
		description: {
			de: 'Standort-Tracking',
			en: 'Location Tracking',
		},
		longDescription: {
			de: 'Tracke deinen Standort, erstelle Orte und sieh deine Bewegungshistorie.',
			en: 'Track your location, create places, and view your movement history.',
		},
		icon: APP_ICONS.places,
		color: '#0ea5e9',
		comingSoon: false,
		status: 'development',
		requiredTier: 'guest',
	},
	{
		id: 'arcade',
		name: 'Arcade',
		description: {
			de: 'KI Browser-Spiele',
			en: 'AI Browser Games',
		},
		longDescription: {
			de: 'Sammlung von KI-generierten Browser-Spielen zum sofortigen Spielen.',
			en: 'Collection of AI-generated browser games to play instantly.',
		},
		icon: APP_ICONS.arcade,
		color: '#ef4444',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'guest',
	},
	{
		id: 'who',
		name: 'Who',
		description: {
			de: 'Errate wer ich bin',
			en: 'Guess who I am',
		},
		longDescription: {
			de: 'Chatte mit einer historischen Persönlichkeit. Eine KI verkörpert sie ohne den Namen zu verraten — du musst durch geschickte Fragen herausfinden, mit wem du sprichst. Vier Decks: Historisch, Frauen der Geschichte, Antike, Erfinder & Pioniere.',
			en: 'Chat with a historical figure. An AI roleplays them without revealing their name — you have to figure out who you are talking to. Four decks: Historical, Women in History, Antiquity, Inventors & Pioneers.',
		},
		icon: APP_ICONS.who,
		color: '#a855f7',
		comingSoon: false,
		status: 'beta',
		// Open to all signed-in users (Standard / public tier and up).
		// The initial 'beta' here was an arbitrary RFC default — it
		// matched the status='beta' badge but the gate was more friction
		// than value while the module is finding its audience. The LLM
		// calls behind it are credit-gated server-side regardless.
		requiredTier: 'guest',
	},
];

/**
 * Get a specific app by ID
 */
export function getManaApp(id: AppIconId): ManaApp | undefined {
	return MANA_APPS.find((app) => app.id === id);
}

/**
 * Get apps filtered by status
 */
export function getManaAppsByStatus(status: AppStatus): ManaApp[] {
	return MANA_APPS.filter((app) => app.status === status);
}

/**
 * Get only published/available apps
 */
export function getAvailableManaApps(): ManaApp[] {
	return MANA_APPS.filter((app) => !app.comingSoon);
}

/**
 * Get only active (non-archived) apps
 */
export function getActiveManaApps(): ManaApp[] {
	return MANA_APPS.filter((app) => !app.archived);
}

/**
 * Get apps accessible to a user based on their tier
 * Only returns active (non-archived) apps the user has access to
 */
export function getAccessibleManaApps(userTier: string): ManaApp[] {
	return MANA_APPS.filter((app) => !app.archived && hasAppAccess(userTier, app.requiredTier));
}

/**
 * Status labels in German and English
 */
export const APP_STATUS_LABELS = {
	de: {
		published: 'Live',
		beta: 'Beta',
		development: 'In Entwicklung',
		planning: 'Geplant',
	},
	en: {
		published: 'Live',
		beta: 'Beta',
		development: 'In Development',
		planning: 'Planned',
	},
} as const;

/**
 * Common labels for AppSlider in German and English
 */
export const APP_SLIDER_LABELS = {
	de: {
		title: 'Teil des Mana Ecosystems',
		comingSoon: 'Demnächst',
		openApp: 'App öffnen',
	},
	en: {
		title: 'Part of the Mana Ecosystem',
		comingSoon: 'Coming Soon',
		openApp: 'Open App',
	},
} as const;

/**
 * App URLs — derived automatically from MANA_APPS.
 *
 * Almost every productivity app lives under the unified mana.how/{id}
 * surface, so listing each entry by hand was duplicated bookkeeping that
 * silently drifted (a missing entry crashed `getPillAppItems` at runtime
 * when the new `who` app was added). Instead we generate the map from
 * MANA_APPS at module load and only override the few apps that don't
 * follow the unified-path convention.
 *
 * To add a new app: register it in MANA_APPS and you're done. To put it
 * on its own subdomain or use a custom port: add an entry to
 * APP_URL_OVERRIDES below.
 */
const APP_URL_OVERRIDES: Partial<Record<AppIconId, { dev: string; prod: string }>> = {
	// The unified app itself lives at the root, not at /mana.
	mana: { dev: 'http://localhost:5173', prod: 'https://mana.how' },
	// Standalone apps on their own subdomain / port.
	arcade: { dev: 'http://localhost:5201', prod: 'https://arcade.mana.how' },
};

export const APP_URLS: Record<AppIconId, { dev: string; prod: string }> = Object.fromEntries(
	(Object.keys(APP_ICONS) as AppIconId[]).map((id) => [
		id,
		APP_URL_OVERRIDES[id] ?? {
			dev: `http://localhost:5173/${id}`,
			prod: `https://mana.how/${id}`,
		},
	])
) as Record<AppIconId, { dev: string; prod: string }>;

/**
 * App item type for PillNavigation app switcher
 */
export interface PillAppItemConfig {
	id: string;
	name: string;
	url: string;
	icon?: string;
	color?: string;
	isCurrent?: boolean;
}

/**
 * Get app items for PillNavigation app switcher
 * Only returns apps the user has access to (non-archived, tier-gated)
 * @param currentAppId - The ID of the current app to mark as active
 * @param isDev - Whether to use development URLs (default: auto-detect)
 * @param customUrls - Optional custom URL overrides per app
 * @param userTier - The user's access tier (default: 'public')
 */
export function getPillAppItems(
	currentAppId?: AppIconId,
	isDev?: boolean,
	customUrls?: Partial<Record<AppIconId, string>>,
	userTier?: string
): PillAppItemConfig[] {
	const isDevMode =
		isDev ?? (typeof window !== 'undefined' && window.location.hostname === 'localhost');

	const tier = userTier || 'public';
	// Only show apps the user has access to
	return getAccessibleManaApps(tier).map((app) => ({
		id: app.id,
		name: app.name,
		url: customUrls?.[app.id] || (isDevMode ? APP_URLS[app.id].dev : APP_URLS[app.id].prod),
		icon: app.icon,
		color: app.color,
		isCurrent: app.id === currentAppId,
	}));
}
