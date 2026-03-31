import { Controller, Post, Body, UseGuards, HttpCode, BadRequestException } from '@nestjs/common';
import { MemoroService } from './memoro.service';
import { ServiceAuthGuard } from '../guards/service-auth.guard';

@Controller('memoro/service')
@UseGuards(ServiceAuthGuard)
export class MemoroServiceController {
	constructor(private readonly memoroService: MemoroService) {}

	/**
	 * Service-to-service endpoint for transcription completion
	 * Used by audio microservice with service role key authentication
	 */
	@Post('transcription-completed')
	@HttpCode(200)
	async handleTranscriptionCompleted(
		@Body()
		callbackData: {
			memoId: string;
			userId: string;
			transcriptionResult?: any;
			route?: 'fast' | 'batch';
			success?: boolean;
			error?: string;
		}
	) {
		try {
			console.log(`[Service Auth] Received transcription callback for memo ${callbackData.memoId}`);

			if (!callbackData.memoId || !callbackData.userId) {
				throw new BadRequestException('memoId and userId are required');
			}

			// Process the transcription using the existing method
			// The service will use service role key and validate ownership
			const result = await this.memoroService.handleTranscriptionCompleted(
				callbackData.memoId,
				callbackData.userId,
				callbackData.transcriptionResult,
				callbackData.route,
				callbackData.success,
				callbackData.error,
				null // No user token - will use service role key
			);

			return result;
		} catch (error) {
			console.error(`[Service Auth] Error processing callback:`, error);
			throw new BadRequestException(`Failed to process transcription callback: ${error.message}`);
		}
	}

	/**
	 * Service-to-service endpoint for append transcription completion
	 */
	@Post('append-transcription-completed')
	@HttpCode(200)
	async handleAppendTranscriptionCompleted(
		@Body()
		callbackData: {
			memoId: string;
			userId: string;
			transcriptionResult?: any;
			route?: 'fast' | 'batch';
			success?: boolean;
			error?: string;
			recordingIndex?: number;
		}
	) {
		try {
			console.log(
				`[Service Auth] Received append transcription callback for memo ${callbackData.memoId}`
			);

			if (!callbackData.memoId || !callbackData.userId) {
				throw new BadRequestException('memoId and userId are required');
			}

			const result = await this.memoroService.handleAppendTranscriptionCompleted(
				callbackData.memoId,
				callbackData.userId,
				callbackData.transcriptionResult,
				callbackData.route || 'fast',
				callbackData.success !== false,
				callbackData.error || null,
				null // No user token - will use service role key
			);

			return result;
		} catch (error) {
			console.error(`[Service Auth] Error processing append callback:`, error);
			throw new BadRequestException(
				`Failed to process append transcription callback: ${error.message}`
			);
		}
	}

	/**
	 * Service-to-service endpoint for updating batch metadata
	 */
	@Post('update-batch-metadata')
	@HttpCode(200)
	async updateBatchMetadata(
		@Body()
		body: {
			memoId: string;
			jobId: string;
			batchTranscription: boolean;
			userId?: string; // Optional for backward compatibility
		}
	) {
		try {
			const { memoId, jobId, batchTranscription, userId } = body;
			console.log(`[Service Auth] Updating batch metadata for memo ${memoId}`);

			const result = await this.memoroService.updateBatchMetadataByMemoId(
				memoId,
				jobId,
				batchTranscription,
				null, // No user token needed - service will use service role key
				undefined, // userSelectedLanguages
				userId // Pass userId for ownership validation
			);

			return result;
		} catch (error) {
			console.error(`[Service Auth] Error updating batch metadata:`, error);
			throw new BadRequestException(`Failed to update batch metadata: ${error.message}`);
		}
	}
}
