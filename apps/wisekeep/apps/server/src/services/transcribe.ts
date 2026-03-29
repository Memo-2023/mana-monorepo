import OpenAI from 'openai';
import { $ } from 'bun';
import { unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import type { Config } from '../config';

export interface TranscriptionResult {
	title: string;
	channel: string;
	duration: number;
	transcript: string;
	language: string;
	model: string;
}

export class TranscribeService {
	private groq: OpenAI | null;

	constructor(private config: Config) {
		this.groq = config.groqApiKey
			? new OpenAI({ apiKey: config.groqApiKey, baseURL: 'https://api.groq.com/openai/v1' })
			: null;
	}

	async transcribe(url: string, language = 'de'): Promise<TranscriptionResult> {
		if (!this.groq) throw new Error('Groq API key not configured');

		// 1. Get video info
		const infoResult =
			await $`yt-dlp --print "%(title)s|||%(channel)s|||%(duration)s" --no-download ${url}`.text();
		const [title, channel, durationStr] = infoResult.trim().split('|||');
		const duration = parseInt(durationStr) || 0;

		// 2. Download audio to temp file
		const tempFile = `/tmp/wisekeep-${Date.now()}.mp3`;
		await $`yt-dlp -x --audio-format mp3 --audio-quality 5 -o ${tempFile} ${url}`;

		try {
			// 3. Transcribe with Groq (use ReadStream for OpenAI SDK compat)
			const transcription = await this.groq.audio.transcriptions.create({
				file: createReadStream(tempFile) as unknown as Parameters<
					typeof this.groq.audio.transcriptions.create
				>[0]['file'],
				model: this.config.whisperModel,
				language,
			});

			return {
				title: title || 'Unknown',
				channel: channel || 'Unknown',
				duration,
				transcript: transcription.text,
				language,
				model: this.config.whisperModel,
			};
		} finally {
			await unlink(tempFile).catch(() => {});
		}
	}
}
