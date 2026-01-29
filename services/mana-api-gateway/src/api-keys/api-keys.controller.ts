import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto';
import { UsageService } from '../usage/usage.service';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
	constructor(
		private readonly apiKeyService: ApiKeysService,
		private readonly usageService: UsageService
	) {}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateApiKeyDto) {
		const result = await this.apiKeyService.create(user.userId, dto);
		return {
			message: 'API key created successfully. Save your key - it will not be shown again.',
			key: result.key,
			apiKey: result.apiKey,
		};
	}

	@Get()
	async list(@CurrentUser() user: CurrentUserData) {
		const keys = await this.apiKeyService.listByUser(user.userId);
		return { apiKeys: keys };
	}

	@Get(':id')
	async get(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const key = await this.apiKeyService.getByIdAndUser(id, user.userId);
		return { apiKey: key };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateApiKeyDto
	) {
		const key = await this.apiKeyService.update(id, user.userId, dto);
		return { apiKey: key };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.apiKeyService.delete(id, user.userId);
		return { message: 'API key deleted successfully' };
	}

	@Post(':id/regenerate')
	async regenerate(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const result = await this.apiKeyService.regenerate(id, user.userId);
		return {
			message: 'API key regenerated successfully. Save your new key - it will not be shown again.',
			key: result.key,
			apiKey: result.apiKey,
		};
	}

	@Get(':id/usage')
	async getUsage(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Query('days') days?: string
	) {
		// Verify ownership
		await this.apiKeyService.getByIdAndUser(id, user.userId);

		const daysNum = parseInt(days || '30', 10);
		const usage = await this.usageService.getDailyUsage(id, daysNum);

		return { usage };
	}

	@Get(':id/usage/summary')
	async getUsageSummary(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		// Verify ownership
		await this.apiKeyService.getByIdAndUser(id, user.userId);

		const summary = await this.usageService.getUsageSummary(id);

		return { summary };
	}
}
