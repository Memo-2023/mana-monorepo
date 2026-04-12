/**
 * Svelte 5 reactive integration for LocalSttEngine.
 *
 * Usage in a Svelte component:
 *   import { getLocalSttStatus, loadLocalStt, transcribe } from '@mana/local-stt';
 *
 *   const status = getLocalSttStatus();
 *   loadLocalStt();
 *   // use status.current reactively
 */

import { LocalSttEngine, localSTT } from './engine';
import type { LoadingStatus, TranscribeOptions, TranscribeResult } from './types';
import type { ModelKey } from './models';

let _status = $state<LoadingStatus>({ state: 'idle' });

localSTT.onStatusChange((s) => {
	_status = s;
});

export function getLocalSttStatus(): { readonly current: LoadingStatus } {
	return {
		get current() {
			return _status;
		},
	};
}

/**
 * Load a Whisper model. Safe to call multiple times (idempotent).
 */
export async function loadLocalStt(model?: ModelKey): Promise<void> {
	return localSTT.load(model);
}

/**
 * Unload the model and free memory.
 */
export async function unloadLocalStt(): Promise<void> {
	return localSTT.unload();
}

/**
 * Check if WebGPU is available for accelerated STT.
 */
export function isLocalSttSupported(): boolean {
	return LocalSttEngine.isSupported();
}

/**
 * Transcribe audio to text.
 */
export async function transcribe(options: TranscribeOptions): Promise<TranscribeResult> {
	return localSTT.transcribe(options);
}
