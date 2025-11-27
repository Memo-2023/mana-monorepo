import { writable, derived, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { TranscriptionJob } from '$lib/api/client';
import { PUBLIC_API_URL } from '$env/static/public';

const WS_URL = (PUBLIC_API_URL || 'http://localhost:3006').replace('http', 'ws');

export const jobs: Writable<Map<string, TranscriptionJob>> = writable(new Map());
export const isConnected = writable(false);

export const jobList = derived(jobs, ($jobs) =>
	Array.from($jobs.values()).sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	)
);

export const activeJobs = derived(jobList, ($jobs) =>
	$jobs.filter(
		(j) => j.status === 'pending' || j.status === 'downloading' || j.status === 'transcribing'
	)
);

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export function initWebSocket() {
	if (!browser) return;

	const connect = () => {
		socket = new WebSocket(`${WS_URL}/progress`);

		socket.onopen = () => {
			console.log('[WebSocket] Connected');
			isConnected.set(true);
		};

		socket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'heartbeat') {
					return;
				}

				if (
					data.type === 'job_update' ||
					data.type === 'job_complete' ||
					data.type === 'job_error'
				) {
					jobs.update((map) => {
						const existing = map.get(data.jobId);
						if (existing) {
							map.set(data.jobId, {
								...existing,
								status: data.status || existing.status,
								progress: data.progress ?? existing.progress,
								error: data.error || existing.error,
								videoInfo: data.videoInfo || existing.videoInfo,
								transcriptPath: data.transcriptPath || existing.transcriptPath,
							});
						}
						return new Map(map);
					});
				}
			} catch (e) {
				console.error('[WebSocket] Parse error:', e);
			}
		};

		socket.onclose = () => {
			console.log('[WebSocket] Disconnected');
			isConnected.set(false);

			// Reconnect after 3 seconds
			reconnectTimeout = setTimeout(connect, 3000);
		};

		socket.onerror = (error) => {
			console.error('[WebSocket] Error:', error);
		};
	};

	connect();
}

export function addJob(job: TranscriptionJob) {
	jobs.update((map) => {
		map.set(job.id, job);
		return new Map(map);
	});
}

export function removeJob(id: string) {
	jobs.update((map) => {
		map.delete(id);
		return new Map(map);
	});
}

export function cleanup() {
	if (reconnectTimeout) {
		clearTimeout(reconnectTimeout);
	}
	if (socket) {
		socket.close();
	}
}
