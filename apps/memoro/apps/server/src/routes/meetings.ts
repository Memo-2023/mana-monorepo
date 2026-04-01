/**
 * Meetings routes — authenticated.
 * Handles meeting bot management and recording → memo conversion.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { validateCredits, COSTS } from '../lib/credits';
import { validateBody, validateQuery } from '../lib/validate';
import { createBotBody, recordingToMemoBody, paginationQuery } from '../schemas';
import {
	createBot,
	stopBot,
	getBots,
	getBotById,
	getRecordings,
	getRecordingById,
} from '../services/meetings';

export const meetingRoutes = new Hono<{ Variables: AuthVariables }>();

// Minimum credits required to start a recording (5 minutes worth)
const MINIMUM_RECORDING_CREDITS = 10;

// POST /bots — create a meeting bot
meetingRoutes.post('/bots', async (c) => {
	const userId = c.get('userId') as string;
	const v = await validateBody(c, createBotBody);
	if (!v.success) return v.response;
	const { meeting_url, space_id } = v.data;

	// Validate minimum credits
	const creditCheck = await validateCredits(userId, 'meeting_recording', MINIMUM_RECORDING_CREDITS);
	if (!creditCheck.hasCredits) {
		return c.json(
			{
				success: false,
				error: `Insufficient credits: need at least ${MINIMUM_RECORDING_CREDITS}`,
				requiredCredits: MINIMUM_RECORDING_CREDITS,
				availableCredits: creditCheck.availableCredits,
			},
			402
		);
	}

	try {
		const webhookBaseUrl = (
			process.env.MEMORO_SERVER_URL ?? `http://localhost:${process.env.PORT ?? 3015}`
		).replace(/\/$/, '');
		const bot = await createBot(userId, meeting_url, webhookBaseUrl, space_id);
		return c.json({
			success: true,
			bot,
			message: 'Meeting bot created. It will join the meeting shortly.',
			creditInfo: {
				estimatedCostPerMinute: COSTS.MEETING_RECORDING_PER_MINUTE,
				minimumCredits: MINIMUM_RECORDING_CREDITS,
				availableCredits: creditCheck.availableCredits,
			},
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to create meeting bot';
		return c.json({ success: false, error: msg }, 400);
	}
});

// GET /bots — list bots (with pagination)
meetingRoutes.get('/bots', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.query('space_id');
	const q = validateQuery(c, paginationQuery);
	if (!q.success) return q.response;
	const { limit, offset } = q.data;

	try {
		const bots = await getBots(userId, spaceId, limit, offset);
		return c.json({ success: true, bots, total: bots.length, limit, offset });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to fetch bots';
		return c.json({ success: false, error: msg }, 500);
	}
});

// GET /bots/:id — get single bot
meetingRoutes.get('/bots/:id', async (c) => {
	const userId = c.get('userId') as string;
	const botId = c.req.param('id');

	const bot = await getBotById(botId, userId);
	if (!bot) return c.json({ success: false, error: 'Bot not found' }, 404);

	return c.json({ success: true, bot });
});

// POST /bots/:id/stop — stop a bot
meetingRoutes.post('/bots/:id/stop', async (c) => {
	const userId = c.get('userId') as string;
	const botId = c.req.param('id');

	try {
		await stopBot(botId, userId);
		return c.json({ success: true, message: 'Bot stop signal sent. Recording will end shortly.' });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to stop bot';
		const status = msg === 'Bot not found' ? 404 : 400;
		return c.json({ success: false, error: msg }, status);
	}
});

// GET /recordings — list recordings (with pagination)
meetingRoutes.get('/recordings', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.query('space_id');
	const q = validateQuery(c, paginationQuery);
	if (!q.success) return q.response;
	const { limit, offset } = q.data;

	try {
		const recordings = await getRecordings(userId, spaceId, limit, offset);
		return c.json({ success: true, recordings, total: recordings.length, limit, offset });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to fetch recordings';
		return c.json({ success: false, error: msg }, 500);
	}
});

// GET /recordings/:id — get single recording
meetingRoutes.get('/recordings/:id', async (c) => {
	const userId = c.get('userId') as string;
	const recordingId = c.req.param('id');

	const recording = await getRecordingById(recordingId, userId);
	if (!recording) return c.json({ success: false, error: 'Recording not found' }, 404);

	return c.json({ success: true, recording });
});

// POST /recordings/:id/to-memo — convert recording to memo
meetingRoutes.post('/recordings/:id/to-memo', async (c) => {
	const userId = c.get('userId') as string;
	const recordingId = c.req.param('id');
	const v = await validateBody(c, recordingToMemoBody).catch(() => ({
		success: true as const,
		data: { blueprintId: undefined },
	}));
	if (!v.success) return v.response;
	const authHeader = c.req.header('Authorization');

	const recording = await getRecordingById(recordingId, userId);
	if (!recording) return c.json({ success: false, error: 'Recording not found' }, 404);

	const filePath = recording.audio_url || recording.video_url;
	if (!filePath)
		return c.json({ success: false, error: 'Recording has no audio or video file' }, 400);

	const duration = recording.duration_seconds ?? 45;

	try {
		const port = process.env.PORT ?? 3015;
		const response = await fetch(`http://localhost:${port}/api/v1/memos`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader ?? '',
			},
			body: JSON.stringify({
				filePath,
				duration,
				spaceId: recording.space_id,
				blueprintId: v.data.blueprintId,
			}),
		});

		if (!response.ok) {
			const errData = (await response.json().catch(() => ({ message: 'Unknown error' }))) as Record<
				string,
				unknown
			>;
			return c.json(
				{ success: false, error: (errData.message as string) || 'Failed to process recording' },
				400
			);
		}

		const result = (await response.json()) as Record<string, unknown>;
		return c.json({
			success: true,
			memoId: result.memoId,
			memo: result.memo,
			audioPath: filePath,
			status: result.status,
			message: 'Recording converted to memo. Transcription in progress.',
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to convert recording to memo';
		return c.json({ success: false, error: msg }, 500);
	}
});
