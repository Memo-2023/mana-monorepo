// Transcription Job Types
export type JobStatus =
	| 'pending'
	| 'downloading'
	| 'transcribing'
	| 'completed'
	| 'failed'
	| 'cancelled';

export type WhisperProvider = 'groq' | 'local';

export type GroqWhisperModel = 'whisper-large-v3-turbo' | 'whisper-large-v3';
export type LocalWhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';
export type WhisperModel = GroqWhisperModel | LocalWhisperModel;

export interface VideoInfo {
	id: string;
	title: string;
	channel: string;
	duration: number;
	thumbnail?: string;
}

export interface TranscriptionJob {
	id: string;
	url: string;
	status: JobStatus;
	progress: number;
	language: string;
	provider: WhisperProvider;
	model?: WhisperModel;
	videoInfo?: VideoInfo;
	transcriptPath?: string;
	transcriptText?: string;
	error?: string;
	createdAt: string;
	completedAt?: string;
}

export interface TranscribeRequest {
	url: string;
	language?: string;
	provider?: WhisperProvider;
	model?: WhisperModel;
}

export interface TranscriptionStats {
	totalTranscripts: number;
	totalSizeMB: number;
	activeJobs: number;
	completedJobs: number;
	failedJobs: number;
}

// WebSocket Event Types
export interface JobUpdateEvent {
	type: 'job_update';
	jobId: string;
	status: JobStatus;
	progress: number;
	videoInfo?: VideoInfo;
}

export interface JobCompleteEvent {
	type: 'job_complete';
	jobId: string;
	status: 'completed';
	transcriptPath: string;
}

export interface JobErrorEvent {
	type: 'job_error';
	jobId: string;
	error: string;
}

export type WebSocketEvent = JobUpdateEvent | JobCompleteEvent | JobErrorEvent;

// Playlist Types
export interface Playlist {
	name: string;
	category: string;
	urls: string[];
	createdAt: string;
	updatedAt: string;
}

export interface PlaylistSummary {
	category: string;
	name: string;
	urlCount: number;
}
