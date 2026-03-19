import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
	constructor(private readonly aiService: AiService) {}

	@Post('generate')
	async generate(
		@CurrentUser() user: CurrentUserData,
		@Body()
		body: {
			prompt: string;
			model?: string;
			temperature?: number;
			maxTokens?: number;
			documentId?: string;
			referencedDocuments?: { title: string; content: string }[];
		}
	) {
		if (!body.prompt) {
			throw new BadRequestException('prompt is required');
		}

		const result = await this.aiService.generate(user.userId, body);
		return result;
	}

	@Post('estimate')
	async estimateCost(
		@CurrentUser() user: CurrentUserData,
		@Body()
		body: {
			prompt: string;
			model?: string;
			estimatedCompletionLength?: number;
			referencedDocuments?: { title: string; content: string }[];
		}
	) {
		const estimate = await this.aiService.estimateCost(user.userId, body);
		return estimate;
	}
}
