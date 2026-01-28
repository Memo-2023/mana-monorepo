import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class UpdateAnswerDto {
	@IsOptional()
	@IsString()
	content?: string;

	@IsOptional()
	@IsString()
	contentMarkdown?: string;

	@IsOptional()
	@IsString()
	summary?: string;
}

export class RateAnswerDto {
	@IsNumber()
	@Min(1)
	@Max(5)
	rating: number;

	@IsOptional()
	@IsString()
	feedback?: string;
}

export class AcceptAnswerDto {
	@IsBoolean()
	isAccepted: boolean;
}
