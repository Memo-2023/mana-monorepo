import type { GpuServiceConfig } from './types';
import { GPU_PUBLIC_URLS } from './types';

type ServiceKey = 'llm' | 'stt' | 'tts' | 'image' | 'ollama';

const LAN_PORTS: Record<ServiceKey, number> = {
	llm: 3025,
	stt: 3020,
	tts: 3022,
	image: 3023,
	ollama: 11434,
};

/** Resolve the URL for a specific GPU service based on config. */
export function resolveServiceUrl(config: GpuServiceConfig, service: ServiceKey): string {
	// 1. Explicit override
	if (config.urls?.[service]) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return config.urls[service]!;
	}

	const base = config.baseUrl;

	// 2. Public mode: "https://gpu.mana.how" → "https://gpu-stt.mana.how"
	if (base.includes('gpu.mana.how')) {
		return GPU_PUBLIC_URLS[service];
	}

	// 3. LAN mode: "http://192.168.178.11" → "http://192.168.178.11:3020"
	return `${base.replace(/\/$/, '')}:${LAN_PORTS[service]}`;
}
