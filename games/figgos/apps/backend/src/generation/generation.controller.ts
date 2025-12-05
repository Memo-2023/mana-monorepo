import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GenerateFigureDto } from './dto/generate-figure.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('generate')
export class GenerationController {
	constructor(private readonly generationService: GenerationService) {}

	/**
	 * Generate a new figure using AI (auth required)
	 * This endpoint uses OpenAI to generate character info and image
	 */
	@Post('figure')
	@UseGuards(JwtAuthGuard)
	async generateFigure(@Body() dto: GenerateFigureDto, @CurrentUser() user: CurrentUserPayload) {
		return this.generationService.generateFigure(dto, user.userId);
	}
}
