import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateApiKeyDto, ValidateApiKeyDto } from './dto';

@Controller('api-keys')
export class ApiKeysController {
	constructor(private readonly apiKeysService: ApiKeysService) {}

	/**
	 * List all API keys for the authenticated user
	 */
	@Get()
	@UseGuards(JwtAuthGuard)
	async listKeys(@CurrentUser() user: CurrentUserData) {
		return this.apiKeysService.listUserApiKeys(user.userId);
	}

	/**
	 * Create a new API key
	 * Returns the full key only once - it cannot be retrieved later
	 */
	@Post()
	@UseGuards(JwtAuthGuard)
	async createKey(@CurrentUser() user: CurrentUserData, @Body() dto: CreateApiKeyDto) {
		return this.apiKeysService.createApiKey(user.userId, dto);
	}

	/**
	 * Revoke an API key
	 */
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async revokeKey(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.apiKeysService.revokeApiKey(user.userId, id);
	}

	/**
	 * Validate an API key (for STT/TTS services)
	 * This endpoint does NOT require JWT authentication
	 */
	@Post('validate')
	async validateKey(@Body() dto: ValidateApiKeyDto) {
		return this.apiKeysService.validateApiKey(dto.apiKey, dto.scope);
	}
}
