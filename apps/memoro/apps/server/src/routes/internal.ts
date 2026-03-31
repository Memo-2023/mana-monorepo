/**
 * Internal service-to-service routes for Memoro server.
 *
 * Requires X-Service-Key header matching SERVICE_KEY env var.
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
	handleTranscriptionCompleted,
	updateMemoProcessingStatus,
} from '../services/memo';
import { createServiceClient } from '../lib/supabase';

export const internalRoutes = new Hono();

// Service key auth middleware
internalRoutes.use('*', async (c, next) => {
	const key = c.req.header('X-Service-Key');
	const expected = process.env.SERVICE_KEY;

	if (!key || !expected || key !== expected) {
		throw new HTTPException(401, { message: 'Invalid service key' });
	}

	return next();
});

// POST /transcription-completed — called by audio server on completion
internalRoutes.post('/transcription-completed', async (c) => {
	const body = await c.req.json<{
		memoId: string;
		userId: string;
		transcriptionResult?: {
			transcript?: string;
			utterances?: Array<{ offset: number; duration: number; text: string; speaker?: string }>;
			speakers?: Record<string, unknown>;
			speakerMap?: Record<string, unknown>;
			languages?: string[];
			primary_language?: string;
			duration?: number;
		};
		route?: string;
		success: boolean;
		error?: string;
		fallbackStage?: string;
	}>();

	if (!body.memoId || !body.userId) {
		return c.json({ error: 'memoId and userId are required' }, 400);
	}

	try {
		await handleTranscriptionCompleted({
			memoId: body.memoId,
			userId: body.userId,
			transcriptionResult: body.transcriptionResult,
			route: body.route,
			success: body.success,
			error: body.error,
			fallbackStage: body.fallbackStage,
		});
		return c.json({ success: true, memoId: body.memoId });
	} catch (err) {
		console.error('[internal] Transcription completed handler failed:', err);
		return c.json({ error: 'Failed to process transcription callback' }, 500);
	}
});

// POST /append-transcription-completed — called by audio server for append flow
internalRoutes.post('/append-transcription-completed', async (c) => {
	const body = await c.req.json<{
		memoId: string;
		userId: string;
		recordingIndex: number;
		transcriptionResult?: {
			transcript?: string;
			utterances?: Array<{ offset: number; duration: number; text: string; speaker?: string }>;
			speakers?: Record<string, unknown>;
			speakerMap?: Record<string, unknown>;
			languages?: string[];
			primary_language?: string;
			duration?: number;
		};
		success: boolean;
		error?: string;
		route?: string;
	}>();

	if (!body.memoId || !body.userId) {
		return c.json({ error: 'memoId and userId are required' }, 400);
	}

	const supabase = createServiceClient();
	const now = new Date().toISOString();

	// Fetch current memo source
	const { data: memo, error: fetchError } = await supabase
		.from('memos')
		.select('source')
		.eq('id', body.memoId)
		.eq('user_id', body.userId)
		.single();

	if (fetchError || !memo) {
		return c.json({ error: 'Memo not found' }, 404);
	}

	const source = (memo as { source: Record<string, unknown> }).source ?? {};
	const additionalRecordings = [...((source.additional_recordings as unknown[]) ?? [])];

	const recordingEntry = body.success && body.transcriptionResult
		? {
				path: (additionalRecordings[body.recordingIndex] as { path?: string } | undefined)?.path ?? '',
				transcript: body.transcriptionResult.transcript ?? '',
				utterances: body.transcriptionResult.utterances ?? [],
				speakers: body.transcriptionResult.speakers ?? {},
				speakerMap: body.transcriptionResult.speakerMap ?? {},
				languages: body.transcriptionResult.languages ?? [],
				primary_language: body.transcriptionResult.primary_language ?? 'de',
				status: 'completed',
				timestamp: now,
				updated_at: now,
				route: body.route,
			}
		: {
				...(additionalRecordings[body.recordingIndex] as Record<string, unknown> | undefined ?? {}),
				status: 'error',
				error: body.error ?? 'Transcription failed',
				updated_at: now,
			};

	additionalRecordings[body.recordingIndex] = recordingEntry;

	const { error: updateError } = await supabase
		.from('memos')
		.update({
			source: { ...source, additional_recordings: additionalRecordings },
			updated_at: now,
		})
		.eq('id', body.memoId);

	if (updateError) {
		console.error('[internal] Failed to update append transcription:', updateError);
		return c.json({ error: 'Failed to update memo' }, 500);
	}

	return c.json({ success: true, memoId: body.memoId, recordingIndex: body.recordingIndex });
});

// POST /batch-metadata — update memo with batch job metadata
internalRoutes.post('/batch-metadata', async (c) => {
	const body = await c.req.json<{
		memoId: string;
		jobId: string;
		batchTranscription?: boolean;
		userId?: string;
	}>();

	if (!body.memoId || !body.jobId) {
		return c.json({ error: 'memoId and jobId are required' }, 400);
	}

	const supabase = createServiceClient();

	const { data: memo, error: fetchError } = await supabase
		.from('memos')
		.select('metadata')
		.eq('id', body.memoId)
		.single();

	if (fetchError || !memo) {
		return c.json({ error: 'Memo not found' }, 404);
	}

	const metadata = (memo as { metadata: Record<string, unknown> }).metadata ?? {};
	const updatedMetadata = {
		...metadata,
		batchJobId: body.jobId,
		batchTranscription: body.batchTranscription ?? true,
		batchStartedAt: new Date().toISOString(),
	};

	const { error: updateError } = await supabase
		.from('memos')
		.update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
		.eq('id', body.memoId);

	if (updateError) {
		return c.json({ error: 'Failed to update batch metadata' }, 500);
	}

	return c.json({ success: true, memoId: body.memoId, jobId: body.jobId });
});
