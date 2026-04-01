/**
 * Meetings routes — authenticated.
 * Handles meeting bot management and recording → memo conversion.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { validateCredits, COSTS } from '../lib/credits';
import {
	validateMeetingUrl,
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
	const body = await c.req.json<{ meeting_url?: string; space_id?: string }>();

	if (!body.meeting_url || !validateMeetingUrl(body.meeting_url)) {
		return c.json(
			{ error: 'Please provide a valid Teams, Google Meet, or Zoom meeting URL' },
			400
		);
	}

	// Validate minimum credits
	const creditCheck = await validateCredits(userId, 'meeting_recording', MINIMUM_RECORDING_CREDITS);
	if (!creditCheck.hasCredits) {
		return c.json(
			{
				error: 'InsufficientCredits',
				message: `Not enough credits to start recording. Need at least ${MINIMUM_RECORDING_CREDITS} credits.`,
				details: {
					requiredCredits: MINIMUM_RECORDING_CREDITS,
					availableCredits: creditCheck.availableCredits,
				},
			},
			402
		);
	}

	try {
		const webhookBaseUrl = (process.env.MEMORO_SERVER_URL ?? `http://localhost:${process.env.PORT ?? 3015}`).replace(/\/$/, '');
		const bot = await createBot(userId, body.meeting_url, webhookBaseUrl, body.space_id);
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
		return c.json({ error: msg }, 400);
	}
});

// GET /bots — list bots
meetingRoutes.get('/bots', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.query('space_id');
	const limit = Number(c.req.query('limit') ?? 50);
	const offset = Number(c.req.query('offset') ?? 0);

	try {
		const bots = await getBots(userId, spaceId, limit, offset);
		return c.json({ success: true, bots, total: bots.length });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to fetch bots';
		return c.json({ error: msg }, 500);
	}
});

// GET /bots/:id — get single bot
meetingRoutes.get('/bots/:id', async (c) => {
	const userId = c.get('userId') as string;
	const botId = c.req.param('id');

	const bot = await getBotById(botId, userId);
	if (!bot) return c.json({ error: 'Bot not found' }, 404);

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
		return c.json({ error: msg }, status);
	}
});

// GET /recordings — list recordings
meetingRoutes.get('/recordings', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.query('space_id');
	const limit = Number(c.req.query('limit') ?? 50);
	const offset = Number(c.req.query('offset') ?? 0);

	try {
		const recordings = await getRecordings(userId, spaceId, limit, offset);
		return c.json({ success: true, recordings, total: recordings.length });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to fetch recordings';
		return c.json({ error: msg }, 500);
	}
});

// GET /recordings/:id — get single recording
meetingRoutes.get('/recordings/:id', async (c) => {
	const userId = c.get('userId') as string;
	const recordingId = c.req.param('id');

	const recording = await getRecordingById(recordingId, userId);
	if (!recording) return c.json({ error: 'Recording not found' }, 404);

	return c.json({ success: true, recording });
});

// POST /recordings/:id/to-memo — convert recording to memo
meetingRoutes.post('/recordings/:id/to-memo', async (c) => {
	const userId = c.get('userId') as string;
	const recordingId = c.req.param('id');
	const body = await c.req.json<{ blueprintId?: string }>().catch(() => ({ blueprintId: undefined }));
	const authHeader = c.req.header('Authorization');

	const recording = await getRecordingById(recordingId, userId);
	if (!recording) return c.json({ error: 'Recording not found' }, 404);

	const filePath = recording.audio_url || recording.video_url;
	if (!filePath) return c.json({ error: 'Recording has no audio or video file' }, 400);

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
				blueprintId: body.blueprintId,
			}),
		});

		if (!response.ok) {
			const errData = await response.json().catch(() => ({ message: 'Unknown error' })) as Record<string, unknown>;
			return c.json({ error: (errData.message as string) || 'Failed to process recording' }, 400);
		}

		const result = await response.json() as Record<string, unknown>;
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
		return c.json({ error: msg }, 500);
	}
});
