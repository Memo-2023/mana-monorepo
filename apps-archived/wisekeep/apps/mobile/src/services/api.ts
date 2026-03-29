import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3006';

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
	createJob: (data: CreateJobRequest) =>
		request<TranscriptionJob>('/transcription', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	getJob: (id: string) => request<TranscriptionJob>(`/transcription/${id}`),

	getAllJobs: () => request<TranscriptionJob[]>('/transcription'),

	cancelJob: (id: string) =>
		request<TranscriptionJob>(`/transcription/${id}`, { method: 'DELETE' }),

	health: () => request<{ status: string }>('/health'),
};
