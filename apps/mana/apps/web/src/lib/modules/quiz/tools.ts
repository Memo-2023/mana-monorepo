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
import { toQuiz } from './queries';
import { db } from '$lib/data/database';
import { decryptRecords, VaultLockedError } from '$lib/data/crypto';
import type { LocalQuiz, QuestionOption, QuestionType } from './types';

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
];
