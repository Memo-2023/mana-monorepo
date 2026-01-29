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
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto';
import { UsageService } from '../usage/usage.service';

@ApiTags('API Keys')
@ApiBearerAuth('jwt')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
	constructor(
		private readonly apiKeyService: ApiKeysService,
		private readonly usageService: UsageService
	) {}

	@Post()
	@ApiOperation({
		summary: 'Create API key',
		description: 'Creates a new API key. The full key is only returned once - save it securely.',
	})
	@ApiResponse({ status: 201, description: 'API key created successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateApiKeyDto) {
		const result = await this.apiKeyService.create(user.userId, dto);
		return {
			message: 'API key created successfully. Save your key - it will not be shown again.',
			key: result.key,
			apiKey: result.apiKey,
		};
	}

	@Get()
	@ApiOperation({
		summary: 'List API keys',
		description: 'Returns all API keys for the authenticated user (without full key values)',
	})
	@ApiResponse({ status: 200, description: 'List of API keys' })
	async list(@CurrentUser() user: CurrentUserData) {
		const keys = await this.apiKeyService.listByUser(user.userId);
		return { apiKeys: keys };
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get API key details',
		description: 'Returns details for a specific API key',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'API key details' })
	@ApiResponse({ status: 404, description: 'API key not found' })
	async get(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const key = await this.apiKeyService.getByIdAndUser(id, user.userId);
		return { apiKey: key };
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Update API key',
		description: 'Updates name, description, allowed endpoints, IP whitelist, or active status',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'API key updated successfully' })
	@ApiResponse({ status: 404, description: 'API key not found' })
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateApiKeyDto
	) {
		const key = await this.apiKeyService.update(id, user.userId, dto);
		return { apiKey: key };
	}

	@Delete(':id')
	@ApiOperation({
		summary: 'Delete API key',
		description: 'Permanently deletes an API key. This action cannot be undone.',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'API key deleted successfully' })
	@ApiResponse({ status: 404, description: 'API key not found' })
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.apiKeyService.delete(id, user.userId);
		return { message: 'API key deleted successfully' };
	}

	@Post(':id/regenerate')
	@ApiOperation({
		summary: 'Regenerate API key',
		description:
			'Generates a new key value for an existing API key. The old key immediately stops working.',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'New key generated successfully' })
	@ApiResponse({ status: 404, description: 'API key not found' })
	async regenerate(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const result = await this.apiKeyService.regenerate(id, user.userId);
		return {
			message: 'API key regenerated successfully. Save your new key - it will not be shown again.',
			key: result.key,
			apiKey: result.apiKey,
		};
	}

	@Get(':id/usage')
	@ApiOperation({
		summary: 'Get daily usage',
		description: 'Returns daily usage statistics for an API key',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiQuery({ name: 'days', required: false, description: 'Number of days (default: 30)' })
	@ApiResponse({ status: 200, description: 'Daily usage statistics' })
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
	@ApiOperation({
		summary: 'Get usage summary',
		description: 'Returns aggregated usage summary for an API key',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'Usage summary' })
	async getUsageSummary(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		// Verify ownership
		await this.apiKeyService.getByIdAndUser(id, user.userId);

		const summary = await this.usageService.getUsageSummary(id);

		return { summary };
	}
}
