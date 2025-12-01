import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import { ChatService } from './chat.service';
import { ChatCompletionDto, ChatCompletionResponseDto } from './dto/chat-completion.dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get('models')
	async getModels() {
		return this.chatService.getAvailableModels();
	}

	@Post('completions')
	async createCompletion(
		@Body() dto: ChatCompletionDto,
		@CurrentUser() user: CurrentUserData
	): Promise<ChatCompletionResponseDto> {
		const result = await this.chatService.createCompletion(dto, user.userId);

		if (!isOk(result)) {
			throw result.error; // Caught by AppExceptionFilter
		}

		return result.value;
	}
}
