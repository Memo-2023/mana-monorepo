import type { TranscriptionResult, TranscribeOptions, GpuServiceConfig } from './types';
import { resolveServiceUrl } from './resolve-url';

export class SttClient {
	private baseUrl: string;
	private timeout: number;

	constructor(config: GpuServiceConfig) {
		this.baseUrl = resolveServiceUrl(config, 'stt');
		this.timeout = config.timeout ?? 60_000;
	}

	/** Transcribe audio with optional word timestamps and speaker diarization. */
	async transcribe(
		audioBuffer: Buffer | Blob,
		filename: string,
		options: TranscribeOptions = {}
	): Promise<TranscriptionResult> {
		const formData = new FormData();
		const blob =
			audioBuffer instanceof Blob ? audioBuffer : new Blob([new Uint8Array(audioBuffer)]);
		formData.append('file', blob, filename);

		if (options.language) formData.append('language', options.language);
		if (options.model) formData.append('model', options.model);
		formData.append('align', String(options.align ?? true));
		formData.append('diarize', String(options.diarize ?? false));
		if (options.minSpeakers != null) formData.append('min_speakers', String(options.minSpeakers));
		if (options.maxSpeakers != null) formData.append('max_speakers', String(options.maxSpeakers));

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(`${this.baseUrl}/transcribe`, {
				method: 'POST',
				body: formData,
				signal: controller.signal,
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ detail: response.statusText }));
				throw new Error(`STT error ${response.status}: ${(error as { detail: string }).detail}`);
			}

			return (await response.json()) as TranscriptionResult;
		} finally {
			clearTimeout(timer);
		}
	}

	/** Check if the STT service is healthy. */
	async health(): Promise<{ status: string; whisperx: boolean }> {
		const response = await fetch(`${this.baseUrl}/health`, {
			signal: AbortSignal.timeout(5000),
		});
		return (await response.json()) as { status: string; whisperx: boolean };
	}
}
