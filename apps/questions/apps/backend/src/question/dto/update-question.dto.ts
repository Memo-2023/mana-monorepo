import { IsString, IsOptional, IsArray, IsUUID, IsEnum } from 'class-validator';
import { QuestionPriority, ResearchDepth } from './create-question.dto';

export enum QuestionStatus {
	OPEN = 'open',
	RESEARCHING = 'researching',
	ANSWERED = 'answered',
	ARCHIVED = 'archived',
}

export class UpdateQuestionDto {
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsUUID()
	collectionId?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@IsEnum(QuestionPriority)
	priority?: QuestionPriority;

	@IsOptional()
	@IsEnum(QuestionStatus)
	status?: QuestionStatus;

	@IsOptional()
	@IsEnum(ResearchDepth)
	researchDepth?: ResearchDepth;
}
