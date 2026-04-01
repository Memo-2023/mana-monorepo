/**
 * Meeting bot webhook routes — no JWT auth, HMAC signature verification.
 */

import { Hono } from 'hono';
import { createHmac, timingSafeEqual } from 'crypto';
import { consumeCredits, COSTS } from '../lib/credits';
import { updateBotCredits, type WebhookEvent } from '../services/meetings';

export const meetingWebhookRoutes = new Hono();

const WEBHOOK_SECRET = process.env.MEETING_BOT_WEBHOOK_SECRET ?? '';

// In-memory idempotency store (last 1000 events)
const processedEvents = new Set<string>();

function verifySignature(payload: string, signature: string): boolean {
	if (!WEBHOOK_SECRET) return true; // Dev: no secret configured

	if (!signature) return false;

	const [algorithm, provided] = signature.split('=');
	if (algorithm !== 'sha256' || !provided) return false;

	try {
		const expected = createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
		const providedBuf = Buffer.from(provided, 'hex');
		const expectedBuf = Buffer.from(expected, 'hex');
		if (providedBuf.length !== expectedBuf.length) return false;
		return timingSafeEqual(providedBuf, expectedBuf);
	} catch {
		return false;
	}
}

function idempotencyKey(event: WebhookEvent): string {
	return `${event.bot.id}:${event.event}:${event.timestamp}`;
}

function calcCredits(durationSeconds: number): number {
	const minutes = durationSeconds / 60;
	return Math.max(Math.ceil(minutes * COSTS.MEETING_RECORDING_PER_MINUTE), 2);
}

// POST /bot-events
meetingWebhookRoutes.post('/bot-events', async (c) => {
	const rawBody = await c.req.text();
	const signature = c.req.header('x-webhook-signature') ?? '';

	if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
		return c.json({ error: 'Invalid webhook signature' }, 401);
	}

	let payload: WebhookEvent;
	try {
		payload = JSON.parse(rawBody) as WebhookEvent;
	} catch {
		return c.json({ error: 'Invalid JSON payload' }, 400);
	}

	const key = idempotencyKey(payload);
	if (processedEvents.has(key)) {
		return c.json({ success: true, message: 'Event already processed' });
	}

	processedEvents.add(key);
	// Trim old entries
	if (processedEvents.size > 1000) {
		const iter = processedEvents.values();
		for (let i = 0; i < 500; i++) processedEvents.delete(iter.next().value as string);
	}

	try {
		if (payload.event === 'recording.completed') {
			const { bot, recording } = payload;
			const durationSeconds = recording?.duration_seconds ?? 0;
			const credits = calcCredits(durationSeconds);

			try {
				await consumeCredits(
					bot.user_id,
					'meeting_recording',
					credits,
					`Meeting recording completed - ${Math.round(durationSeconds / 60)} minutes`,
					{ botId: bot.id, recordingId: payload.recording?.id, durationSeconds },
					bot.space_id ? { type: 'guild', guildId: bot.space_id } : undefined
				);
				await updateBotCredits(bot.id, credits, durationSeconds);
			} catch (err) {
				// Don't fail the webhook — recording is still valid, credits can be reconciled
				console.error('[meetings-webhook] Failed to consume credits:', err);
			}

			return c.json({
				success: true,
				message: 'Recording completed processed',
				botId: bot.id,
				recordingId: recording?.id,
				creditsConsumed: credits,
			});
		}

		if (payload.event === 'recording.failed') {
			const { bot, error } = payload;
			console.error(`[meetings-webhook] Bot ${bot.id} failed: ${error?.code} - ${error?.message}`);
			return c.json({
				success: true,
				message: 'Recording failure processed',
				botId: bot.id,
				error: error?.message,
			});
		}

		return c.json({ success: true, message: 'Unknown event type' });
	} catch (err) {
		// Remove from processed set so it can be retried
		processedEvents.delete(key);
		console.error('[meetings-webhook] Error processing event:', err);
		return c.json({ error: 'Failed to process webhook event' }, 500);
	}
});
