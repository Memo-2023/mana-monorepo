import {
	Controller,
	Post,
	Get,
	Body,
	Param,
	BadRequestException,
	Logger,
	Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AudioService } from './audio.service';
import {
	TranscribeRealtimeDto,
	TranscribeFromStorageDto,
	ProcessVideoDto,
	TranscriptionResponseDto,
	BatchStatusResponseDto,
} from './dto';

@ApiTags('Audio Transcription')
@ApiBearerAuth()
@Controller('audio')
export class AudioController {
	private readonly logger = new Logger(AudioController.name);
	constructor(private readonly audioService: AudioService) {}

	@Post('transcribe-realtime')
	@ApiOperation({
		summary: 'Transcribe audio file in real-time',
		description:
			'Process and transcribe audio files using real-time transcription with automatic fallback to batch processing for longer files (>115 minutes). Supports speaker diarization and multi-language detection.',
	})
	@ApiResponse({
		status: 200,
		description: 'Transcription completed successfully',
		type: TranscriptionResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Bad request - invalid input parameters',
	})
	async transcribeRealtime(
		@Body() body: TranscribeRealtimeDto,
		@Headers('authorization') authHeader?: string
	) {
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new BadRequestException('Authorization token is required');
		}

		const token = authHeader.replace('Bearer ', '');

		this.logger.log(`Starting fast transcription: ${body.audioPath} for memo ${body.memoId}`);

		try {
			const result = await this.audioService.transcribeRealtimeWithFallback(
				body.audioPath,
				body.memoId,
				body.userId,
				body.spaceId,
				body.recordingLanguages || [],
				token,
				body.enableDiarization,
				body.isAppend,
				body.recordingIndex
			);

			return result;
		} catch (error) {
			this.logger.error('Error in transcribe-realtime with fallback:', error);
			throw new BadRequestException(
				`Transcription failed after all fallback attempts: ${error.message}`
			);
		}
	}

	@Post('transcribe-from-storage')
	@ApiOperation({
		summary: 'Transcribe audio from cloud storage',
		description:
			'Process audio files directly from cloud storage paths. Supports both Google Cloud Storage (gs://) and Supabase storage paths.',
	})
	@ApiResponse({
		status: 200,
		description: 'Transcription completed successfully',
		type: TranscriptionResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Bad request - invalid input parameters',
	})
	async transcribeFromStorage(
		@Body() body: TranscribeFromStorageDto,
		@Headers('authorization') authHeader?: string
	) {
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new BadRequestException('Authorization token is required');
		}

		const token = authHeader.replace('Bearer ', '');

		this.logger.log(`Processing audio from storage: ${body.audioPath}`);

		try {
			// Process audio using storage path
			const result = await this.audioService.processAudioFromStorage(
				body.audioPath,
				body.userId,
				body.spaceId,
				body.recordingLanguages,
				token,
				body.memoId,
				body.enableDiarization
			);

			return result;
		} catch (error) {
			this.logger.error('Error in transcribe-from-storage:', error);
			throw new BadRequestException(`Transcription failed: ${error.message}`);
		}
	}

	@Get('batch-status/:jobId')
	@ApiOperation({
		summary: 'Check batch transcription job status',
		description:
			'Check the status and retrieve results of a batch transcription job. Used for long audio files that are processed asynchronously.',
	})
	@ApiParam({
		name: 'jobId',
		description: 'Batch transcription job ID',
		example: 'batch-job-12345',
	})
	@ApiResponse({
		status: 200,
		description: 'Job status retrieved successfully',
		type: BatchStatusResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Bad request - invalid job ID',
	})
	async checkBatchStatus(
		@Param('jobId') jobId: string,
		@Headers('authorization') authHeader?: string
	) {
		if (!jobId) {
			throw new BadRequestException('Job ID is required');
		}

		this.logger.log(`Checking batch transcription status for job: ${jobId}`);

		try {
			const result = await this.audioService.checkBatchTranscriptionStatus(jobId);
			return result;
		} catch (error) {
			this.logger.error('Error checking batch status:', error);
			throw new BadRequestException(`Status check failed: ${error.message}`);
		}
	}

	@Post('process-video')
	@ApiOperation({
		summary: 'Process video file and transcribe audio',
		description:
			'Extract audio from video files and transcribe automatically. Supports multiple video formats (MP4, MOV, AVI, MKV, WEBM, FLV, WMV) with automatic format detection and conversion.',
	})
	@ApiResponse({
		status: 200,
		description: 'Video processing and transcription completed successfully',
		type: TranscriptionResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Bad request - invalid input parameters',
	})
	async processVideo(@Body() body: ProcessVideoDto, @Headers('authorization') authHeader?: string) {
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new BadRequestException('Authorization token is required');
		}

		const token = authHeader.replace('Bearer ', '');

		this.logger.log(`Processing video file: ${body.videoPath} for memo ${body.memoId}`);

		try {
			const result = await this.audioService.processVideoFile(
				body.videoPath,
				body.memoId,
				body.userId,
				body.spaceId,
				body.recordingLanguages || [],
				token,
				body.enableDiarization,
				body.isAppend,
				body.recordingIndex
			);

			return result;
		} catch (error) {
			this.logger.error('Error processing video:', error);
			throw new BadRequestException(`Video processing failed: ${error.message}`);
		}
	}
}
