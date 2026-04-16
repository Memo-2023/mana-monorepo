/**
 * Context Interview — Static question bank.
 *
 * ~30 questions across 7 categories. Each question maps to a field
 * path in LocalUserContext so answers write directly into the store.
 */

export type ContextCategory =
	| 'about'
	| 'routine'
	| 'nutrition'
	| 'work'
	| 'leisure'
	| 'goals'
	| 'social';

export type QuestionInputType = 'text' | 'textarea' | 'tags' | 'time' | 'choice' | 'weekdays';

export interface ContextQuestion {
	id: string;
	category: ContextCategory;
	question: string;
	hint?: string;
	inputType: QuestionInputType;
	choices?: string[];
	/** Dot-path into LocalUserContext, e.g. 'about.occupation' or 'interests'. */
	field: string;
	/** Sort priority within category (lower = asked first). */
	priority: number;
}

export interface CategoryMeta {
	key: ContextCategory;
	label: string;
	icon: string;
	description: string;
}

export const CATEGORIES: CategoryMeta[] = [
	{
		key: 'about',
		label: 'Über mich',
		icon: 'user',
		description: 'Wer du bist — Hintergrund, Herkunft, Sprachen',
	},
	{
		key: 'routine',
		label: 'Tagesablauf',
		icon: 'clock',
		description: 'Dein typischer Tag — Aufstehen, Arbeiten, Schlafen',
	},
	{
		key: 'nutrition',
		label: 'Ernährung',
		icon: 'bowl',
		description: 'Wie du dich ernährst — Diät, Allergien, Vorlieben',
	},
	{
		key: 'work',
		label: 'Arbeit',
		icon: 'briefcase',
		description: 'Was du machst — Beruf, Projekte, Arbeitsstil',
	},
	{
		key: 'leisure',
		label: 'Freizeit',
		icon: 'star',
		description: 'Was dich begeistert — Hobbys, Interessen, Medien',
	},
	{
		key: 'goals',
		label: 'Ziele',
		icon: 'target',
		description: 'Wohin du willst — Persönliche und berufliche Ziele',
	},
	{
		key: 'social',
		label: 'Soziales',
		icon: 'people',
		description: 'Wie du mit anderen umgehst — Kommunikation, Stil',
	},
];

export const QUESTIONS: ContextQuestion[] = [
	// ── About
	{
		id: 'about.occupation',
		category: 'about',
		question: 'Was machst du beruflich?',
		hint: 'z.B. Softwareentwicklerin, Student, Freelancerin',
		inputType: 'text',
		field: 'about.occupation',
		priority: 1,
	},
	{
		id: 'about.location',
		category: 'about',
		question: 'Wo lebst du?',
		hint: 'z.B. Berlin, München, Wien',
		inputType: 'text',
		field: 'about.location',
		priority: 2,
	},
	{
		id: 'about.languages',
		category: 'about',
		question: 'Welche Sprachen sprichst du?',
		hint: 'z.B. Deutsch, Englisch, Spanisch',
		inputType: 'tags',
		field: 'about.languages',
		priority: 3,
	},
	{
		id: 'about.birthday',
		category: 'about',
		question: 'Wann hast du Geburtstag?',
		hint: 'Damit Mana dich rechtzeitig erinnern kann',
		inputType: 'text',
		field: 'about.birthday',
		priority: 4,
	},
	{
		id: 'about.bio',
		category: 'about',
		question: 'Erzähl kurz von dir',
		hint: 'Ein paar Sätze — was macht dich aus?',
		inputType: 'textarea',
		field: 'about.bio',
		priority: 5,
	},

	// ── Routine
	{
		id: 'routine.wakeUp',
		category: 'routine',
		question: 'Wann stehst du normalerweise auf?',
		inputType: 'time',
		field: 'routine.wakeUp',
		priority: 1,
	},
	{
		id: 'routine.workStart',
		category: 'routine',
		question: 'Wann fängt dein Arbeitstag an?',
		inputType: 'time',
		field: 'routine.workStart',
		priority: 2,
	},
	{
		id: 'routine.workEnd',
		category: 'routine',
		question: 'Wann ist Feierabend?',
		inputType: 'time',
		field: 'routine.workEnd',
		priority: 3,
	},
	{
		id: 'routine.bedtime',
		category: 'routine',
		question: 'Wann gehst du normalerweise schlafen?',
		inputType: 'time',
		field: 'routine.bedtime',
		priority: 4,
	},
	{
		id: 'routine.workDays',
		category: 'routine',
		question: 'An welchen Tagen arbeitest du?',
		inputType: 'weekdays',
		field: 'routine.workDays',
		priority: 5,
	},

	// ── Nutrition
	{
		id: 'nutrition.diet',
		category: 'nutrition',
		question: 'Wie ernährst du dich?',
		inputType: 'choice',
		choices: ['Omnivor', 'Vegetarisch', 'Vegan', 'Pescetarisch', 'Flexitarisch', 'Anderes'],
		field: 'nutrition.diet',
		priority: 1,
	},
	{
		id: 'nutrition.allergies',
		category: 'nutrition',
		question: 'Hast du Allergien oder Unverträglichkeiten?',
		hint: 'z.B. Nüsse, Laktose, Gluten',
		inputType: 'tags',
		field: 'nutrition.allergies',
		priority: 2,
	},
	{
		id: 'nutrition.preferences',
		category: 'nutrition',
		question: 'Gibt es Ernährungs-Vorlieben oder -Ziele?',
		hint: 'z.B. weniger Zucker, mehr Protein, intermittierendes Fasten',
		inputType: 'textarea',
		field: 'nutrition.preferences',
		priority: 3,
	},

	// ── Work
	{
		id: 'social.workStyle',
		category: 'work',
		question: 'Wie arbeitest du am liebsten?',
		inputType: 'choice',
		choices: ['Solo / Deep Work', 'Im Team', 'Hybrid', 'Kommt drauf an'],
		field: 'social.workStyle',
		priority: 1,
	},
	{
		id: 'social.communication',
		category: 'work',
		question: 'Wie würdest du deinen Kommunikationsstil beschreiben?',
		inputType: 'choice',
		choices: ['Direkt & klar', 'Diplomatisch', 'Zurückhaltend', 'Ausführlich'],
		field: 'social.communication',
		priority: 2,
	},

	// ── Leisure
	{
		id: 'interests',
		category: 'leisure',
		question: 'Was sind deine Interessen und Hobbys?',
		hint: 'z.B. Kochen, Fotografie, Wandern, Gaming, Musik',
		inputType: 'tags',
		field: 'interests',
		priority: 1,
	},
	{
		id: 'leisure.favoriteMedia',
		category: 'leisure',
		question: 'Welche Medien konsumierst du gerne?',
		hint: 'z.B. Podcasts, Bücher, Serien, YouTube',
		inputType: 'tags',
		field: 'about.bio',
		priority: 2,
	},
	{
		id: 'leisure.sports',
		category: 'leisure',
		question: 'Treibst du Sport? Wenn ja, welchen?',
		hint: 'z.B. Laufen, Yoga, Krafttraining, Fußball',
		inputType: 'tags',
		field: 'interests',
		priority: 3,
	},

	// ── Goals
	{
		id: 'goals.current',
		category: 'goals',
		question: 'Was sind deine aktuellen Ziele?',
		hint: 'z.B. Mehr Sport, Buch schreiben, Neues lernen',
		inputType: 'tags',
		field: 'goals',
		priority: 1,
	},
	{
		id: 'goals.focus',
		category: 'goals',
		question: 'Worauf fokussierst du dich gerade am meisten?',
		hint: 'Was treibt dich aktuell an?',
		inputType: 'textarea',
		field: 'about.bio',
		priority: 2,
	},
	{
		id: 'goals.learn',
		category: 'goals',
		question: 'Gibt es etwas, das du gerade lernst oder lernen willst?',
		hint: 'z.B. eine Sprache, ein Instrument, Programmieren',
		inputType: 'tags',
		field: 'goals',
		priority: 3,
	},

	// ── Social
	{
		id: 'social.living',
		category: 'social',
		question: 'Wie lebst du?',
		inputType: 'choice',
		choices: ['Allein', 'Mit Partner/in', 'WG', 'Familie', 'Anderes'],
		field: 'about.bio',
		priority: 1,
	},
	{
		id: 'social.pets',
		category: 'social',
		question: 'Hast du Haustiere?',
		hint: 'z.B. Hund, Katze, Fische',
		inputType: 'text',
		field: 'about.bio',
		priority: 2,
	},
];

/** Get questions for a specific category, sorted by priority. */
export function getQuestionsByCategory(category: ContextCategory): ContextQuestion[] {
	return QUESTIONS.filter((q) => q.category === category).sort((a, b) => a.priority - b.priority);
}

/** Get the next unanswered question across all categories. */
export function getNextUnanswered(
	answeredIds: string[],
	skippedIds: string[]
): ContextQuestion | null {
	const done = new Set([...answeredIds, ...skippedIds]);
	return QUESTIONS.find((q) => !done.has(q.id)) ?? null;
}

/** Completion stats. */
export function getProgress(answeredIds: string[]): {
	answered: number;
	total: number;
	percent: number;
} {
	const total = QUESTIONS.length;
	const answered = answeredIds.length;
	return { answered, total, percent: total > 0 ? Math.round((answered / total) * 100) : 0 };
}
