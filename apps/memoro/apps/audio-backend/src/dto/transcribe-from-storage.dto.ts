import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranscribeFromStorageDto {
	@ApiProperty({
		description: 'Path to the audio file in cloud storage',
		example: 'gs://bucket-name/audio/recording.mp3',
	})
	@IsString()
	@IsNotEmpty()
	audioPath: string;

	@ApiProperty({
		description: 'User ID who owns this transcription',
		example: 'user-123',
	})
	@IsString()
	@IsNotEmpty()
	userId: string;

	@ApiPropertyOptional({
		description: 'Space/workspace ID for organization',
		example: 'space-456',
	})
	@IsString()
	@IsOptional()
	spaceId?: string;

	@ApiPropertyOptional({
		description: 'Array of language codes for transcription (e.g., ["de-DE", "en-US"])',
		example: ['de-DE', 'en-US'],
		type: [String],
	})
	@IsArray()
	@IsOptional()
	recordingLanguages?: string[];

	@ApiPropertyOptional({
		description: 'Unique identifier for the memo (optional for this endpoint)',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@IsString()
	@IsOptional()
	memoId?: string;

	@ApiPropertyOptional({
		description: 'Enable speaker diarization (speaker separation)',
		example: true,
		default: false,
	})
	@IsBoolean()
	@IsOptional()
	enableDiarization?: boolean;
}
