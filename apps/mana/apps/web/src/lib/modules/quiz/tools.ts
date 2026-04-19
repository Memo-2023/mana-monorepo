/**
 * Quiz tools — AI-accessible read + write over the encrypted quiz tables.
 *
 * - `create_quiz`       (propose) — mints an empty quiz shell.
 * - `add_quiz_question` (propose) — appends a question; options payload is
 *   shape-dependent on the question type (see description in the catalog).
 * - `list_quizzes`      (auto)    — returns decrypted metadata so the planner
 *   can reference an existing quiz when extending it.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { quizzesStore } from './stores/quizzes.svelte';
import { toQuiz, toQuestion } from './queries';
import { db } from '$lib/data/database';
import { decryptRecords, VaultLockedError } from '$lib/data/crypto';
import type {
	LocalQuiz,
	LocalQuizQuestion,
	LocalQuizAttempt,
	QuestionOption,
	QuestionType,
} from './types';

const MAX_LIST_LIMIT = 100;
const DEFAULT_LIST_LIMIT = 30;

function parseQuestionOptions(
	type: QuestionType,
	raw: string
): { options: QuestionOption[] } | { error: string } {
	const trimmed = raw.trim();
	if (!trimmed) return { error: 'optionsJson darf nicht leer sein' };

	if (type === 'truefalse') {
		const lower = trimmed.toLowerCase();
		if (lower !== 'true' && lower !== 'false') {
			return { error: 'optionsJson muss "true" oder "false" sein' };
		}
		return {
			options: [
				{ id: crypto.randomUUID(), text: 'Wahr', isCorrect: lower === 'true' },
				{ id: crypto.randomUUID(), text: 'Falsch', isCorrect: lower === 'false' },
			],
		};
	}

	if (type === 'text') {
		return { options: [{ id: crypto.randomUUID(), text: trimmed, isCorrect: true }] };
	}

	// single / multi
	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		return { error: 'optionsJson ist kein gültiges JSON' };
	}
	if (!Array.isArray(parsed) || parsed.length < 2) {
		return { error: 'optionsJson muss ein Array mit mindestens 2 Einträgen sein' };
	}

	const options: QuestionOption[] = [];
	for (const entry of parsed) {
		if (typeof entry !== 'object' || entry === null) {
			return { error: 'Jeder Eintrag muss ein Objekt {text, correct} sein' };
		}
		const rec = entry as Record<string, unknown>;
		if (typeof rec.text !== 'string' || !rec.text.trim()) {
			return { error: 'Jeder Eintrag braucht einen nicht-leeren text' };
		}
		options.push({
			id: crypto.randomUUID(),
			text: rec.text,
			isCorrect: Boolean(rec.correct),
		});
	}
	if (!options.some((o) => o.isCorrect)) {
		return { error: 'Mindestens eine Option muss correct:true haben' };
	}
	if (type === 'single' && options.filter((o) => o.isCorrect).length > 1) {
		return { error: 'Single-Choice erlaubt nur genau eine correct:true Option' };
	}
	return { options };
}

async function readLocalQuiz(id: string): Promise<LocalQuiz | null> {
	const local = await db.table<LocalQuiz>('quizzes').get(id);
	if (!local || local.deletedAt) return null;
	try {
		const [decrypted] = await decryptRecords('quizzes', [local]);
		return decrypted ?? null;
	} catch (err) {
		if (err instanceof VaultLockedError) {
			throw new Error(
				`Vault ist gesperrt — Quiz ${id} kann nicht entschlüsselt werden. Bitte Vault entsperren.`
			);
		}
		throw err;
	}
}

async function readLocalQuestion(id: string): Promise<LocalQuizQuestion | null> {
	const local = await db.table<LocalQuizQuestion>('quizQuestions').get(id);
	if (!local || local.deletedAt) return null;
	try {
		const [decrypted] = await decryptRecords('quizQuestions', [local]);
		return decrypted ?? null;
	} catch (err) {
		if (err instanceof VaultLockedError) {
			throw new Error(
				`Vault ist gesperrt — Frage ${id} kann nicht entschlüsselt werden. Bitte Vault entsperren.`
			);
		}
		throw err;
	}
}

export const quizTools: ModuleTool[] = [
	{
		name: 'create_quiz',
		module: 'quiz',
		description: 'Erstellt ein neues leeres Quiz mit Titel und optionaler Kategorie',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Quiz', required: true },
			{
				name: 'description',
				type: 'string',
				description: 'Optionale Beschreibung',
				required: false,
			},
			{
				name: 'category',
				type: 'string',
				description: 'Optionale Kategorie (z.B. "Geografie")',
				required: false,
			},
		],
		async execute(params) {
			const title = String(params.title ?? '').trim();
			if (!title) return { success: false, message: 'title darf nicht leer sein' };

			const quiz = await quizzesStore.createQuiz({
				title,
				description: (params.description as string) ?? null,
				category: (params.category as string) ?? null,
			});
			return {
				success: true,
				data: quiz,
				message: `Quiz "${quiz.title}" erstellt`,
			};
		},
	},
	{
		name: 'update_quiz',
		module: 'quiz',
		description:
			'Aktualisiert Metadaten eines bestehenden Quiz. Nur die mitgegebenen Felder werden geschrieben',
		parameters: [
			{ name: 'quizId', type: 'string', description: 'ID des Quiz', required: true },
			{ name: 'title', type: 'string', description: 'Neuer Titel', required: false },
			{ name: 'description', type: 'string', description: 'Neue Beschreibung', required: false },
			{ name: 'category', type: 'string', description: 'Neue Kategorie', required: false },
			{ name: 'isPinned', type: 'boolean', description: 'Quiz anpinnen', required: false },
			{ name: 'isArchived', type: 'boolean', description: 'Quiz archivieren', required: false },
		],
		async execute(params) {
			const quizId = String(params.quizId ?? '');
			const existing = await readLocalQuiz(quizId);
			if (!existing) return { success: false, message: `Quiz ${quizId} nicht gefunden` };

			const diff: Partial<
				Pick<LocalQuiz, 'title' | 'description' | 'category' | 'isPinned' | 'isArchived'>
			> = {};

			if (typeof params.title === 'string') {
				const t = params.title.trim();
				if (!t) return { success: false, message: 'title darf nicht leer sein' };
				diff.title = t;
			}
			if (typeof params.description === 'string') {
				diff.description = params.description === '' ? null : params.description;
			}
			if (typeof params.category === 'string') {
				diff.category = params.category === '' ? null : params.category;
			}
			if (typeof params.isPinned === 'boolean') diff.isPinned = params.isPinned;
			if (typeof params.isArchived === 'boolean') diff.isArchived = params.isArchived;

			if (Object.keys(diff).length === 0) {
				return { success: false, message: 'Kein Feld zum Aktualisieren angegeben' };
			}

			await quizzesStore.updateQuiz(quizId, diff);
			return {
				success: true,
				data: { quizId, fields: Object.keys(diff) },
				message: `Quiz "${diff.title ?? existing.title}" aktualisiert`,
			};
		},
	},
	{
		name: 'add_quiz_question',
		module: 'quiz',
		description:
			'Fügt einem bestehenden Quiz eine Frage hinzu. optionsJson-Format ist abhängig vom type: single/multi => JSON-Array [{"text":"...","correct":true|false}]; truefalse => "true" oder "false"; text => erwartete Antwort als Klartext',
		parameters: [
			{ name: 'quizId', type: 'string', description: 'ID des Quiz', required: true },
			{
				name: 'type',
				type: 'string',
				description: 'Fragetyp',
				required: true,
				enum: ['single', 'multi', 'truefalse', 'text'],
			},
			{ name: 'questionText', type: 'string', description: 'Die Fragestellung', required: true },
			{
				name: 'optionsJson',
				type: 'string',
				description: 'Antwortdaten — Format abhängig von type',
				required: true,
			},
			{
				name: 'explanation',
				type: 'string',
				description: 'Optionale Erklärung, die nach dem Beantworten angezeigt wird',
				required: false,
			},
		],
		async execute(params) {
			const quizId = String(params.quizId ?? '');
			const type = params.type as QuestionType;
			const questionText = String(params.questionText ?? '').trim();
			const optionsJsonRaw = String(params.optionsJson ?? '');
			const explanation = (params.explanation as string) ?? null;

			if (!['single', 'multi', 'truefalse', 'text'].includes(type)) {
				return { success: false, message: `Unbekannter Fragetyp: ${type}` };
			}
			if (!questionText) {
				return { success: false, message: 'questionText darf nicht leer sein' };
			}

			const existing = await readLocalQuiz(quizId);
			if (!existing) return { success: false, message: `Quiz ${quizId} nicht gefunden` };

			const parsed = parseQuestionOptions(type, optionsJsonRaw);
			if ('error' in parsed) {
				return { success: false, message: parsed.error };
			}

			await quizzesStore.addQuestion(quizId, {
				type,
				questionText,
				options: parsed.options,
				explanation,
			});

			const newCount = (existing.questionCount ?? 0) + 1;
			return {
				success: true,
				data: { quizId, questionCount: newCount },
				message: `Frage #${newCount} zu "${existing.title}" hinzugefügt`,
			};
		},
	},
	{
		name: 'update_quiz_question',
		module: 'quiz',
		description:
			'Aktualisiert eine vorhandene Frage. Beim Ändern der Antworten müssen type + optionsJson zusammen übergeben werden. Text und Erklärung können unabhängig geändert werden',
		parameters: [
			{ name: 'questionId', type: 'string', description: 'ID der Frage', required: true },
			{ name: 'questionText', type: 'string', description: 'Neue Fragestellung', required: false },
			{
				name: 'type',
				type: 'string',
				description: 'Neuer Fragetyp (wenn optionsJson mitgegeben wird)',
				required: false,
				enum: ['single', 'multi', 'truefalse', 'text'],
			},
			{
				name: 'optionsJson',
				type: 'string',
				description: 'Neue Antwortdaten — Format abhängig vom type',
				required: false,
			},
			{
				name: 'explanation',
				type: 'string',
				description: 'Neue Erklärung (Leerstring löscht)',
				required: false,
			},
		],
		async execute(params) {
			const questionId = String(params.questionId ?? '');
			const existing = await readLocalQuestion(questionId);
			if (!existing) return { success: false, message: `Frage ${questionId} nicht gefunden` };

			const diff: Partial<
				Pick<LocalQuizQuestion, 'type' | 'questionText' | 'options' | 'explanation'>
			> = {};

			if (typeof params.questionText === 'string') {
				const t = params.questionText.trim();
				if (!t) return { success: false, message: 'questionText darf nicht leer sein' };
				diff.questionText = t;
			}

			if (typeof params.explanation === 'string') {
				diff.explanation = params.explanation === '' ? null : params.explanation;
			}

			const hasOptions = typeof params.optionsJson === 'string';
			const hasType = typeof params.type === 'string';

			if (hasOptions) {
				const targetType = hasType ? (params.type as QuestionType) : existing.type;
				if (!['single', 'multi', 'truefalse', 'text'].includes(targetType)) {
					return { success: false, message: `Unbekannter Fragetyp: ${targetType}` };
				}
				const parsed = parseQuestionOptions(targetType, String(params.optionsJson));
				if ('error' in parsed) return { success: false, message: parsed.error };
				diff.options = parsed.options;
				if (hasType) diff.type = targetType;
			} else if (hasType) {
				return {
					success: false,
					message:
						'type ohne optionsJson zu ändern ist nicht erlaubt — die Antworten würden nicht mehr zum Typ passen',
				};
			}

			if (Object.keys(diff).length === 0) {
				return { success: false, message: 'Kein Feld zum Aktualisieren angegeben' };
			}

			await quizzesStore.updateQuestion(questionId, diff);
			return {
				success: true,
				data: { questionId, fields: Object.keys(diff) },
				message: 'Frage aktualisiert',
			};
		},
	},
	{
		name: 'delete_quiz_question',
		module: 'quiz',
		description: 'Löscht eine Frage aus einem Quiz',
		parameters: [
			{ name: 'questionId', type: 'string', description: 'ID der Frage', required: true },
		],
		async execute(params) {
			const questionId = String(params.questionId ?? '');
			const existing = await readLocalQuestion(questionId);
			if (!existing) return { success: false, message: `Frage ${questionId} nicht gefunden` };

			const parentQuiz = await readLocalQuiz(existing.quizId);
			await quizzesStore.deleteQuestion(questionId);

			return {
				success: true,
				data: { questionId, quizId: existing.quizId },
				message: parentQuiz ? `Frage aus "${parentQuiz.title}" entfernt` : 'Frage entfernt',
			};
		},
	},
	{
		name: 'list_quizzes',
		module: 'quiz',
		description:
			'Listet vorhandene Quizze (id, title, category, questionCount) damit du sie referenzieren kannst',
		parameters: [
			{
				name: 'limit',
				type: 'number',
				description: `Maximale Anzahl (Standard ${DEFAULT_LIST_LIMIT}, max ${MAX_LIST_LIMIT})`,
				required: false,
			},
			{
				name: 'query',
				type: 'string',
				description: 'Case-insensitive Substring-Filter auf Titel oder Kategorie',
				required: false,
			},
		],
		async execute(params) {
			const limit = Math.min(
				Math.max(Number(params.limit) || DEFAULT_LIST_LIMIT, 1),
				MAX_LIST_LIMIT
			);
			const query = typeof params.query === 'string' ? params.query.toLowerCase().trim() : '';

			try {
				const all = await db.table<LocalQuiz>('quizzes').toArray();
				const visible = all.filter((q) => !q.deletedAt && !q.isArchived);
				const decrypted = await decryptRecords('quizzes', visible);
				const rows = decrypted
					.map(toQuiz)
					.filter((q) => {
						if (!query) return true;
						return (
							q.title.toLowerCase().includes(query) ||
							(q.category ?? '').toLowerCase().includes(query)
						);
					})
					.sort((a, b) => {
						if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
						return b.updatedAt.localeCompare(a.updatedAt);
					})
					.slice(0, limit)
					.map((q) => ({
						id: q.id,
						title: q.title,
						category: q.category,
						questionCount: q.questionCount,
						isPinned: q.isPinned,
						updatedAt: q.updatedAt,
					}));

				return {
					success: true,
					data: { quizzes: rows, total: rows.length },
					message: `${rows.length} Quiz(ze) gelistet`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return {
						success: false,
						message: 'Vault ist gesperrt — Quizze können nicht entschlüsselt werden',
					};
				}
				throw err;
			}
		},
	},
	{
		name: 'get_quiz_questions',
		module: 'quiz',
		description:
			'Liest alle Fragen eines Quiz (id, order, type, questionText, options, explanation). Nutze dies bevor du weitere Fragen ergänzt, um Duplikate zu vermeiden',
		parameters: [{ name: 'quizId', type: 'string', description: 'ID des Quiz', required: true }],
		async execute(params) {
			const quizId = String(params.quizId ?? '');
			const existing = await readLocalQuiz(quizId);
			if (!existing) return { success: false, message: `Quiz ${quizId} nicht gefunden` };

			try {
				const visible = (
					await db
						.table<LocalQuizQuestion>('quizQuestions')
						.where('quizId')
						.equals(quizId)
						.toArray()
				).filter((q) => !q.deletedAt);
				const decrypted = await decryptRecords('quizQuestions', visible);
				const questions = decrypted.map(toQuestion).sort((a, b) => a.order - b.order);

				return {
					success: true,
					data: { quizId, quizTitle: existing.title, questions, total: questions.length },
					message: `${questions.length} Frage(n) aus "${existing.title}" gelistet`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return {
						success: false,
						message: 'Vault ist gesperrt — Fragen können nicht entschlüsselt werden',
					};
				}
				throw err;
			}
		},
	},
	{
		name: 'get_quiz_stats',
		module: 'quiz',
		description:
			'Gibt Statistiken zu einem Quiz zurück: Anzahl der Versuche, Durchschnitts-Score, bester Score, letzter Versuch',
		parameters: [{ name: 'quizId', type: 'string', description: 'ID des Quiz', required: true }],
		async execute(params) {
			const quizId = String(params.quizId ?? '');
			const existing = await readLocalQuiz(quizId);
			if (!existing) return { success: false, message: `Quiz ${quizId} nicht gefunden` };

			const all = await db
				.table<LocalQuizAttempt>('quizAttempts')
				.where('quizId')
				.equals(quizId)
				.toArray();
			const completed = all.filter((a) => !a.deletedAt && a.finishedAt !== null);

			const attemptCount = completed.length;
			const avgScore =
				attemptCount > 0 ? completed.reduce((sum, a) => sum + (a.score ?? 0), 0) / attemptCount : 0;
			const bestScore = attemptCount > 0 ? Math.max(...completed.map((a) => a.score ?? 0)) : 0;
			const lastAttemptAt =
				attemptCount > 0
					? completed
							.map((a) => a.finishedAt as string)
							.sort()
							.reverse()[0]
					: null;

			return {
				success: true,
				data: {
					quizId,
					quizTitle: existing.title,
					questionCount: existing.questionCount ?? 0,
					attemptCount,
					avgScore: Number(avgScore.toFixed(3)),
					bestScore: Number(bestScore.toFixed(3)),
					lastAttemptAt,
				},
				message:
					attemptCount === 0
						? `"${existing.title}" wurde noch nicht gespielt`
						: `"${existing.title}" — ${attemptCount} Versuch(e), ⌀ ${Math.round(avgScore * 100)} %, beste ${Math.round(bestScore * 100)} %`,
			};
		},
	},
];
