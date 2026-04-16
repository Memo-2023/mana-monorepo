/**
 * AI Tool Catalog — single source of truth for all tool schemas.
 *
 * Both the webapp (policy, planner prompt, executor) and the server-side
 * mana-ai service (planner prompt, drift guard) derive their tool lists
 * from this catalog. Adding a new tool:
 *
 *   1. Add its schema here with `defaultPolicy`
 *   2. Add the `execute` function in the webapp module's `tools.ts`
 *   3. Done — policy, server tools, and proposable list derive automatically
 *
 * The `defaultPolicy` field determines how the tool behaves by default:
 *   - `'propose'` — AI writes go through the Proposal review workflow
 *   - `'auto'`    — executes immediately during the reasoning loop (read-only / append-only)
 */

import type { PolicyDecision } from '../policy/types';

export interface ToolSchema {
	readonly name: string;
	readonly module: string;
	readonly description: string;
	readonly defaultPolicy: PolicyDecision;
	readonly parameters: ReadonlyArray<{
		readonly name: string;
		readonly type: string;
		readonly required: boolean;
		readonly description: string;
		readonly enum?: readonly string[];
	}>;
}

// ═══════════════════════════════════════════════════════════════
//  TOOL CATALOG
// ═══════════════════════════════════════════════════════════════

export const AI_TOOL_CATALOG: readonly ToolSchema[] = [
	// ── Todo ──────────────────────────────────────────────────
	{
		name: 'create_task',
		module: 'todo',
		description: 'Erstellt einen neuen Task mit optionalem Faelligkeitsdatum und Prioritaet',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Tasks', required: true },
			{
				name: 'dueDate',
				type: 'string',
				description: 'Faelligkeitsdatum (YYYY-MM-DD)',
				required: false,
			},
			{
				name: 'priority',
				type: 'string',
				description: 'Prioritaet',
				required: false,
				enum: ['low', 'medium', 'high'],
			},
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
		],
	},
	{
		name: 'complete_task',
		module: 'todo',
		description: 'Markiert einen Task als erledigt',
		defaultPolicy: 'propose',
		parameters: [{ name: 'taskId', type: 'string', description: 'ID des Tasks', required: true }],
	},
	{
		name: 'complete_tasks_by_title',
		module: 'todo',
		description: 'Markiert alle Tasks deren Titel den Substring enthält (case-insensitive)',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'titleSubstring',
				type: 'string',
				description: 'Teil des Task-Titels',
				required: true,
			},
		],
	},
	{
		name: 'get_task_stats',
		module: 'todo',
		description:
			'Gibt Statistiken ueber alle Tasks zurueck (total, erledigt, ueberfaellig, heute faellig)',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'list_tasks',
		module: 'todo',
		description:
			'Listet Tasks mit Titel, Faelligkeit und Prioritaet auf. Nutze diese, wenn der Nutzer fragt welche Tasks er hat oder eine Liste sehen will.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'filter',
				type: 'string',
				description: 'Welche Tasks zeigen',
				required: false,
				enum: ['open', 'completed', 'overdue', 'today', 'all'],
			},
			{
				name: 'limit',
				type: 'number',
				description: 'Maximale Anzahl (default: 20)',
				required: false,
			},
		],
	},

	// ── Calendar ──────────────────────────────────────────────
	{
		name: 'create_event',
		module: 'calendar',
		description: 'Erstellt einen Kalender-Event',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'title', type: 'string', description: 'Event-Titel', required: true },
			{ name: 'startIso', type: 'string', description: 'Start (ISO)', required: true },
			{ name: 'endIso', type: 'string', description: 'Ende (ISO)', required: false },
		],
	},
	{
		name: 'get_todays_events',
		module: 'calendar',
		description: 'Gibt alle Termine fuer heute zurueck',
		defaultPolicy: 'auto',
		parameters: [],
	},

	// ── Notes ─────────────────────────────────────────────────
	{
		name: 'create_note',
		module: 'notes',
		description: 'Erstellt eine neue Notiz. Gibt die ID der angelegten Notiz zurueck.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel der Notiz', required: true },
			{
				name: 'content',
				type: 'string',
				description: 'Inhalt der Notiz (Markdown)',
				required: false,
			},
		],
	},
	{
		name: 'update_note',
		module: 'notes',
		description:
			'Überschreibt Titel und/oder Inhalt einer bestehenden Notiz. Destruktiv — bevorzuge append_to_note oder add_tag_to_note wenn du nur ergänzen willst.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'noteId', type: 'string', description: 'ID der Notiz', required: true },
			{ name: 'title', type: 'string', description: 'Neuer Titel', required: false },
			{
				name: 'content',
				type: 'string',
				description: 'Neuer Inhalt (überschreibt vollständig)',
				required: false,
			},
		],
	},
	{
		name: 'append_to_note',
		module: 'notes',
		description:
			'Hängt Text ans Ende des Inhalts einer bestehenden Notiz an (neue Zeile getrennt). Nicht-destruktiv.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'noteId', type: 'string', description: 'ID der Notiz', required: true },
			{ name: 'content', type: 'string', description: 'Text zum Anhängen', required: true },
		],
	},
	{
		name: 'add_tag_to_note',
		module: 'notes',
		description:
			'Fügt einen Hashtag (z.B. "#Natur") an eine bestehende Notiz an. Idempotent — wenn der Tag schon vorhanden ist, passiert nichts.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'noteId', type: 'string', description: 'ID der Notiz', required: true },
			{
				name: 'tag',
				type: 'string',
				description:
					'Tag-Name (ohne #; z.B. "Natur", "Arbeit"). Leerzeichen werden durch _ ersetzt.',
				required: true,
			},
		],
	},
	{
		name: 'list_notes',
		module: 'notes',
		description:
			'Listet vorhandene Notizen (id, title, excerpt) damit du sie referenzieren kannst. Standardmäßig ohne archivierte.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'limit',
				type: 'number',
				description: 'Maximale Anzahl (Standard 30, max 100)',
				required: false,
			},
			{
				name: 'query',
				type: 'string',
				description: 'Case-insensitive Substring-Filter auf Titel oder Inhalt',
				required: false,
			},
			{
				name: 'includeArchived',
				type: 'boolean',
				description: 'Auch archivierte Notizen einbeziehen (default false)',
				required: false,
			},
		],
	},

	// ── Places ────────────────────────────────────────────────
	{
		name: 'create_place',
		module: 'places',
		description: 'Fügt einen neuen Ort hinzu',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'name', type: 'string', description: 'Name des Ortes', required: true },
			{ name: 'category', type: 'string', description: 'Kategorie', required: false },
		],
	},
	{
		name: 'visit_place',
		module: 'places',
		description: 'Vermerkt einen Besuch an einem bereits erfassten Ort',
		defaultPolicy: 'propose',
		parameters: [{ name: 'placeId', type: 'string', description: 'ID des Ortes', required: true }],
	},
	{
		name: 'get_places',
		module: 'places',
		description: 'Gibt alle gespeicherten Orte zurueck',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'location_log',
		module: 'places',
		description: 'Gibt die aktuelle GPS-Position zurueck (erfordert Standort-Berechtigung)',
		defaultPolicy: 'auto',
		parameters: [],
	},

	// ── Drink ─────────────────────────────────────────────────
	{
		name: 'undo_drink',
		module: 'drink',
		description: 'Macht den letzten Drink-Eintrag rückgängig',
		defaultPolicy: 'propose',
		parameters: [],
	},
	{
		name: 'get_drink_progress',
		module: 'drink',
		description: 'Gibt den heutigen Trink-Fortschritt zurueck (Wasser, Kaffee, gesamt)',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'log_drink',
		module: 'drink',
		description: 'Loggt ein Getraenk (Wasser, Kaffee, Tee, etc.)',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'drinkType',
				type: 'string',
				description: 'Art des Getraenks',
				required: true,
				enum: ['water', 'coffee', 'tea', 'juice', 'alcohol', 'smoothie', 'soda', 'other'],
			},
			{
				name: 'quantityMl',
				type: 'number',
				description: 'Menge in Milliliter',
				required: true,
			},
			{
				name: 'name',
				type: 'string',
				description: 'Name (z.B. "Latte Macchiato")',
				required: false,
			},
		],
	},

	// ── Food ──────────────────────────────────────────────────
	{
		name: 'nutrition_summary',
		module: 'food',
		description:
			'Gibt die heutige Ernaehrungs-Zusammenfassung zurueck (Mahlzeiten, Kalorien, Protein)',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'log_meal',
		module: 'food',
		description: 'Loggt eine Mahlzeit mit optionalen Naehrwerten',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'mealType',
				type: 'string',
				description: 'Art der Mahlzeit',
				required: true,
				enum: ['breakfast', 'lunch', 'dinner', 'snack'],
			},
			{
				name: 'description',
				type: 'string',
				description: 'Beschreibung der Mahlzeit',
				required: true,
			},
			{ name: 'calories', type: 'number', description: 'Kalorien (kcal)', required: false },
			{ name: 'protein', type: 'number', description: 'Protein (g)', required: false },
		],
	},

	// ── News ──────────────────────────────────────────────────
	{
		name: 'save_news_article',
		module: 'news',
		description:
			'Speichert einen Artikel von einer URL in die Leseliste. URL wird serverseitig per Readability extrahiert.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'url', type: 'string', description: 'Die Artikel-URL', required: true },
			{
				name: 'title',
				type: 'string',
				description: 'Anzeigetitel für den Approval-Dialog (informativ)',
				required: false,
			},
			{
				name: 'summary',
				type: 'string',
				description: 'Kurze Begründung warum dieser Artikel relevant ist',
				required: false,
			},
		],
	},

	// ── News-Research ─────────────────────────────────────────
	{
		name: 'research_news',
		module: 'news-research',
		description:
			'Durchsucht RSS-Feeds und Web-Quellen nach relevanten Artikeln zu einem Thema. Gibt gefundene Artikel-URLs + Titel + Zusammenfassung zurueck. Nuetzlich als Vorstufe zu save_news_article.',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'query',
				type: 'string',
				description: 'Suchbegriff / Thema (z.B. "TypeScript 5.8 release")',
				required: true,
			},
			{
				name: 'language',
				type: 'string',
				description: 'Sprache (z.B. "de" oder "en")',
				required: false,
			},
			{
				name: 'limit',
				type: 'number',
				description: 'Max. Anzahl Ergebnisse (Standard: 10)',
				required: false,
			},
		],
	},

	// ── Journal ───────────────────────────────────────────────
	{
		name: 'create_journal_entry',
		module: 'journal',
		description:
			'Erstellt einen neuen Tagebuch-Eintrag fuer den heutigen Tag. Gibt die ID zurueck.',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'content',
				type: 'string',
				description: 'Inhalt des Eintrags (Markdown)',
				required: true,
			},
			{ name: 'title', type: 'string', description: 'Optionaler Titel', required: false },
			{
				name: 'mood',
				type: 'string',
				description: 'Stimmung',
				required: false,
				enum: ['great', 'good', 'neutral', 'bad', 'terrible'],
			},
		],
	},

	// ── Habits ────────────────────────────────────────────────
	{
		name: 'create_habit',
		module: 'habits',
		description: 'Erstellt einen neuen Habit-Tracker. Gibt die ID des neuen Habits zurueck.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Habits', required: true },
			{ name: 'icon', type: 'string', description: 'Emoji-Icon', required: true },
			{
				name: 'color',
				type: 'string',
				description: 'Hex-Farbe (z.B. #EF4444)',
				required: true,
			},
		],
	},
	{
		name: 'log_habit',
		module: 'habits',
		description:
			'Loggt eine Ausfuehrung eines existierenden Habits fuer heute. Optional mit Notiz.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'habitId', type: 'string', description: 'ID des Habits', required: true },
			{
				name: 'note',
				type: 'string',
				description: 'Optionale Notiz zum Log',
				required: false,
			},
		],
	},
	{
		name: 'get_habits',
		module: 'habits',
		description: 'Gibt alle aktiven Habits zurueck',
		defaultPolicy: 'auto',
		parameters: [],
	},

	// ── Contacts ──────────────────────────────────────────────
	{
		name: 'create_contact',
		module: 'contacts',
		description: 'Erstellt einen neuen Kontakt. Felder die nicht bekannt sind einfach weglassen.',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'firstName', type: 'string', description: 'Vorname', required: true },
			{ name: 'lastName', type: 'string', description: 'Nachname', required: false },
			{ name: 'email', type: 'string', description: 'E-Mail-Adresse', required: false },
			{ name: 'phone', type: 'string', description: 'Telefonnummer', required: false },
			{
				name: 'company',
				type: 'string',
				description: 'Firma / Organisation',
				required: false,
			},
			{
				name: 'notes',
				type: 'string',
				description: 'Freitext-Notizen zum Kontakt',
				required: false,
			},
		],
	},
	{
		name: 'get_contacts',
		module: 'contacts',
		description: 'Gibt alle Kontakte zurueck',
		defaultPolicy: 'auto',
		parameters: [],
	},
];

// ═══════════════════════════════════════════════════════════════
//  DERIVED LOOKUPS
// ═══════════════════════════════════════════════════════════════

/** O(1) lookup by tool name. */
export const AI_TOOL_CATALOG_BY_NAME: ReadonlyMap<string, ToolSchema> = new Map(
	AI_TOOL_CATALOG.map((t) => [t.name, t])
);
