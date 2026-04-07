/**
 * POST /api/v1/dreams/transcribe
 *
 * Server-side proxy to mana-stt for the Dreams module's voice capture.
 * The browser uploads an audio Blob; we forward it to mana-stt with the
 * server-held API key and return the transcript JSON.
 *
 * Request:  multipart/form-data with `file` (audio blob) and optional `language`
 * Response: { text: string, language?: string, duration_seconds?: number }
 */

import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const ALLOWED_MIME_PREFIXES = ['audio/'];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export const POST: RequestHandler = async ({ request }) => {
	const sttUrl = env.MANA_STT_URL;
	const apiKey = env.MANA_STT_API_KEY;

	if (!sttUrl) {
		throw error(503, 'mana-stt is not configured (MANA_STT_URL missing)');
	}

	const incoming = await request.formData();
	const file = incoming.get('file');
	const language = (incoming.get('language') as string | null) ?? null;

	if (!(file instanceof Blob)) {
		throw error(400, 'Missing file');
	}
	if (file.size === 0) {
		throw error(400, 'Empty audio');
	}
	if (file.size > MAX_BYTES) {
		throw error(413, `Audio too large (max ${MAX_BYTES / 1024 / 1024} MB)`);
	}
	if (file.type && !ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
		throw error(415, `Unsupported audio type: ${file.type}`);
	}

	// Pick a sensible filename + extension based on the blob mime type
	const ext = mimeToExtension(file.type);
	const filename = `dream${ext}`;

	const upstream = new FormData();
	upstream.append('file', file, filename);
	if (language) upstream.append('language', language);

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (apiKey) headers['X-API-Key'] = apiKey;

	let response: Response;
	try {
		response = await fetch(`${sttUrl.replace(/\/$/, '')}/transcribe`, {
			method: 'POST',
			headers,
			body: upstream,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw error(502, `Could not reach mana-stt: ${msg}`);
	}

	if (!response.ok) {
		const text = await response.text();
		throw error(response.status, `mana-stt error: ${text || response.statusText}`);
	}

	const result = (await response.json()) as {
		text: string;
		language?: string;
		duration_seconds?: number;
	};

	return json({
		text: result.text ?? '',
		language: result.language ?? null,
		durationSeconds: result.duration_seconds ?? null,
	});
};

function mimeToExtension(mime: string): string {
	if (mime.includes('webm')) return '.webm';
	if (mime.includes('ogg')) return '.ogg';
	if (mime.includes('mp4') || mime.includes('m4a')) return '.m4a';
	if (mime.includes('mpeg')) return '.mp3';
	if (mime.includes('wav')) return '.wav';
	if (mime.includes('flac')) return '.flac';
	return '.webm';
}
