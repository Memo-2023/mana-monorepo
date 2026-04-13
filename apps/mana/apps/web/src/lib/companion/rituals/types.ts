/**
 * Ritual types — Guided routines that write data into modules.
 *
 * A ritual is a sequence of steps. Each step either executes a tool
 * (e.g. log_drink), collects user input (free text, mood picker,
 * number), or displays information (DaySnapshot data).
 */

export interface LocalRitual {
	id: string;
	title: string;
	description?: string;
	/** When this ritual should trigger ('morning', 'evening', 'manual') */
	trigger: 'morning' | 'evening' | 'manual';
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
	| 'checklist'; // Multiple items to check off

export type RitualStepConfig =
	| ToolCallStepConfig
	| NumberInputStepConfig
	| TextInputStepConfig
	| MoodPickerStepConfig
	| InfoDisplayStepConfig
	| ChecklistStepConfig;

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
	steps: Omit<LocalRitualStep, 'id' | 'ritualId' | 'createdAt'>[];
}

export const RITUAL_TEMPLATES: RitualTemplate[] = [
	{
		id: 'tpl-morning',
		title: 'Morgenroutine',
		description: 'Starte den Tag mit Wasser, Tagesueberblick und Prioritaeten',
		trigger: 'morning',
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
];
