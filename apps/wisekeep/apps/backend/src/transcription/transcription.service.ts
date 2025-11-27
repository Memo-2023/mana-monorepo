import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { YoutubeService } from '../youtube/youtube.service';
import { WhisperService, WhisperProvider, WhisperModel } from '../whisper/whisper.service';
import { ProgressGateway } from '../websocket/progress.gateway';
import { TranscriptionJob, JobStatus } from './entities/transcription-job.entity';
import { TranscribeRequestDto } from './dto/transcribe-request.dto';

@Injectable()
export class TranscriptionService {
	private readonly logger = new Logger(TranscriptionService.name);
	private readonly jobs: Map<string, TranscriptionJob> = new Map();
	private readonly transcriptsDir: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly youtubeService: YoutubeService,
		private readonly whisperService: WhisperService,
		private readonly progressGateway: ProgressGateway
	) {
		this.transcriptsDir = this.configService.get<string>('TRANSCRIPTS_DIR') || './data/transcripts';

		// Ensure transcripts directory exists
		if (!fs.existsSync(this.transcriptsDir)) {
			fs.mkdirSync(this.transcriptsDir, { recursive: true });
		}
	}

	async createJob(dto: TranscribeRequestDto): Promise<TranscriptionJob> {
		const jobId = uuidv4();
		const job = new TranscriptionJob(
			jobId,
			dto.url,
			dto.language || 'de',
			dto.provider || 'openai',
			dto.model
		);

		this.jobs.set(jobId, job);

		// Start processing in background
		this.processJob(job);

		return job;
	}

	async getJob(id: string): Promise<TranscriptionJob> {
		const job = this.jobs.get(id);
		if (!job) {
			throw new NotFoundException(`Job ${id} not found`);
		}
		return job;
	}

	async getAllJobs(): Promise<TranscriptionJob[]> {
		return Array.from(this.jobs.values());
	}

	async cancelJob(id: string): Promise<TranscriptionJob> {
		const job = this.jobs.get(id);
		if (!job) {
			throw new NotFoundException(`Job ${id} not found`);
		}

		if (
			job.status === JobStatus.PENDING ||
			job.status === JobStatus.DOWNLOADING ||
			job.status === JobStatus.TRANSCRIBING
		) {
			job.status = JobStatus.CANCELLED;
			job.error = 'Cancelled by user';

			this.progressGateway.broadcastJobUpdate(job.id, {
				status: job.status,
				error: job.error,
			});
		}

		return job;
	}

	private async processJob(job: TranscriptionJob): Promise<void> {
		let audioPath: string | null = null;
		const jobId = job.id;

		// Helper to check if job was cancelled (re-reads from map to get current status)
		const isCancelled = (): boolean => {
			const currentJob = this.jobs.get(jobId);
			return currentJob?.status === JobStatus.CANCELLED;
		};

		try {
			// Step 1: Get video info
			this.updateJobProgress(job, JobStatus.DOWNLOADING, 5);

			const videoInfo = await this.youtubeService.getVideoInfo(job.url);
			job.videoInfo = videoInfo;
			this.updateJobProgress(job, JobStatus.DOWNLOADING, 10);

			this.logger.log(`Processing: ${videoInfo.title}`);

			// Check if cancelled
			if (isCancelled()) return;

			// Step 2: Download audio
			audioPath = await this.youtubeService.downloadAudio(job.url, (progress) => {
				const overallProgress = 10 + progress.percent * 0.4; // 10-50%
				this.updateJobProgress(job, JobStatus.DOWNLOADING, Math.round(overallProgress));
			});

			this.updateJobProgress(job, JobStatus.DOWNLOADING, 50);

			// Check if cancelled
			if (isCancelled()) {
				if (audioPath) await this.youtubeService.cleanupFile(audioPath);
				return;
			}

			// Step 3: Transcribe
			this.updateJobProgress(job, JobStatus.TRANSCRIBING, 55);

			const result = await this.whisperService.transcribe(
				audioPath,
				job.language,
				job.provider as WhisperProvider,
				job.model as WhisperModel
			);

			this.updateJobProgress(job, JobStatus.TRANSCRIBING, 90);

			// Check if cancelled
			if (isCancelled()) {
				if (audioPath) await this.youtubeService.cleanupFile(audioPath);
				return;
			}

			// Step 4: Save transcript
			const transcriptPath = await this.saveTranscript(job, videoInfo, result.text);

			job.transcriptPath = transcriptPath;
			job.transcriptText = result.text;
			job.status = JobStatus.COMPLETED;
			job.progress = 100;
			job.completedAt = new Date();

			this.progressGateway.broadcastJobUpdate(job.id, {
				status: job.status,
				progress: job.progress,
				transcriptPath: job.transcriptPath,
			});

			this.logger.log(`Completed: ${videoInfo.title}`);
		} catch (error) {
			job.status = JobStatus.FAILED;
			job.error = error instanceof Error ? error.message : 'Unknown error';

			this.progressGateway.broadcastJobUpdate(job.id, {
				status: job.status,
				error: job.error,
			});

			this.logger.error(`Job failed: ${job.error}`);
		} finally {
			// Cleanup audio file
			if (audioPath) {
				await this.youtubeService.cleanupFile(audioPath);
			}
		}
	}

	private updateJobProgress(job: TranscriptionJob, status: JobStatus, progress: number): void {
		job.status = status;
		job.progress = progress;

		this.progressGateway.broadcastJobUpdate(job.id, {
			status: job.status,
			progress: job.progress,
			videoInfo: job.videoInfo,
		});
	}

	private async saveTranscript(
		job: TranscriptionJob,
		videoInfo: { channel: string; title: string; id: string },
		text: string
	): Promise<string> {
		// Sanitize names for filesystem
		const sanitize = (str: string) => str.replace(/[^a-z0-9äöüß\-_]/gi, '_').substring(0, 50);

		const channelDir = path.join(this.transcriptsDir, sanitize(videoInfo.channel));

		if (!fs.existsSync(channelDir)) {
			fs.mkdirSync(channelDir, { recursive: true });
		}

		const filename = `${sanitize(videoInfo.title)}_${videoInfo.id}.txt`;
		const filePath = path.join(channelDir, filename);

		const content = `# ${videoInfo.title}
Channel: ${videoInfo.channel}
Video ID: ${videoInfo.id}
Language: ${job.language}
Transcribed: ${new Date().toISOString()}
Provider: ${job.provider}

---

${text}
`;

		fs.writeFileSync(filePath, content, 'utf-8');

		return filePath;
	}

	async getStats() {
		const jobs = Array.from(this.jobs.values());

		let totalTranscripts = 0;
		let totalSize = 0;

		if (fs.existsSync(this.transcriptsDir)) {
			const countFiles = (dir: string) => {
				const items = fs.readdirSync(dir, { withFileTypes: true });
				for (const item of items) {
					const fullPath = path.join(dir, item.name);
					if (item.isDirectory()) {
						countFiles(fullPath);
					} else if (item.name.endsWith('.txt')) {
						totalTranscripts++;
						totalSize += fs.statSync(fullPath).size;
					}
				}
			};
			countFiles(this.transcriptsDir);
		}

		return {
			totalTranscripts,
			totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
			activeJobs: jobs.filter(
				(j) =>
					j.status === JobStatus.PENDING ||
					j.status === JobStatus.DOWNLOADING ||
					j.status === JobStatus.TRANSCRIBING
			).length,
			completedJobs: jobs.filter((j) => j.status === JobStatus.COMPLETED).length,
			failedJobs: jobs.filter((j) => j.status === JobStatus.FAILED).length,
		};
	}
}
