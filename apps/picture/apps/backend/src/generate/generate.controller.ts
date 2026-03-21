import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Query,
	Headers,
	UseGuards,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateService } from './generate.service';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { GenerateImageDto } from './dto/generate.dto';

@Controller('generate')
export class GenerateController {
	private readonly logger = new Logger(GenerateController.name);
	private readonly webhookSecret: string;

	constructor(
		private readonly generateService: GenerateService,
		private readonly configService: ConfigService
	) {
		this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET', 'dev-webhook-secret');
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	async generateImage(@CurrentUser() user: CurrentUserData, @Body() dto: GenerateImageDto) {
		return this.generateService.generateImage(user.userId, dto);
	}

	@Get('credits')
	@UseGuards(JwtAuthGuard)
	async getCreditBalance(@CurrentUser() user: CurrentUserData) {
		return this.generateService.getCreditBalance(user.userId);
	}

	@Get('history')
	@UseGuards(JwtAuthGuard)
	async getGenerationHistory(
		@CurrentUser() user: CurrentUserData,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));

		return this.generateService.getGenerationHistory(user.userId, pageNum, limitNum);
	}

	@Get(':id/status')
	@UseGuards(JwtAuthGuard)
	async checkStatus(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.generateService.checkStatus(id, user.userId);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async cancelGeneration(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.generateService.cancelGeneration(id, user.userId);
	}

	@Post('webhook')
	async handleWebhook(@Body() body: any, @Headers('x-webhook-secret') webhookSecret?: string) {
		if (!webhookSecret || webhookSecret !== this.webhookSecret) {
			this.logger.warn('Webhook request with missing or invalid secret');
			throw new UnauthorizedException('Invalid webhook secret');
		}

		return this.generateService.handleWebhook(body);
	}
}
