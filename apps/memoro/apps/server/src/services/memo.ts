/**
 * Core memo service for Memoro server.
 *
 * All Supabase queries use the service-role client with explicit user_id filters.
 */

import { v4 as uuidv4 } from 'uuid';
import { createServiceClient } from '../lib/supabase';
import { validateCredits, calcTranscriptionCost, consumeCredits } from '../lib/credits';
import { processHeadlineForMemo } from './headline';

const AUDIO_SERVER_URL = () => process.env.AUDIO_SERVER_URL ?? 'http://localhost:3016';
const SERVICE_KEY = () => process.env.SERVICE_KEY ?? '';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreateMemoParams {
	userId: string;
	filePath: string;
	duration: number;
	spaceId?: string;
	blueprintId?: string;
	memoId?: string;
	recordingStartedAt?: string;
	location?: unknown;
	mediaType?: string;
}

export interface TranscriptionResult {
	transcript?: string;
	utterances?: Array<{
		offset: number;
		duration: number;
		text: string;
		speaker?: string;
	}>;
	speakers?: Record<string, unknown>;
	speakerMap?: Record<string, unknown>;
	languages?: string[];
	primary_language?: string;
	duration?: number;
}

export interface HandleTranscriptionParams {
	memoId: string;
	userId: string;
	transcriptionResult?: TranscriptionResult;
	route?: string;
	success: boolean;
	error?: string;
	fallbackStage?: string;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Create a memo from an already-uploaded audio file.
 * Fires transcription asynchronously after returning.
 */
export async function createMemoFromUploadedFile(params: CreateMemoParams): Promise<{
	memoId: string;
	audioPath: string;
	memo: Record<string, unknown>;
}> {
	const supabase = createServiceClient();
	const {
		userId,
		filePath,
		duration,
		spaceId,
		blueprintId,
		memoId: providedMemoId,
		recordingStartedAt,
		location,
		mediaType,
	} = params;

	// Validate credits before processing
	const cost = calcTranscriptionCost(duration);
	const creditCheck = await validateCredits(userId, 'transcription', cost);
	if (!creditCheck.hasCredits) {
		throw new Error(
			`Insufficient credits: need ${cost}, have ${creditCheck.availableCredits}`
		);
	}

	const memoId = providedMemoId ?? uuidv4();

	const memoData = {
		id: memoId,
		user_id: userId,
		title: 'Neue Aufnahme',
		source: {
			audio_path: filePath,
			duration,
			media_type: mediaType ?? 'audio/m4a',
		},
		metadata: {
			processing: {
				transcription: { status: 'pending' },
				headline_and_intro: { status: 'pending' },
			},
			recordingStartedAt: recordingStartedAt ?? null,
			location: location ?? null,
			blueprint_id: blueprintId ?? null,
		},
		updated_at: new Date().toISOString(),
	};

	const { data: memo, error } = await supabase
		.from('memos')
		.upsert(memoData, { onConflict: 'id' })
		.select()
		.single();

	if (error || !memo) {
		throw new Error(`Failed to create memo: ${error?.message ?? 'no data returned'}`);
	}

	// Link to space if provided
	if (spaceId) {
		const { error: spaceError } = await supabase.from('memo_spaces').insert({
			memo_id: memoId,
			space_id: spaceId,
			created_at: new Date().toISOString(),
		});
		if (spaceError) {
			console.error(`[memo] Failed to link memo ${memoId} to space ${spaceId}:`, spaceError);
		}
	}

	// Fire transcription asynchronously
	queueMicrotask(() => {
		callAudioServer({
			memoId,
			userId,
			audioPath: filePath,
			duration,
			blueprintId,
		}).catch((err) => {
			console.error(`[memo] Audio server call failed for memo ${memoId}:`, err);
			updateMemoProcessingStatus(memoId, 'transcription', 'failed', {
				error: err instanceof Error ? err.message : String(err),
			}).catch(() => {});
		});
	});

	return { memoId, audioPath: filePath, memo: memo as Record<string, unknown> };
}

/**
 * Handle transcription completion callback from the audio server.
 */
export async function handleTranscriptionCompleted(
	params: HandleTranscriptionParams
): Promise<void> {
	const { memoId, userId, transcriptionResult, route, success, error } = params;
	const supabase = createServiceClient();

	if (!success || !transcriptionResult) {
		await updateMemoProcessingStatus(memoId, 'transcription', 'failed', {
			error: error ?? 'Transcription failed',
			route,
		});
		return;
	}

	const duration = transcriptionResult.duration ?? 0;
	const cost = calcTranscriptionCost(duration);

	// Fetch existing source to merge (preserve audio_path, duration, media_type etc.)
	const { data: existing } = await supabase
		.from('memos')
		.select('source')
		.eq('id', memoId)
		.single();

	const existingSource = (existing?.source as Record<string, unknown>) ?? {};

	// Update memo source — merge transcription data with existing source fields
	const { error: updateError } = await supabase
		.from('memos')
		.update({
			source: {
				...existingSource,
				transcript: transcriptionResult.transcript ?? '',
				utterances: transcriptionResult.utterances ?? [],
				speakers: transcriptionResult.speakers ?? {},
				speakerMap: transcriptionResult.speakerMap ?? {},
				languages: transcriptionResult.languages ?? [],
				primary_language: transcriptionResult.primary_language ?? 'de',
				transcription_route: route,
			},
			updated_at: new Date().toISOString(),
		})
		.eq('id', memoId)
		.eq('user_id', userId);

	if (updateError) {
		console.error(`[memo] Failed to update transcription for memo ${memoId}:`, updateError);
		return;
	}

	// Mark transcription completed
	await updateMemoProcessingStatus(memoId, 'transcription', 'completed', { route });

	// Consume credits
	consumeCredits(userId, 'transcription', cost, `Transcription for memo ${memoId}`, {
		memoId,
		durationSeconds: duration,
	}).catch((err) => console.error('[memo] Failed to consume credits:', err));

	// Fire headline generation asynchronously
	queueMicrotask(() => {
		processHeadlineForMemo(memoId).catch((err) => {
			console.error(`[memo] Headline generation failed for memo ${memoId}:`, err);
		});
	});
}

/**
 * POST to the audio server to start transcription.
 */
export async function callAudioServer(params: {
	memoId: string;
	userId: string;
	audioPath: string;
	duration: number;
	blueprintId?: string;
	recordingIndex?: number;
	recordingLanguages?: string[];
	enableDiarization?: boolean;
	isAppend?: boolean;
}): Promise<void> {
	const url = `${AUDIO_SERVER_URL()}/api/v1/transcribe${params.isAppend ? '/append' : ''}`;
	const serviceKey = SERVICE_KEY();

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Service-Key': serviceKey,
		},
		body: JSON.stringify({
			memoId: params.memoId,
			userId: params.userId,
			audioPath: params.audioPath,
			recordingIndex: params.recordingIndex,
			recordingLanguages: params.recordingLanguages,
			enableDiarization: params.enableDiarization,
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Audio server returned ${response.status}: ${text}`);
	}
}

/**
 * Update memo processing status in metadata.
 */
export async function updateMemoProcessingStatus(
	memoId: string,
	processName: string,
	status: 'pending' | 'processing' | 'completed' | 'failed',
	details?: Record<string, unknown>
): Promise<void> {
	const supabase = createServiceClient();

	// Fetch current metadata
	const { data: memo, error: fetchError } = await supabase
		.from('memos')
		.select('metadata')
		.eq('id', memoId)
		.single();

	if (fetchError || !memo) {
		console.error(`[memo] Cannot update processing status — memo ${memoId} not found`);
		return;
	}

	const metadata = (memo.metadata as Record<string, unknown>) ?? {};
	const processing = (metadata.processing as Record<string, unknown>) ?? {};

	const updatedMetadata = {
		...metadata,
		processing: {
			...processing,
			[processName]: {
				status,
				updated_at: new Date().toISOString(),
				...(details ?? {}),
			},
		},
	};

	const { error: updateError } = await supabase
		.from('memos')
		.update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
		.eq('id', memoId);

	if (updateError) {
		console.error(`[memo] Failed to update processing status for ${memoId}:`, updateError);
	}
}
