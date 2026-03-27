import type { SynthesizeOptions, TTSVoice, TTSHealthResponse, GpuServiceConfig } from './types';
import { resolveServiceUrl } from './resolve-url';

export class TtsClient {
	private baseUrl: string;
	private timeout: number;

	constructor(config: GpuServiceConfig) {
		this.baseUrl = resolveServiceUrl(config, 'tts');
		this.timeout = config.timeout ?? 30_000;
	}

	/** Synthesize speech. Returns audio as ArrayBuffer. */
	async synthesize(options: SynthesizeOptions): Promise<{
		audio: ArrayBuffer;
		contentType: string;
		voice: string;
		duration: number;
	}> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(`${this.baseUrl}/synthesize/auto`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text: options.text,
					voice: options.voice,
					speed: options.speed ?? 1.0,
					output_format: options.outputFormat ?? 'wav',
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ detail: response.statusText }));
				throw new Error(`TTS error ${response.status}: ${(error as { detail: string }).detail}`);
			}

			return {
				audio: await response.arrayBuffer(),
				contentType: response.headers.get('content-type') ?? 'audio/wav',
				voice: response.headers.get('x-voice') ?? options.voice ?? 'default',
				duration: parseFloat(response.headers.get('x-duration') ?? '0'),
			};
		} finally {
			clearTimeout(timer);
		}
	}

	/** Get available voices. */
	async voices(): Promise<{ kokoro_voices: TTSVoice[]; custom_voices: TTSVoice[] }> {
		const response = await fetch(`${this.baseUrl}/voices`, {
			signal: AbortSignal.timeout(5000),
		});
		return (await response.json()) as { kokoro_voices: TTSVoice[]; custom_voices: TTSVoice[] };
	}

	/** Check if the TTS service is healthy. */
	async health(): Promise<TTSHealthResponse> {
		const response = await fetch(`${this.baseUrl}/health`, {
			signal: AbortSignal.timeout(5000),
		});
		return (await response.json()) as TTSHealthResponse;
	}
}
