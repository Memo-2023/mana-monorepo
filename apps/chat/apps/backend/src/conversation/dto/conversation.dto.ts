import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
	@IsString()
	@IsNotEmpty()
	modelId: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	title?: string;

	@IsString()
	@IsOptional()
	templateId?: string;

	@IsString()
	@IsOptional()
	conversationMode?: 'free' | 'guided' | 'template';

	@IsBoolean()
	@IsOptional()
	documentMode?: boolean;

	@IsString()
	@IsOptional()
	spaceId?: string;
}

export class AddMessageDto {
	@IsString()
	@IsNotEmpty()
	sender: 'user' | 'assistant' | 'system';

	@IsString()
	@IsNotEmpty()
	@MaxLength(50000)
	messageText: string;
}

export class UpdateTitleDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(500)
	title: string;
}
