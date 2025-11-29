import { writable } from 'svelte/store';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading';

interface RecordingState {
	status: RecordingStatus;
	duration: number;
	audioBlob: Blob | null;
	audioUrl: string | null;
	error: string | null;
}

function createRecordingStore() {
	const { subscribe, set, update } = writable<RecordingState>({
		status: 'idle',
		duration: 0,
		audioBlob: null,
		audioUrl: null,
		error: null,
	});

	return {
		subscribe,
		setStatus: (status: RecordingStatus) => update((state) => ({ ...state, status })),
		setDuration: (duration: number) => update((state) => ({ ...state, duration })),
		setAudioBlob: (blob: Blob) =>
			update((state) => ({
				...state,
				audioBlob: blob,
				audioUrl: URL.createObjectURL(blob),
			})),
		setError: (error: string | null) => update((state) => ({ ...state, error })),
		reset: () =>
			set({
				status: 'idle',
				duration: 0,
				audioBlob: null,
				audioUrl: null,
				error: null,
			}),
	};
}

export const recording = createRecordingStore();
