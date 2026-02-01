import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProcessService } from './process.service';
import { UploadService } from '../upload/upload.service';
import { PROCESS_QUEUE, SUPPORTED_IMAGE_TYPES } from './process.constants';

interface ProcessJobData {
	mediaId: string;
	mimeType: string;
	originalKey: string;
}

@Processor(PROCESS_QUEUE)
export class ProcessWorker extends WorkerHost {
	constructor(
		private processService: ProcessService,
		private uploadService: UploadService
	) {
		super();
	}

	async process(job: Job<ProcessJobData>): Promise<void> {
		const { mediaId, mimeType, originalKey } = job.data;

		console.log(`Processing media ${mediaId} (${mimeType})`);

		try {
			if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
				await this.processImage(mediaId, originalKey, mimeType);
			} else {
				// For unsupported types, just mark as ready
				await this.uploadService.update(mediaId, { status: 'ready' });
			}
		} catch (error) {
			console.error(`Failed to process media ${mediaId}:`, error);
			await this.uploadService.update(mediaId, { status: 'failed' });
			throw error;
		}
	}

	private async processImage(
		mediaId: string,
		originalKey: string,
		mimeType: string
	): Promise<void> {
		const result = await this.processService.processImage(mediaId, originalKey, mimeType);

		await this.uploadService.update(mediaId, {
			status: 'ready',
			keys: {
				original: originalKey,
				thumbnail: result.thumbnail,
				medium: result.medium,
				large: result.large,
			},
			metadata: result.metadata,
		});

		console.log(
			`Processed image ${mediaId}: thumbnail=${!!result.thumbnail}, medium=${!!result.medium}, large=${!!result.large}`
		);
	}
}
