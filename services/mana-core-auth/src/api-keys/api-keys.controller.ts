import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Req,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateApiKeyDto, ValidateApiKeyDto } from './dto';
import { SecurityEventsService, SecurityEventType } from '../security';

@Controller('api-keys')
export class ApiKeysController {
	constructor(
		private readonly apiKeysService: ApiKeysService,
		private readonly securityEvents: SecurityEventsService
	) {}

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
	async createKey(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: CreateApiKeyDto,
		@Req() req: Request
	) {
		const result = await this.apiKeysService.createApiKey(user.userId, dto);

		this.securityEvents.logEventWithRequest(req, {
			userId: user.userId,
			eventType: SecurityEventType.API_KEY_CREATED,
			metadata: { keyId: result.id, name: dto.name, scopes: dto.scopes },
		});

		return result;
	}

	/**
	 * Revoke an API key
	 */
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async revokeKey(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Req() req: Request
	) {
		await this.apiKeysService.revokeApiKey(user.userId, id);

		this.securityEvents.logEventWithRequest(req, {
			userId: user.userId,
			eventType: SecurityEventType.API_KEY_REVOKED,
			metadata: { keyId: id },
		});
	}

	/**
	 * Validate an API key (for internal services like STT/TTS)
	 *
	 * This endpoint does NOT require JWT authentication since it's called
	 * by services that only have an API key, not a JWT.
	 *
	 * Rate limited to 10 requests/minute per IP to prevent brute force.
	 */
	@Post('validate')
	@UseGuards(ThrottlerGuard)
	@Throttle({ default: { ttl: 60000, limit: 10 } })
	@HttpCode(HttpStatus.OK)
	async validateKey(@Body() dto: ValidateApiKeyDto, @Req() req: Request) {
		const result = await this.apiKeysService.validateApiKey(dto.apiKey, dto.scope);

		const eventType = result.valid
			? SecurityEventType.API_KEY_VALIDATED
			: SecurityEventType.API_KEY_VALIDATION_FAILED;

		this.securityEvents.logEventWithRequest(req, {
			userId: result.valid ? result.userId : undefined,
			eventType,
			metadata: {
				scope: dto.scope,
				keyPrefix: dto.apiKey?.substring(0, 16) + '...',
			},
		});

		return result;
	}
}
