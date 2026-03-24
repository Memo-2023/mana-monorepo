import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { isOk } from '@manacore/shared-errors';
import { ChatService } from './chat.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import type { ChatCompletionResponseDto } from './dto/chat-completion.dto';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';

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
			throw result.error;
		}

		return result.value;
	}

	@Post('completions/stream')
	async createStreamingCompletion(
		@Body() dto: ChatCompletionDto,
		@CurrentUser() user: CurrentUserData,
		@Res() res: Response
	): Promise<void> {
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Accel-Buffering', 'no');

		try {
			for await (const token of this.chatService.createStreamingCompletion(dto, user.userId)) {
				res.write(`data: ${JSON.stringify({ token })}\n\n`);
			}
			res.write('data: [DONE]\n\n');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Stream failed';
			res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
		} finally {
			res.end();
		}
	}
}
