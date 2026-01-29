import { IsUUID, IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateAnswerDto {
	@IsUUID()
	questionId: string;

	@IsOptional()
	@IsUUID()
	researchResultId?: string;

	@IsString()
	content: string;

	@IsOptional()
	@IsString()
	contentMarkdown?: string;

	@IsOptional()
	@IsString()
	summary?: string;

	@IsString()
	modelId: string;

	@IsString()
	provider: string;

	@IsOptional()
	@IsNumber()
	promptTokens?: number;

	@IsOptional()
	@IsNumber()
	completionTokens?: number;

	@IsOptional()
	@IsNumber()
	estimatedCost?: number;

	@IsOptional()
	@IsNumber()
	confidence?: number;

	@IsOptional()
	@IsNumber()
	sourceCount?: number;

	@IsOptional()
	@IsArray()
	citations?: any[];

	@IsOptional()
	@IsNumber()
	durationMs?: number;
}
