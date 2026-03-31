import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranscriptionSegment {
	@ApiProperty({
		description: 'Text content of the segment',
		example: 'Hello, this is a test recording.',
	})
	text: string;

	@ApiPropertyOptional({
		description: 'Start time of the segment in seconds',
		example: 0.5,
	})
	start?: number;

	@ApiPropertyOptional({
		description: 'End time of the segment in seconds',
		example: 3.2,
	})
	end?: number;

	@ApiPropertyOptional({
		description: 'Speaker identifier (when diarization is enabled)',
		example: 'Speaker 1',
	})
	speaker?: string;

	@ApiPropertyOptional({
		description: 'Confidence score of the transcription',
		example: 0.95,
	})
	confidence?: number;
}

export class TranscriptionResponseDto {
	@ApiProperty({
		description: 'Full transcription text',
		example: 'Hello, this is a test recording. How are you today?',
	})
	text: string;

	@ApiPropertyOptional({
		description: 'Individual transcription segments with timing',
		type: [TranscriptionSegment],
	})
	segments?: TranscriptionSegment[];

	@ApiPropertyOptional({
		description: 'Detected language of the audio',
		example: 'de-DE',
	})
	language?: string;

	@ApiPropertyOptional({
		description: 'Duration of the audio in seconds',
		example: 125.5,
	})
	duration?: number;

	@ApiProperty({
		description: 'Status of the transcription',
		example: 'success',
		enum: ['success', 'processing', 'failed'],
	})
	status: string;

	@ApiPropertyOptional({
		description: 'Job ID for batch transcriptions (for long audio files)',
		example: 'batch-job-12345',
	})
	jobId?: string;

	@ApiPropertyOptional({
		description: 'Error message if transcription failed',
		example: 'Audio file not found',
	})
	error?: string;
}

export class BatchStatusResponseDto {
	@ApiProperty({
		description: 'Current status of the batch job',
		example: 'Succeeded',
		enum: ['NotStarted', 'Running', 'Succeeded', 'Failed'],
	})
	status: string;

	@ApiPropertyOptional({
		description: 'Transcription result (available when status is Succeeded)',
		type: TranscriptionResponseDto,
	})
	transcription?: TranscriptionResponseDto;

	@ApiPropertyOptional({
		description: 'Error details if the job failed',
		example: 'Transcription service timeout',
	})
	error?: string;

	@ApiPropertyOptional({
		description: 'Progress percentage (0-100)',
		example: 75,
	})
	progress?: number;
}
