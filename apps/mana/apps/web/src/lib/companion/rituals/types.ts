/**
 * Ritual types — Guided sequences, either utility (data capture) or
 * ceremony (presence/meaning) or a mix of both.
 *
 * A ritual is an ordered list of steps. Steps come in two flavours:
 *   - Utility:  tool_call / number_input / text_input / mood_picker /
 *               info_display / checklist — each writes data into other
 *               modules (drink, food, tasks, …) via the AI tool layer.
 *   - Ceremony: presence / breath / media — no tool calls, no data
 *               written. They exist to hold the user's attention on
 *               something for a moment (a timer, a breath pattern, an
 *               image). Useful for morning coffee, Sunday reset,
 *               before-bed shutdown.
 *
 * `category` on the ritual itself is a hint for filtering and UI intent,
 * not a hard constraint — a ritual can mix utility + ceremony steps.
 */

export type RitualCategory = 'utility' | 'ceremony' | 'mixed';

export interface LocalRitual {
	id: string;
	title: string;
	description?: string;
	/** When this ritual should trigger ('morning', 'evening', 'manual') */
	trigger: 'morning' | 'evening' | 'manual';
	/**
	 * UI hint: is this more "log my state" (utility) or "hold my attention"
	 * (ceremony)? Defaults to 'utility' for backward compatibility with the
	 * original ai-rituals design where every ritual was tool-driven.
	 */
	category?: RitualCategory;
	status: 'active' | 'paused' | 'archived';
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
}

export interface LocalRitualStep {
	id: string;
	ritualId: string;
	order: number;
	/** Step type determines the UI and behavior */
	type: RitualStepType;
	/** Human-readable label shown to the user */
	label: string;
	/** Configuration depends on type */
	config: RitualStepConfig;
	createdAt: string;
}

export type RitualStepType =
	| 'tool_call' // Execute a tool with preset params
	| 'number_input' // User enters a number → tool call
	| 'text_input' // User enters text → tool call
	| 'mood_picker' // User picks mood (1-5) → tool call
	| 'info_display' // Show data from projections (read-only)
	| 'checklist' // Multiple items to check off
	| 'presence' // Markdown text + optional timer — hold attention
	| 'breath' // Guided breathing pattern (box / 4-7-8 / custom)
	| 'media'; // Image + caption — e.g. mantra, photo, quote

export type RitualStepConfig =
	| ToolCallStepConfig
	| NumberInputStepConfig
	| TextInputStepConfig
	| MoodPickerStepConfig
	| InfoDisplayStepConfig
	| ChecklistStepConfig
	| PresenceStepConfig
	| BreathStepConfig
	| MediaStepConfig;

export interface ToolCallStepConfig {
	type: 'tool_call';
	toolName: string;
	params: Record<string, unknown>;
}

export interface NumberInputStepConfig {
	type: 'number_input';
	toolName: string;
	paramName: string;
	/** Other params to pass along */
	baseParams: Record<string, unknown>;
	unit?: string;
	min?: number;
	max?: number;
	defaultValue?: number;
}

export interface TextInputStepConfig {
	type: 'text_input';
	toolName: string;
	paramName: string;
	baseParams: Record<string, unknown>;
	placeholder?: string;
}

export interface MoodPickerStepConfig {
	type: 'mood_picker';
	toolName: string;
	paramName: string;
	baseParams: Record<string, unknown>;
}

export interface InfoDisplayStepConfig {
	type: 'info_display';
	/** Which projection data to show */
	source: 'tasks_today' | 'events_today' | 'drink_progress' | 'nutrition_progress' | 'streaks';
}

export interface ChecklistStepConfig {
	type: 'checklist';
	items: { label: string; toolName?: string; toolParams?: Record<string, unknown> }[];
}

// ── Ceremony steps (no tool calls) ───────────────────

export interface PresenceStepConfig {
	type: 'presence';
	/** Markdown-ish body text shown while the timer runs. */
	body?: string;
	/** Optional countdown timer in seconds. Step can be advanced manually at any time. */
	durationSec?: number;
}

export type BreathPattern =
	| 'box' // 4-4-4-4
	| '4-7-8' // inhale 4, hold 7, exhale 8
	| 'coherent' // 5-0-5-0 (slow resonant breathing)
	| 'custom';

export interface BreathStepConfig {
	type: 'breath';
	pattern: BreathPattern;
	/** Number of full cycles. */
	cycles: number;
	/** Required when pattern='custom'; otherwise derived from the preset. */
	timings?: { inhaleSec: number; hold1Sec: number; exhaleSec: number; hold2Sec: number };
}

export interface MediaStepConfig {
	type: 'media';
	/** URL or data-URL of the image. */
	imageUrl?: string;
	/** Caption / mantra / quote shown below the image. */
	caption?: string;
	/** Optional linger timer before the user can advance. */
	durationSec?: number;
}

export interface LocalRitualLog {
	id?: number;
	ritualId: string;
	date: string; // YYYY-MM-DD
	completedSteps: number;
	totalSteps: number;
	completedAt?: string;
	createdAt: string;
}

// ── Templates ───────────────────────────────────────

export interface RitualTemplate {
	id: string;
	title: string;
	description: string;
	trigger: LocalRitual['trigger'];
	category?: RitualCategory;
	steps: Omit<LocalRitualStep, 'id' | 'ritualId' | 'createdAt'>[];
}

export const RITUAL_TEMPLATES: RitualTemplate[] = [
	{
		id: 'tpl-morning',
		title: 'Morgenroutine',
		description: 'Starte den Tag mit Wasser, Tagesueberblick und Prioritaeten',
		trigger: 'morning',
		category: 'utility',
		steps: [
			{
				order: 0,
				type: 'tool_call',
				label: 'Glas Wasser trinken',
				config: {
					type: 'tool_call',
					toolName: 'log_drink',
					params: { drinkType: 'water', quantityMl: 250, name: 'Wasser' },
				},
			},
			{
				order: 1,
				type: 'info_display',
				label: 'Dein Tag auf einen Blick',
				config: { type: 'info_display', source: 'events_today' },
			},
			{
				order: 2,
				type: 'info_display',
				label: 'Heutige Tasks',
				config: { type: 'info_display', source: 'tasks_today' },
			},
			{
				order: 3,
				type: 'info_display',
				label: 'Deine Streaks',
				config: { type: 'info_display', source: 'streaks' },
			},
		],
	},
	{
		id: 'tpl-evening',
		title: 'Abendroutine',
		description: 'Reflektiere den Tag und plane morgen',
		trigger: 'evening',
		category: 'utility',
		steps: [
			{
				order: 0,
				type: 'info_display',
				label: 'Tages-Zusammenfassung',
				config: { type: 'info_display', source: 'drink_progress' },
			},
			{
				order: 1,
				type: 'info_display',
				label: 'Ernaehrung heute',
				config: { type: 'info_display', source: 'nutrition_progress' },
			},
			{
				order: 2,
				type: 'text_input',
				label: 'Was war heute gut?',
				config: {
					type: 'text_input',
					toolName: 'create_task',
					paramName: 'title',
					baseParams: {},
					placeholder: 'z.B. Gutes Gespraech mit Anna...',
				},
			},
		],
	},
	{
		id: 'tpl-hydration',
		title: 'Trink-Check',
		description: 'Schneller Wasser-Check und Nachloggen',
		trigger: 'manual',
		category: 'utility',
		steps: [
			{
				order: 0,
				type: 'info_display',
				label: 'Wasser-Fortschritt',
				config: { type: 'info_display', source: 'drink_progress' },
			},
			{
				order: 1,
				type: 'number_input',
				label: 'Wasser nachloggen',
				config: {
					type: 'number_input',
					toolName: 'log_drink',
					paramName: 'quantityMl',
					baseParams: { drinkType: 'water', name: 'Wasser' },
					unit: 'ml',
					min: 100,
					max: 1000,
					defaultValue: 250,
				},
			},
		],
	},

	// ── Ceremony templates ─────────────────────────────

	{
		id: 'tpl-morning-coffee',
		title: 'Morgenkaffee',
		description: 'Einen Moment für den ersten Kaffee des Tages — ohne Handy, ohne Eile.',
		trigger: 'morning',
		category: 'ceremony',
		steps: [
			{
				order: 0,
				type: 'presence',
				label: 'Wasser aufsetzen',
				config: {
					type: 'presence',
					body: 'Setz das Wasser auf. Atme dabei bewusst. Das Geräusch des Kochers ist dein erster Anker im Tag.',
					durationSec: 180,
				},
			},
			{
				order: 1,
				type: 'presence',
				label: 'Aufbrühen',
				config: {
					type: 'presence',
					body: 'Gieß langsam. Riech den Kaffee, bevor du ihn trinkst. Nichts tun außer brühen.',
					durationSec: 240,
				},
			},
			{
				order: 2,
				type: 'breath',
				label: 'Drei tiefe Atemzüge',
				config: { type: 'breath', pattern: 'coherent', cycles: 3 },
			},
			{
				order: 3,
				type: 'presence',
				label: 'Fünf Minuten still trinken',
				config: {
					type: 'presence',
					body: 'Kein Handy. Kein Podcast. Nur der Kaffee und der Morgen. Wie fühlst du dich heute?',
					durationSec: 300,
				},
			},
		],
	},

	{
		id: 'tpl-sunday-reset',
		title: 'Sonntag-Reset',
		description: 'Die Woche abschließen, die nächste vorbereiten — ohne Hetze.',
		trigger: 'manual',
		category: 'mixed',
		steps: [
			{
				order: 0,
				type: 'presence',
				label: 'Ankommen',
				config: {
					type: 'presence',
					body: 'Mach dir einen Tee. Setz dich hin. Die Woche ist vorbei.',
					durationSec: 300,
				},
			},
			{
				order: 1,
				type: 'info_display',
				label: 'Was diese Woche gelaufen ist',
				config: { type: 'info_display', source: 'streaks' },
			},
			{
				order: 2,
				type: 'text_input',
				label: 'Was nehme ich mit?',
				config: {
					type: 'text_input',
					toolName: 'create_task',
					paramName: 'title',
					baseParams: {},
					placeholder: 'Ein Moment, eine Lektion, ein Gefühl...',
				},
			},
			{
				order: 3,
				type: 'info_display',
				label: 'Nächste Woche',
				config: { type: 'info_display', source: 'events_today' },
			},
			{
				order: 4,
				type: 'presence',
				label: 'Handy weg',
				config: {
					type: 'presence',
					body: 'Für die nächsten zwei Stunden: Handy in den anderen Raum. Buch, Kochen, Spaziergang — was auch immer dir gut tut.',
				},
			},
		],
	},

	{
		id: 'tpl-bedtime',
		title: 'Vor dem Schlaf',
		description: 'Herunterfahren. Gedanken loslassen. Bereit für die Nacht.',
		trigger: 'evening',
		category: 'ceremony',
		steps: [
			{
				order: 0,
				type: 'presence',
				label: 'Bildschirme aus',
				config: {
					type: 'presence',
					body: 'Schalte Fernseher, Laptop und Handy aus. Leg das Handy nicht neben das Bett.',
					durationSec: 60,
				},
			},
			{
				order: 1,
				type: 'breath',
				label: '4-7-8 Atmung',
				config: { type: 'breath', pattern: '4-7-8', cycles: 4 },
			},
			{
				order: 2,
				type: 'text_input',
				label: 'Was hat mich heute bewegt?',
				config: {
					type: 'text_input',
					toolName: 'create_journal_entry',
					paramName: 'content',
					baseParams: {},
					placeholder: 'Ein Satz reicht.',
				},
			},
			{
				order: 3,
				type: 'presence',
				label: 'Loslassen',
				config: {
					type: 'presence',
					body: 'Was heute offen geblieben ist, bleibt offen. Morgen ist ein neuer Tag.',
					durationSec: 120,
				},
			},
		],
	},
];
