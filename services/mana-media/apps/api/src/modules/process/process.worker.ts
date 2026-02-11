import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
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
	private readonly logger = new Logger(ProcessWorker.name);

	constructor(
		private processService: ProcessService,
		private uploadService: UploadService
	) {
		super();
	}

	async process(job: Job<ProcessJobData>): Promise<void> {
		const { mediaId, mimeType, originalKey } = job.data;

		this.logger.log(`Processing media ${mediaId} (${mimeType})`);

		try {
			if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
				await this.processImage(mediaId, originalKey, mimeType);
			} else {
				// For unsupported types, just mark as ready
				await this.uploadService.update(mediaId, { status: 'ready' });
			}
		} catch (error) {
			this.logger.error(`Failed to process media ${mediaId}:`, error);
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
			thumbnailKey: result.thumbnail,
			mediumKey: result.medium,
			largeKey: result.large,
			width: result.metadata?.width,
			height: result.metadata?.height,
			format: result.metadata?.format,
			hasAlpha: result.metadata?.hasAlpha,
			// EXIF data
			exifData: result.exif?.raw,
			dateTaken: result.exif?.dateTaken,
			cameraMake: result.exif?.cameraMake,
			cameraModel: result.exif?.cameraModel,
			focalLength: result.exif?.focalLength,
			aperture: result.exif?.aperture,
			iso: result.exif?.iso,
			exposureTime: result.exif?.exposureTime,
			gpsLatitude: result.exif?.gpsLatitude,
			gpsLongitude: result.exif?.gpsLongitude,
		});

		this.logger.log(
			`Processed image ${mediaId}: thumbnail=${!!result.thumbnail}, medium=${!!result.medium}, large=${!!result.large}, exif=${!!result.exif}`
		);
	}
}
