import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

export interface DownloadProgress {
	percent: number;
	speed: string;
	eta: string;
}

@Injectable()
export class YoutubeService {
	private readonly logger = new Logger(YoutubeService.name);
	private readonly tempDir: string;

	constructor(private configService: ConfigService) {
		this.tempDir = this.configService.get<string>('TEMP_AUDIO_DIR') || './temp_audio';

		// Ensure temp directory exists
		if (!fs.existsSync(this.tempDir)) {
			fs.mkdirSync(this.tempDir, { recursive: true });
		}
	}

	async getVideoInfo(url: string): Promise<VideoInfo> {
		return new Promise((resolve, reject) => {
			const ytdlp = spawn('yt-dlp', ['--dump-json', '--no-download', url]);

			let stdout = '';
			let stderr = '';

			ytdlp.stdout.on('data', (data) => {
				stdout += data.toString();
			});

			ytdlp.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			ytdlp.on('close', (code) => {
				if (code !== 0) {
					this.logger.error(`yt-dlp info error: ${stderr}`);
					reject(new Error(`Failed to get video info: ${stderr}`));
					return;
				}

				try {
					const info = JSON.parse(stdout);
					resolve({
						id: info.id,
						title: info.title,
						description: info.description || '',
						duration: info.duration,
						channel: info.channel || info.uploader,
						channelId: info.channel_id || info.uploader_id,
						thumbnail: info.thumbnail,
						uploadDate: info.upload_date,
					});
				} catch (e) {
					reject(new Error('Failed to parse video info'));
				}
			});
		});
	}

	async downloadAudio(
		url: string,
		onProgress?: (progress: DownloadProgress) => void
	): Promise<string> {
		const outputId = uuidv4();
		const outputPath = path.join(this.tempDir, `${outputId}.mp3`);

		return new Promise((resolve, reject) => {
			const ytdlp = spawn('yt-dlp', [
				'-x',
				'--audio-format',
				'mp3',
				'--audio-quality',
				'0',
				'-o',
				outputPath.replace('.mp3', '.%(ext)s'),
				'--newline',
				url,
			]);

			let stderr = '';

			ytdlp.stdout.on('data', (data) => {
				const line = data.toString();

				// Parse download progress
				const progressMatch = line.match(/(\d+\.?\d*)%.*?(\d+\.?\d*\w+\/s).*?ETA\s+(\d+:\d+)/);
				if (progressMatch && onProgress) {
					onProgress({
						percent: parseFloat(progressMatch[1]),
						speed: progressMatch[2],
						eta: progressMatch[3],
					});
				}
			});

			ytdlp.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			ytdlp.on('close', (code) => {
				if (code !== 0) {
					this.logger.error(`yt-dlp download error: ${stderr}`);
					reject(new Error(`Download failed: ${stderr}`));
					return;
				}

				// Find the actual output file (might have different extension initially)
				const files = fs.readdirSync(this.tempDir);
				const outputFile = files.find((f) => f.startsWith(outputId));

				if (!outputFile) {
					reject(new Error('Output file not found'));
					return;
				}

				const actualPath = path.join(this.tempDir, outputFile);
				this.logger.log(`Downloaded audio to: ${actualPath}`);
				resolve(actualPath);
			});
		});
	}

	async cleanupFile(filePath: string): Promise<void> {
		try {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
				this.logger.log(`Cleaned up: ${filePath}`);
			}
		} catch (e) {
			this.logger.warn(`Failed to cleanup file: ${filePath}`);
		}
	}

	isValidYoutubeUrl(url: string): boolean {
		const patterns = [
			/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//,
			/^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=/,
			/^(https?:\/\/)?youtu\.be\//,
		];

		return patterns.some((pattern) => pattern.test(url));
	}
}
