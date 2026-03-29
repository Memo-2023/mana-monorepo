import { Hono } from 'hono';
import type { TranscribeService } from '../services/transcribe';
import type { AuthUser } from '../middleware/jwt-auth';

export function createTranscribeRoutes(transcribeService: TranscribeService) {
	return new Hono<{ Variables: { user: AuthUser } }>().post('/', async (c) => {
		const { url, language } = await c.req.json<{ url: string; language?: string }>();
		if (!url) return c.json({ error: 'URL is required' }, 400);

		const result = await transcribeService.transcribe(url, language || 'de');

		// Return result — client saves to local-first store
		return c.json({
			id: crypto.randomUUID(),
			url,
			title: result.title,
			channel: result.channel,
			duration: result.duration,
			transcript: result.transcript,
			language: result.language,
			model: result.model,
			status: 'completed',
		});
	});
}
