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
		description:
			'Markiert alle offenen Tasks mit dem gegebenen Titel als erledigt (case-insensitive Substring-Match). Nutze diese, wenn der Nutzer eine Task per Name erledigen will und du nicht ihre ID kennst.',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'titleMatch',
				type: 'string',
				description: 'Titel oder Teil davon',
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
		description: 'Erstellt einen neuen Kalender-Termin',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Termins', required: true },
			{
				name: 'startTime',
				type: 'string',
				description: 'Startzeit (ISO 8601)',
				required: true,
			},
			{ name: 'endTime', type: 'string', description: 'Endzeit (ISO 8601)', required: true },
			{ name: 'isAllDay', type: 'boolean', description: 'Ganztaegig', required: false },
			{ name: 'location', type: 'string', description: 'Ort', required: false },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
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
			{ name: 'title', type: 'string', description: 'Titel der Notiz', required: false },
			{
				name: 'content',
				type: 'string',
				description: 'Inhalt der Notiz (Markdown)',
				required: true,
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
		description: 'Erstellt einen neuen Ort',
		defaultPolicy: 'propose',
		parameters: [
			{ name: 'name', type: 'string', description: 'Name des Ortes', required: true },
			{ name: 'latitude', type: 'number', description: 'Breitengrad', required: true },
			{ name: 'longitude', type: 'number', description: 'Laengengrad', required: true },
			{
				name: 'category',
				type: 'string',
				description: 'Kategorie',
				required: false,
				enum: [
					'home',
					'work',
					'food',
					'shopping',
					'sport',
					'culture',
					'nature',
					'transport',
					'health',
					'education',
					'nightlife',
					'other',
				],
			},
			{ name: 'address', type: 'string', description: 'Adresse', required: false },
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
		name: 'get_current_location',
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
			'Erstellt einen neuen Journal-Eintrag mit optionaler Stimmung (dankbar, glücklich, zufrieden, neutral, nachdenklich, traurig, gestresst, wütend)',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'content',
				type: 'string',
				description: 'Inhalt des Eintrags',
				required: true,
			},
			{ name: 'title', type: 'string', description: 'Optionaler Titel', required: false },
			{
				name: 'mood',
				type: 'string',
				description: 'Stimmung',
				required: false,
				enum: [
					'dankbar',
					'glücklich',
					'zufrieden',
					'neutral',
					'nachdenklich',
					'traurig',
					'gestresst',
					'wütend',
				],
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

	// ── MyDay ─────────────────────────────────────────────────
	{
		name: 'get_myday_summary',
		module: 'myday',
		description:
			'Gibt eine komplette Tageszusammenfassung zurueck: Tasks, Termine, Trinken, Ernaehrung, Orte, Streaks und aktive Ziele. Nutze dieses Tool zuerst, um den vollen Tageskontext zu bekommen.',
		defaultPolicy: 'auto',
		parameters: [],
	},

	// ── Goals ─────────────────────────────────────────────────
	{
		name: 'list_goals',
		module: 'goals',
		description:
			'Listet alle Ziele mit aktuellem Fortschritt auf. Zeigt Titel, Fortschritt, Zielwert, Zeitraum und Status.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'filter',
				type: 'string',
				description: 'Welche Ziele zeigen',
				required: false,
				enum: ['active', 'paused', 'completed', 'all'],
			},
		],
	},
	{
		name: 'get_goal_progress',
		module: 'goals',
		description:
			'Gibt den detaillierten Fortschritt eines einzelnen Ziels zurueck, inklusive Metrik-Details und Periodeninfo.',
		defaultPolicy: 'auto',
		parameters: [{ name: 'goalId', type: 'string', description: 'ID des Ziels', required: true }],
	},
	{
		name: 'create_goal',
		module: 'goals',
		description:
			'Erstellt ein neues Ziel. Kann entweder ein Template verwenden (templateId) oder ein benutzerdefiniertes Ziel erstellen. Verfuegbare Templates: tpl-water-daily, tpl-tasks-daily, tpl-meals-daily, tpl-calories-daily, tpl-places-weekly, tpl-coffee-limit.',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'templateId',
				type: 'string',
				description:
					'ID eines Templates (z.B. "tpl-water-daily"). Wenn gesetzt, werden andere Felder ignoriert.',
				required: false,
			},
			{
				name: 'title',
				type: 'string',
				description: 'Titel des Ziels (nur fuer benutzerdefinierte Ziele)',
				required: false,
			},
			{
				name: 'description',
				type: 'string',
				description: 'Beschreibung',
				required: false,
			},
			{
				name: 'targetValue',
				type: 'number',
				description: 'Zielwert (z.B. 8 fuer "8 Glaeser Wasser")',
				required: false,
			},
			{
				name: 'period',
				type: 'string',
				description: 'Zeitraum',
				required: false,
				enum: ['day', 'week', 'month'],
			},
			{
				name: 'comparison',
				type: 'string',
				description: 'Vergleich: gte = mindestens, lte = hoechstens',
				required: false,
				enum: ['gte', 'lte'],
			},
			{
				name: 'eventType',
				type: 'string',
				description:
					'Domain-Event zum Zaehlen (z.B. "DrinkLogged", "TaskCompleted", "MealLogged", "WorkoutFinished")',
				required: false,
			},
			{
				name: 'moduleId',
				type: 'string',
				description: 'Zugehoeriges Modul (z.B. "drink", "todo", "food", "body")',
				required: false,
			},
		],
	},
	{
		name: 'pause_goal',
		module: 'goals',
		description: 'Pausiert ein aktives Ziel. Kann spaeter wieder fortgesetzt werden.',
		defaultPolicy: 'propose',
		parameters: [{ name: 'goalId', type: 'string', description: 'ID des Ziels', required: true }],
	},
	{
		name: 'resume_goal',
		module: 'goals',
		description: 'Setzt ein pausiertes Ziel fort.',
		defaultPolicy: 'propose',
		parameters: [{ name: 'goalId', type: 'string', description: 'ID des Ziels', required: true }],
	},
	{
		name: 'complete_goal',
		module: 'goals',
		description: 'Markiert ein Ziel als abgeschlossen.',
		defaultPolicy: 'propose',
		parameters: [{ name: 'goalId', type: 'string', description: 'ID des Ziels', required: true }],
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

	// ── Mood ──────────────────────────────────────────────────
	{
		name: 'log_mood',
		module: 'mood',
		description:
			'Erfasst einen Mood-Check-in mit Level (1-10), primaerer Emotion und optionalem Kontext.',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'level',
				type: 'number',
				description: 'Stimmungs-Level von 1 (schlecht) bis 10 (super)',
				required: true,
			},
			{
				name: 'emotion',
				type: 'string',
				description: 'Primaere Emotion',
				required: true,
				enum: [
					'happy',
					'calm',
					'energized',
					'grateful',
					'excited',
					'loved',
					'hopeful',
					'neutral',
					'bored',
					'tired',
					'sad',
					'anxious',
					'angry',
					'stressed',
					'frustrated',
					'overwhelmed',
				],
			},
			{
				name: 'activity',
				type: 'string',
				description: 'Was machst du gerade?',
				required: false,
				enum: [
					'work',
					'exercise',
					'social',
					'alone',
					'commute',
					'eating',
					'resting',
					'creative',
					'outdoors',
					'screen',
					'chores',
					'other',
				],
			},
			{
				name: 'notes',
				type: 'string',
				description: 'Optionale Notiz zum Check-in',
				required: false,
			},
		],
	},
	{
		name: 'get_mood_today',
		module: 'mood',
		description: 'Gibt alle heutigen Mood-Eintraege zurueck mit Durchschnitts-Level und Emotionen.',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'get_mood_insights',
		module: 'mood',
		description:
			'Gibt Mood-Trends und Muster zurueck: Durchschnitt der letzten 7/30 Tage, haeufigste Emotion, Positiv/Negativ-Verhaeltnis, und welche Aktivitaeten mit guter/schlechter Stimmung korrelieren.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'days',
				type: 'number',
				description: 'Analyse-Zeitraum in Tagen (Standard: 7)',
				required: false,
			},
		],
	},

	// ── Finance ───────────────────────────────────────────────
	{
		name: 'add_transaction',
		module: 'finance',
		description: 'Erfasst eine Einnahme oder Ausgabe',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'type',
				type: 'string',
				description: 'Art',
				required: true,
				enum: ['income', 'expense'],
			},
			{ name: 'amount', type: 'number', description: 'Betrag in Euro', required: true },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: true },
			{
				name: 'date',
				type: 'string',
				description: 'Datum (YYYY-MM-DD, Standard: heute)',
				required: false,
			},
		],
	},
	{
		name: 'get_month_summary',
		module: 'finance',
		description:
			'Gibt die Finanz-Zusammenfassung fuer einen Monat zurueck: Einnahmen, Ausgaben, Bilanz, Ausgaben pro Kategorie.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'month',
				type: 'string',
				description: 'Monat im Format YYYY-MM (Standard: aktueller Monat)',
				required: false,
			},
		],
	},
	{
		name: 'list_transactions',
		module: 'finance',
		description:
			'Listet die letzten Transaktionen auf. Optional nach Typ (income/expense) und Monat filterbar.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'type',
				type: 'string',
				description: 'Nur income oder expense zeigen',
				required: false,
				enum: ['income', 'expense'],
			},
			{
				name: 'month',
				type: 'string',
				description: 'Monat im Format YYYY-MM',
				required: false,
			},
			{
				name: 'limit',
				type: 'number',
				description: 'Maximale Anzahl (Standard: 20)',
				required: false,
			},
		],
	},

	// ── Times ─────────────────────────────────────────────────
	{
		name: 'start_timer',
		module: 'times',
		description: 'Startet einen Zeitmess-Timer mit optionaler Beschreibung und Projekt.',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'description',
				type: 'string',
				description: 'Beschreibung der Taetigkeit',
				required: false,
			},
			{
				name: 'projectId',
				type: 'string',
				description: 'ID eines Projekts (aus list_projects)',
				required: false,
			},
		],
	},
	{
		name: 'stop_timer',
		module: 'times',
		description: 'Stoppt den laufenden Timer und speichert den Zeiteintrag.',
		defaultPolicy: 'propose',
		parameters: [],
	},
	{
		name: 'get_timer_status',
		module: 'times',
		description: 'Gibt den Status des laufenden Timers zurueck (ob aktiv, Dauer, Beschreibung).',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'get_time_stats',
		module: 'times',
		description:
			'Gibt Zeiterfassungs-Statistiken zurueck: Stunden heute, diese Woche, und Aufschluesselung nach Projekt.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'period',
				type: 'string',
				description: 'Zeitraum (Standard: week)',
				required: false,
				enum: ['today', 'week', 'month'],
			},
		],
	},
	{
		name: 'list_projects',
		module: 'times',
		description: 'Listet alle aktiven Zeiterfassungs-Projekte mit Kunden-Info auf.',
		defaultPolicy: 'auto',
		parameters: [],
	},

	// ── Wetter ───────────────────────────────────────────────────
	{
		name: 'get_weather',
		module: 'wetter',
		description:
			'Gibt aktuelle Wetterbedingungen und 7-Tage-Vorhersage fuer einen Ort zurueck. Akzeptiert Ortsname oder Koordinaten.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'location',
				type: 'string',
				description: 'Ortsname (z.B. "Berlin") oder "lat,lon" Koordinaten',
				required: true,
			},
		],
	},
	{
		name: 'get_rain_forecast',
		module: 'wetter',
		description:
			'Gibt eine Minuten-Regenprognose (Nowcast) und aktive Wetterwarnungen fuer einen Ort zurueck.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'location',
				type: 'string',
				description: 'Ortsname oder "lat,lon" Koordinaten',
				required: true,
			},
		],
	},

	// ── Event Discovery ─────────────────────────────────────────
	{
		name: 'discover_events',
		module: 'events',
		description:
			'Sucht oeffentliche Veranstaltungen in den konfigurierten Regionen des Nutzers. Gibt Events mit Titel, Datum, Ort, Kategorie und Quelle zurueck.',
		defaultPolicy: 'auto',
		parameters: [
			{
				name: 'query',
				type: 'string',
				description: 'Optionaler Suchtext (z.B. "Jazz Konzerte")',
				required: false,
			},
			{
				name: 'category',
				type: 'string',
				description: 'Kategorie-Filter',
				required: false,
				enum: [
					'music',
					'theater',
					'art',
					'tech',
					'sport',
					'food',
					'family',
					'nature',
					'education',
					'community',
					'nightlife',
					'market',
					'other',
				],
			},
			{
				name: 'days_ahead',
				type: 'number',
				description: 'Wie viele Tage voraus suchen (Standard: 14)',
				required: false,
			},
		],
	},
	{
		name: 'suggest_event',
		module: 'events',
		description:
			'Schlaegt dem Nutzer ein entdecktes Event vor. Erstellt ein Proposal das der Nutzer bestaetigen muss, um das Event in seinen Kalender zu uebernehmen.',
		defaultPolicy: 'propose',
		parameters: [
			{
				name: 'discovered_event_id',
				type: 'string',
				description: 'ID des entdeckten Events',
				required: true,
			},
			{
				name: 'reason',
				type: 'string',
				description: 'Begruendung warum dieses Event relevant ist',
				required: false,
			},
		],
	},
];

// ═══════════════════════════════════════════════════════════════
//  DERIVED LOOKUPS
// ═══════════════════════════════════════════════════════════════

/** O(1) lookup by tool name. */
export const AI_TOOL_CATALOG_BY_NAME: ReadonlyMap<string, ToolSchema> = new Map(
	AI_TOOL_CATALOG.map((t) => [t.name, t])
);
