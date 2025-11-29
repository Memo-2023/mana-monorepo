import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class FeedbackQueryDto {
	@IsString()
	@IsOptional()
	appId?: string;

	@IsEnum(['submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined'])
	@IsOptional()
	status?: string;

	@IsEnum(['bug', 'feature', 'improvement', 'question', 'other'])
	@IsOptional()
	category?: string;

	@IsEnum(['votes', 'recent'])
	@IsOptional()
	sort?: 'votes' | 'recent' = 'votes';

	@Transform(({ value }) => parseInt(value, 10))
	@IsInt()
	@Min(1)
	@Max(50)
	@IsOptional()
	limit?: number = 20;

	@Transform(({ value }) => parseInt(value, 10))
	@IsInt()
	@Min(0)
	@IsOptional()
	offset?: number = 0;
}
