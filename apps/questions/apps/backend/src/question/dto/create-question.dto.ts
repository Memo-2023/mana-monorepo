import { IsString, IsOptional, IsArray, IsUUID, IsEnum } from 'class-validator';

export enum QuestionPriority {
	LOW = 'low',
	NORMAL = 'normal',
	HIGH = 'high',
	URGENT = 'urgent',
}

export enum ResearchDepth {
	QUICK = 'quick',
	STANDARD = 'standard',
	DEEP = 'deep',
}

export class CreateQuestionDto {
	@IsString()
	title: string;

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
	@IsEnum(ResearchDepth)
	researchDepth?: ResearchDepth;
}
