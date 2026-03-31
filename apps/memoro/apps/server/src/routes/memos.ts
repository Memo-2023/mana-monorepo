/**
 * Memo routes for Memoro server.
 */

import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import {
	createMemoFromUploadedFile,
	handleTranscriptionCompleted,
	callAudioServer,
	updateMemoProcessingStatus,
} from '../services/memo';
import { processHeadlineForMemo } from '../services/headline';
import { createServiceClient } from '../lib/supabase';
import { validateCredits, consumeCredits, COSTS } from '../lib/credits';
import { generateText } from '../lib/ai';

export const memoRoutes = new Hono();

// POST / — create memo from uploaded file
memoRoutes.post('/', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{
		filePath: string;
		duration: number;
		spaceId?: string;
		blueprintId?: string;
		memoId?: string;
		recordingStartedAt?: string;
		location?: unknown;
		mediaType?: string;
	}>();

	if (!body.filePath || body.duration == null) {
		return c.json({ error: 'filePath and duration are required' }, 400);
	}

	try {
		const result = await createMemoFromUploadedFile({
			userId,
			filePath: body.filePath,
			duration: body.duration,
			spaceId: body.spaceId,
			blueprintId: body.blueprintId,
			memoId: body.memoId,
			recordingStartedAt: body.recordingStartedAt,
			location: body.location,
			mediaType: body.mediaType,
		});
		return c.json(result, 201);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Insufficient credits')) return c.json({ error: msg }, 402);
		console.error('[memos] Create error:', err);
		return c.json({ error: 'Failed to create memo' }, 500);
	}
});

// POST /:id/append — append transcription to existing memo
memoRoutes.post('/:id/append', async (c) => {
	const userId = c.get('userId') as string;
	const memoId = c.req.param('id');
	const body = await c.req.json<{
		filePath: string;
		duration: number;
		recordingIndex?: number;
		recordingLanguages?: string[];
		enableDiarization?: boolean;
	}>();

	if (!body.filePath || body.duration == null) {
		return c.json({ error: 'filePath and duration are required' }, 400);
	}

	const supabase = createServiceClient();

	// Verify memo ownership
	const { data: memo, error: memoError } = await supabase
		.from('memos')
		.select('id, user_id, source')
		.eq('id', memoId)
		.eq('user_id', userId)
		.single();

	if (memoError || !memo) {
		return c.json({ error: 'Memo not found or access denied' }, 404);
	}

	// Validate credits
	const cost = Math.max(Math.ceil((body.duration / 60) * COSTS.TRANSCRIPTION_PER_MINUTE), 2);
	const creditCheck = await validateCredits(userId, 'transcription', cost);
	if (!creditCheck.hasCredits) {
		return c.json({ error: `Insufficient credits: need ${cost}` }, 402);
	}

	// Set processing status
	const source = (memo as { source: Record<string, unknown> }).source ?? {};
	const additionalRecordings = (source.additional_recordings as unknown[]) ?? [];
	const recordingIndex = body.recordingIndex ?? additionalRecordings.length;

	// Add pending entry
	const updatedRecordings = [...additionalRecordings];
	updatedRecordings[recordingIndex] = {
		path: body.filePath,
		status: 'processing',
		timestamp: new Date().toISOString(),
	};

	await supabase
		.from('memos')
		.update({
			source: { ...source, additional_recordings: updatedRecordings },
			updated_at: new Date().toISOString(),
		})
		.eq('id', memoId);

	// Fire transcription
	queueMicrotask(() => {
		callAudioServer({
			memoId,
			userId,
			filePath: body.filePath,
			duration: body.duration,
			recordingIndex,
			recordingLanguages: body.recordingLanguages,
			enableDiarization: body.enableDiarization,
			isAppend: true,
		}).catch((err) => console.error(`[memos] Append transcription call failed: ${err}`));
	});

	return c.json({ success: true, memoId, recordingIndex });
});

// POST /:id/retry-transcription
memoRoutes.post('/:id/retry-transcription', async (c) => {
	const userId = c.get('userId') as string;
	const memoId = c.req.param('id');
	const supabase = createServiceClient();

	const { data: memo, error } = await supabase
		.from('memos')
		.select('id, user_id, source, metadata')
		.eq('id', memoId)
		.eq('user_id', userId)
		.single();

	if (error || !memo) return c.json({ error: 'Memo not found or access denied' }, 404);

	const memoData = memo as {
		source: { audio_path?: string; duration?: number };
		metadata: Record<string, unknown>;
	};
	const filePath = memoData.source?.audio_path;
	const duration = memoData.source?.duration ?? 0;

	if (!filePath) return c.json({ error: 'No audio file associated with this memo' }, 400);

	await updateMemoProcessingStatus(memoId, 'transcription', 'pending');

	queueMicrotask(() => {
		callAudioServer({ memoId, userId, filePath, duration }).catch((err) =>
			console.error(`[memos] Retry transcription failed: ${err}`)
		);
	});

	return c.json({ success: true, memoId });
});

// POST /:id/retry-headline
memoRoutes.post('/:id/retry-headline', async (c) => {
	const userId = c.get('userId') as string;
	const memoId = c.req.param('id');
	const supabase = createServiceClient();

	// Verify ownership
	const { data: memo, error } = await supabase
		.from('memos')
		.select('id')
		.eq('id', memoId)
		.eq('user_id', userId)
		.single();

	if (error || !memo) return c.json({ error: 'Memo not found or access denied' }, 404);

	try {
		const result = await processHeadlineForMemo(memoId);
		return c.json(result);
	} catch (err) {
		console.error(`[memos] Retry headline failed for ${memoId}:`, err);
		return c.json({ error: 'Headline generation failed' }, 500);
	}
});

// POST /combine — combine multiple memos with AI
memoRoutes.post('/combine', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{ memoIds: string[] }>();

	if (!Array.isArray(body.memoIds) || body.memoIds.length < 2) {
		return c.json({ error: 'At least 2 memoIds are required' }, 400);
	}

	const creditCheck = await validateCredits(userId, 'memo_combine', COSTS.MEMO_COMBINE);
	if (!creditCheck.hasCredits) {
		return c.json({ error: `Insufficient credits: need ${COSTS.MEMO_COMBINE}` }, 402);
	}

	const supabase = createServiceClient();

	// Verify all memos belong to user
	const { data: memos, error: fetchError } = await supabase
		.from('memos')
		.select('id, title, source')
		.in('id', body.memoIds)
		.eq('user_id', userId);

	if (fetchError || !memos || memos.length !== body.memoIds.length) {
		return c.json({ error: 'One or more memos not found or access denied' }, 404);
	}

	// Extract transcripts
	const transcripts = memos.map((m: { title: string; source: Record<string, unknown> }) => {
		const source = m.source ?? {};
		const utterances = source.utterances as Array<{ offset?: number; text?: string }> | undefined;
		let text = '';
		if (utterances && utterances.length > 0) {
			text = [...utterances]
				.sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0))
				.map((u) => u.text)
				.filter(Boolean)
				.join(' ');
		} else {
			text = (source.transcript as string | undefined) ?? m.title;
		}
		return `### ${m.title}\n\n${text}`;
	});

	const prompt = `Du bist ein KI-Assistent. Kombiniere die folgenden Memos zu einem zusammenhängenden Text. Behalte alle wichtigen Informationen bei und verbinde sie flüssig.

${transcripts.join('\n\n---\n\n')}

Erstelle:
HEADLINE: <kombinierter Titel>
INTRO: <2-3 Satz Zusammenfassung>
CONTENT: <kombinierter Text>`;

	try {
		const response = await generateText(prompt, { temperature: 0.7, maxTokens: 2048 });

		await consumeCredits(userId, 'memo_combine', COSTS.MEMO_COMBINE, 'Combine memos', {
			memoIds: body.memoIds,
		});

		// Create combined memo
		const headlineMatch = response.match(/HEADLINE:\s*(.+?)(?=\n|$)/);
		const introMatch = response.match(/INTRO:\s*(.+?)(?=\nCONTENT:|$)/s);
		const contentMatch = response.match(/CONTENT:\s*(.+?)$/s);

		const headline = headlineMatch?.[1]?.trim() ?? 'Kombiniertes Memo';
		const intro = introMatch?.[1]?.trim() ?? '';
		const content = contentMatch?.[1]?.trim() ?? response;

		const { data: combinedMemo, error: createError } = await supabase
			.from('memos')
			.insert({
				id: uuidv4(),
				user_id: userId,
				title: headline,
				intro,
				source: {
					type: 'combined',
					transcript: content,
					source_memo_ids: body.memoIds,
				},
				metadata: {
					processing: {
						transcription: { status: 'completed' },
						headline_and_intro: { status: 'completed' },
					},
				},
				updated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (createError) throw createError;

		return c.json({ memo: combinedMemo, headline, intro });
	} catch (err) {
		console.error('[memos] Combine failed:', err);
		return c.json({ error: 'Failed to combine memos' }, 500);
	}
});

// POST /:id/question — Q&A on memo transcript
memoRoutes.post('/:id/question', async (c) => {
	const userId = c.get('userId') as string;
	const memoId = c.req.param('id');
	const body = await c.req.json<{ question: string }>();

	if (!body.question?.trim()) {
		return c.json({ error: 'question is required' }, 400);
	}

	const creditCheck = await validateCredits(userId, 'question_memo', COSTS.QUESTION_MEMO);
	if (!creditCheck.hasCredits) {
		return c.json({ error: `Insufficient credits: need ${COSTS.QUESTION_MEMO}` }, 402);
	}

	const supabase = createServiceClient();

	const { data: memo, error: memoError } = await supabase
		.from('memos')
		.select('id, title, source')
		.eq('id', memoId)
		.eq('user_id', userId)
		.single();

	if (memoError || !memo) return c.json({ error: 'Memo not found or access denied' }, 404);

	const memoData = memo as { title: string; source: Record<string, unknown> };
	const source = memoData.source ?? {};
	const utterances = source.utterances as Array<{ offset?: number; text?: string }> | undefined;
	let transcript = '';

	if (utterances && utterances.length > 0) {
		transcript = [...utterances]
			.sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0))
			.map((u) => u.text)
			.filter(Boolean)
			.join(' ');
	} else {
		transcript = (source.transcript as string | undefined) ?? memoData.title;
	}

	if (!transcript) return c.json({ error: 'No transcript available for this memo' }, 400);

	const prompt = `Du bist ein hilfreicher Assistent. Beantworte die folgende Frage basierend auf dem Transkript der Sprachaufnahme.

Transkript:
${transcript}

Frage: ${body.question}

Antworte präzise und klar. Falls die Frage nicht aus dem Transkript beantwortet werden kann, sage das explizit.`;

	try {
		const answer = await generateText(prompt, { temperature: 0.5, maxTokens: 1024 });

		await consumeCredits(userId, 'question_memo', COSTS.QUESTION_MEMO, 'Q&A on memo', {
			memoId,
		});

		return c.json({ answer, memoId, question: body.question });
	} catch (err) {
		console.error('[memos] Q&A failed:', err);
		return c.json({ error: 'Failed to answer question' }, 500);
	}
});
