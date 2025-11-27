export enum JobStatus {
	PENDING = 'pending',
	DOWNLOADING = 'downloading',
	TRANSCRIBING = 'transcribing',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

export interface VideoInfo {
	id: string;
	title: string;
	description: string;
	duration: number;
	channel: string;
	channelId: string;
	thumbnail: string;
	uploadDate: string;
}

export class TranscriptionJob {
	id: string;
	url: string;
	language: string;
	provider: string;
	model?: string;
	status: JobStatus;
	progress: number;
	createdAt: Date;
	completedAt?: Date;
	videoInfo?: VideoInfo;
	transcriptPath?: string;
	transcriptText?: string;
	error?: string;

	constructor(id: string, url: string, language: string, provider: string, model?: string) {
		this.id = id;
		this.url = url;
		this.language = language;
		this.provider = provider;
		this.model = model;
		this.status = JobStatus.PENDING;
		this.progress = 0;
		this.createdAt = new Date();
	}
}
