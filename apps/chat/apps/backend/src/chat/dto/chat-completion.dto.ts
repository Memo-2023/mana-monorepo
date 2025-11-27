import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
	@IsString()
	@IsNotEmpty()
	role: 'system' | 'user' | 'assistant';

	@IsString()
	@IsNotEmpty()
	content: string;
}

export class ChatCompletionDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ChatMessageDto)
	messages: ChatMessageDto[];

	@IsString()
	@IsNotEmpty()
	modelId: string;

	@IsNumber()
	@IsOptional()
	temperature?: number;

	@IsNumber()
	@IsOptional()
	maxTokens?: number;
}

export class ChatCompletionResponseDto {
	content: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}
