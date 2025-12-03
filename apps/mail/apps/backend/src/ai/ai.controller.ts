import { Controller, Post, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AIService } from './ai.service';

@Controller('emails')
@UseGuards(JwtAuthGuard)
export class AIController {
	constructor(private readonly aiService: AIService) {}

	@Post(':id/summarize')
	async summarize(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const result = await this.aiService.summarizeEmail(id, user.userId);
		return result;
	}

	@Post(':id/suggest-replies')
	async suggestReplies(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const result = await this.aiService.suggestReplies(id, user.userId);
		return result;
	}

	@Post(':id/categorize')
	async categorize(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const result = await this.aiService.categorizeEmail(id, user.userId);
		return result;
	}
}
