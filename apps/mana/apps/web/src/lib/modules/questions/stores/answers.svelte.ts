/**
 * Answers store — write-side mutations for question answers.
 *
 * Per the apps/mana/CLAUDE.md module pattern, reads happen in queries.ts;
 * this file only mutates. Two flavours of answer creation:
 *
 *   createManual()  — user types an answer themselves. Plain Dexie write,
 *                     encrypted before persist.
 *
 *   startResearch() — kicks off the deep-research pipeline against
 *                     mana-api, creates an optimistic empty answer row,
 *                     and streams synthesis tokens into it as they arrive.
 *                     Marks the question as 'researching' for the duration.
 *
 * Encryption note: every write goes through encryptRecord('answers', …)
 * because the `answers` table is in the crypto registry. The token-stream
 * path decrypts → appends → re-encrypts on each tick. That's wasteful for
 * very chatty streams but keeps invariants simple, and synthesis output
 * runs at LLM speed, not keystroke speed.
 */

import { db } from '$lib/data/database';
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { researchApi, type ResearchEvent, type ResearchSource } from '$lib/api/research';
import type { LocalAnswer, LocalQuestion } from '../types';

// ─── Manual answer creation ─────────────────────────────────

export interface CreateManualAnswerInput {
	questionId: string;
	content: string;
}

async function createManual(input: CreateManualAnswerInput): Promise<string> {
	const now = new Date().toISOString();
	const id = crypto.randomUUID();
	const row: Record<string, unknown> = {
		id,
		questionId: input.questionId,
		researchResultId: null,
		content: input.content,
		citations: [],
		rating: null,
		isAccepted: false,
		createdAt: now,
		updatedAt: now,
	};
	await encryptRecord('answers', row);
	await db.table('answers').add(row);
	emitDomainEvent('QuestionAsked', 'questions', 'questions', id, {
		questionId: id,
		question: input.content ?? '',
	});
	return id;
}

// ─── Research-driven answer ─────────────────────────────────

export interface ResearchHandle {
	answerId: string;
	researchResultId: string;
	/** Cancel the SSE subscription. Does NOT cancel the server-side run. */
	cancel: () => void;
}

export interface StartResearchOptions {
	question: LocalQuestion;
	/** Optional progress callback for the UI (phase indicator etc.). */
	onEvent?: (event: ResearchEvent) => void;
}

/**
 * Start a research run for `question`. Creates an optimistic empty answer
 * locally, opens an SSE stream to mana-api, and appends each streamed
 * token into the answer row. When the run completes (`done`), the row is
 * finalised with citations and the question is flipped to 'answered'.
 *
 * Failures flip the question back to 'open' and surface the error message
 * via onEvent. The optimistic answer row is left in place so the user can
 * see what was produced before things went sideways.
 */
async function startResearch(opts: StartResearchOptions): Promise<ResearchHandle> {
	const { question, onEvent } = opts;

	// 1. Mark the question as researching so the UI flips immediately.
	await db.table('questions').update(question.id, {
		status: 'researching',
		updatedAt: new Date().toISOString(),
	});

	// 2. Kick off the server-side pipeline.
	const { researchResultId } = await researchApi.start({
		questionId: question.id,
		title: question.title,
		description: question.description ?? undefined,
		depth: question.researchDepth,
	});

	// 3. Create the optimistic, empty answer row that the stream will fill in.
	const answerId = crypto.randomUUID();
	const now = new Date().toISOString();
	const draft: Record<string, unknown> = {
		id: answerId,
		questionId: question.id,
		researchResultId,
		content: '',
		citations: [],
		rating: null,
		isAccepted: false,
		createdAt: now,
		updatedAt: now,
	};
	await encryptRecord('answers', draft);
	await db.table('answers').add(draft);

	// 4. Subscribe to SSE. Buffer streamed tokens locally and flush them
	//    in small batches to avoid encrypting on every single token.
	let pendingDelta = '';
	let flushScheduled = false;

	const flush = async () => {
		flushScheduled = false;
		if (!pendingDelta) return;
		const delta = pendingDelta;
		pendingDelta = '';

		const existing = (await db.table<LocalAnswer>('answers').get(answerId)) as
			| LocalAnswer
			| undefined;
		if (!existing) return;

		const decrypted = (await decryptRecord('answers', { ...existing })) as LocalAnswer;
		const updated: Record<string, unknown> = {
			content: (decrypted.content ?? '') + delta,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('answers', updated);
		await db.table('answers').update(answerId, updated);
	};

	const scheduleFlush = () => {
		if (flushScheduled) return;
		flushScheduled = true;
		// 100ms debounce — synthesis output is fast enough that batching
		// makes a real difference, slow enough that the UI still feels live.
		setTimeout(() => {
			void flush();
		}, 100);
	};

	const cancel = researchApi.streamProgress(researchResultId, async (event) => {
		onEvent?.(event);

		switch (event.type) {
			case 'token': {
				pendingDelta += event.delta;
				scheduleFlush();
				break;
			}
			case 'done': {
				await flush();
				await finaliseAnswer(answerId, researchResultId, question.id);
				cancel();
				break;
			}
			case 'error': {
				await flush();
				await db.table('questions').update(question.id, {
					status: 'open',
					updatedAt: new Date().toISOString(),
				});
				cancel();
				break;
			}
		}
	});

	return { answerId, researchResultId, cancel };
}

/**
 * Replace the streamed-in raw text with the structured server-side
 * payload (parsed summary) and attach citations resolved from the
 * server-side sources table. Flips the parent question to 'answered'.
 */
async function finaliseAnswer(
	answerId: string,
	researchResultId: string,
	questionId: string
): Promise<void> {
	let result;
	let sources: ResearchSource[];
	try {
		[result, sources] = await Promise.all([
			researchApi.get(researchResultId),
			researchApi.listSources(researchResultId),
		]);
	} catch (err) {
		console.error('[answers] failed to finalise research answer:', err);
		return;
	}

	// Build the final content from the structured payload. We prefer the
	// server-side parsed summary over the raw streamed tokens because the
	// stream may contain JSON scaffolding (`{ "summary": "...`) that
	// shouldn't be shown to the user.
	const parts: string[] = [];
	if (result.summary) parts.push(result.summary);
	if (result.keyPoints && result.keyPoints.length > 0) {
		parts.push('', '**Kernpunkte:**', ...result.keyPoints.map((k) => `- ${k}`));
	}
	if (result.followUpQuestions && result.followUpQuestions.length > 0) {
		parts.push('', '**Weiterführende Fragen:**', ...result.followUpQuestions.map((q) => `- ${q}`));
	}
	const content = parts.join('\n');

	// Citations[n].sourceId points at the server-side source UUID with rank n.
	const citations = sources.map((s) => ({
		sourceId: s.id,
		text: s.title ?? s.url,
	}));

	const update: Record<string, unknown> = {
		content,
		citations,
		updatedAt: new Date().toISOString(),
	};
	await encryptRecord('answers', update);
	await db.table('answers').update(answerId, update);

	await db.table('questions').update(questionId, {
		status: 'answered',
		updatedAt: new Date().toISOString(),
	});
}

// ─── Other mutations (acceptance / deletion) ────────────────

async function accept(answerId: string, questionId: string): Promise<void> {
	const all = (await db.table<LocalAnswer>('answers').toArray()).filter(
		(a) => a.questionId === questionId && !a.deletedAt
	);
	for (const a of all) {
		if (a.isAccepted) {
			await db.table('answers').update(a.id, {
				isAccepted: false,
				updatedAt: new Date().toISOString(),
			});
		}
	}
	await db.table('answers').update(answerId, {
		isAccepted: true,
		updatedAt: new Date().toISOString(),
	});
}

async function softDelete(answerId: string): Promise<void> {
	await db.table('answers').update(answerId, {
		deletedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});
}

export const answersStore = {
	createManual,
	startResearch,
	accept,
	softDelete,
};
