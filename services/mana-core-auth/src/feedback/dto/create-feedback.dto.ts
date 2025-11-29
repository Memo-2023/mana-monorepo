import { IsString, IsOptional, MaxLength, MinLength, IsEnum, IsObject } from 'class-validator';

export class CreateFeedbackDto {
	@IsString()
	@IsOptional()
	@MaxLength(100)
	title?: string;

	@IsString()
	@MinLength(10, { message: 'Feedback must be at least 10 characters long' })
	@MaxLength(2000, { message: 'Feedback must be at most 2000 characters long' })
	feedbackText: string;

	@IsEnum(['bug', 'feature', 'improvement', 'question', 'other'])
	@IsOptional()
	category?: 'bug' | 'feature' | 'improvement' | 'question' | 'other';

	@IsObject()
	@IsOptional()
	deviceInfo?: Record<string, unknown>;
}
