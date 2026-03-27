import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Voice service for speech-to-text and text-to-speech
 * using the GPU server's mana-stt and mana-tts services.
 */
@Injectable()
export class VoiceService {
	private readonly logger = new Logger(VoiceService.name);
	private readonly sttUrl: string;
	private readonly ttsUrl: string;
	private readonly apiKey: string;
	private readonly timeout: number;

	constructor(private configService: ConfigService) {
		this.sttUrl = this.configService.get<string>('GPU_STT_URL') || 'https://gpu-stt.mana.how';
		this.ttsUrl = this.configService.get<string>('GPU_TTS_URL') || 'https://gpu-tts.mana.how';
		this.apiKey = this.configService.get<string>('GPU_API_KEY') || '';
		this.timeout = 60_000;
	}

	private authHeaders(): Record<string, string> {
		const headers: Record<string, string> = {};
		if (this.apiKey) headers['X-API-Key'] = this.apiKey;
		return headers;
	}

	/**
	 * Transcribe audio to text using WhisperX on the GPU server.
	 * Supports word-level timestamps and speaker diarization.
	 */
	async transcribe(
		audioBuffer: Buffer,
		filename: string,
		options: {
			language?: string;
			diarize?: boolean;
		} = {}
	): Promise<{
		text: string;
		language?: string;
		words?: Array<{ word: string; start: number; end: number; speaker?: string }>;
		speakers?: string[];
		latencyMs?: number;
	}> {
		const formData = new FormData();
		formData.append('file', new Blob([audioBuffer]), filename);
		if (options.language) formData.append('language', options.language);
		formData.append('align', 'true');
		formData.append('diarize', String(options.diarize ?? false));

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(`${this.sttUrl}/transcribe`, {
				method: 'POST',
				headers: this.authHeaders(),
				body: formData,
				signal: controller.signal,
			});

			if (!response.ok) {
				const error = await response.text().catch(() => '');
				throw new Error(`STT error ${response.status}: ${error}`);
			}

			return await response.json();
		} finally {
			clearTimeout(timer);
		}
	}

	/**
	 * Synthesize text to speech using the GPU server's TTS service.
	 * Returns audio as a Buffer.
	 */
	async synthesize(
		text: string,
		options: {
			voice?: string;
			speed?: number;
			format?: 'wav' | 'mp3';
		} = {}
	): Promise<{
		audio: Buffer;
		contentType: string;
		duration: number;
	}> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(`${this.ttsUrl}/synthesize/auto`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...this.authHeaders(),
				},
				body: JSON.stringify({
					text,
					voice: options.voice ?? 'de_katja',
					speed: options.speed ?? 1.0,
					output_format: options.format ?? 'mp3',
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				const error = await response.text().catch(() => '');
				throw new Error(`TTS error ${response.status}: ${error}`);
			}

			const arrayBuffer = await response.arrayBuffer();
			return {
				audio: Buffer.from(arrayBuffer),
				contentType: response.headers.get('content-type') ?? 'audio/mpeg',
				duration: parseFloat(response.headers.get('x-duration') ?? '0'),
			};
		} finally {
			clearTimeout(timer);
		}
	}

	/** Check if GPU voice services are available. */
	async healthCheck(): Promise<{ stt: boolean; tts: boolean }> {
		const check = async (url: string): Promise<boolean> => {
			try {
				const res = await fetch(`${url}/health`, {
					signal: AbortSignal.timeout(5000),
				});
				return res.ok;
			} catch {
				return false;
			}
		};

		const [stt, tts] = await Promise.all([check(this.sttUrl), check(this.ttsUrl)]);
		return { stt, tts };
	}
}
