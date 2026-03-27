import type { GpuServiceConfig } from './types';
import { SttClient } from './stt-client';
import { TtsClient } from './tts-client';
import { ImageClient } from './image-client';

/**
 * Unified client for all Mana GPU services.
 *
 * @example Public URLs (from anywhere):
 * ```ts
 * const gpu = new GpuClient({ baseUrl: 'https://gpu.mana.how' });
 * ```
 *
 * @example LAN (direct):
 * ```ts
 * const gpu = new GpuClient({ baseUrl: 'http://192.168.178.11' });
 * ```
 *
 * @example Custom URLs:
 * ```ts
 * const gpu = new GpuClient({
 *   baseUrl: '',
 *   urls: { stt: 'https://gpu-stt.mana.how', tts: 'https://gpu-tts.mana.how' },
 * });
 * ```
 */
export class GpuClient {
	public readonly stt: SttClient;
	public readonly tts: TtsClient;
	public readonly image: ImageClient;

	constructor(config: GpuServiceConfig) {
		this.stt = new SttClient(config);
		this.tts = new TtsClient(config);
		this.image = new ImageClient(config);
	}

	/** Check health of all GPU services. */
	async healthCheck(): Promise<{
		stt: boolean;
		tts: boolean;
		image: boolean;
	}> {
		const [sttHealth, ttsHealth, imageHealth] = await Promise.allSettled([
			this.stt.health(),
			this.tts.health(),
			this.image.health(),
		]);

		return {
			stt: sttHealth.status === 'fulfilled' && sttHealth.value.status === 'healthy',
			tts: ttsHealth.status === 'fulfilled' && ttsHealth.value.status === 'healthy',
			image: imageHealth.status === 'fulfilled' && imageHealth.value.status === 'healthy',
		};
	}
}
