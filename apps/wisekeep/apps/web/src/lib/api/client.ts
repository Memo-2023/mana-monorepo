import { PUBLIC_API_URL } from '$env/static/public';

const API_BASE = PUBLIC_API_URL || 'http://localhost:3006';

export interface TranscriptionJob {
	id: string;
	url: string;
	language: string;
	provider: string;
	model?: string;
	status: 'pending' | 'downloading' | 'transcribing' | 'completed' | 'failed' | 'cancelled';
	progress: number;
	createdAt: string;
	completedAt?: string;
	videoInfo?: {
		id: string;
		title: string;
		channel: string;
		thumbnail: string;
		duration: number;
	};
	transcriptPath?: string;
	transcriptText?: string;
	error?: string;
}

export interface CreateJobRequest {
	url: string;
	language?: string;
	provider?: 'openai' | 'local';
	model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

export interface Playlist {
	category: string;
	name: string;
	path: string;
	urlCount: number;
	urls: string[];
	description?: string;
}

export interface Stats {
	totalTranscripts: number;
	totalSizeMB: number;
	activeJobs: number;
	completedJobs: number;
	failedJobs: number;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: res.statusText }));
		throw new Error(error.message || 'Request failed');
	}

	return res.json();
}

export const api = {
	// Transcription
	createJob: (data: CreateJobRequest) =>
		request<TranscriptionJob>('/transcription', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	getJob: (id: string) => request<TranscriptionJob>(`/transcription/${id}`),

	getAllJobs: () => request<TranscriptionJob[]>('/transcription'),

	cancelJob: (id: string) =>
		request<TranscriptionJob>(`/transcription/${id}`, { method: 'DELETE' }),

	getStats: () => request<Stats>('/transcription/stats'),

	// Playlists
	getPlaylists: () => request<Playlist[]>('/playlist'),

	getPlaylist: (category: string, name: string) =>
		request<Playlist>(`/playlist/${category}/${name}`),

	createPlaylist: (data: { name: string; description?: string; urls: string[] }) =>
		request<Playlist>('/playlist', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	// Whisper
	getModels: () =>
		request<{
			models: { name: string; size: string; speed: string; accuracy: string }[];
			defaultProvider: string;
			openaiAvailable: boolean;
		}>('/whisper/models'),

	// Health
	health: () => request<{ status: string }>('/health'),
};
