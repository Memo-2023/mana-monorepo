import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  feedbackText: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['bug', 'feature', 'improvement', 'question', 'other'])
  category?: string;
}

export class FeedbackQueryDto {
  @IsOptional()
  @IsIn([
    'submitted',
    'under_review',
    'planned',
    'in_progress',
    'completed',
    'declined',
  ])
  status?: string;

  @IsOptional()
  @IsIn(['bug', 'feature', 'improvement', 'question', 'other'])
  category?: string;

  @IsOptional()
  @IsIn(['votes', 'recent'])
  sort?: string;
}
