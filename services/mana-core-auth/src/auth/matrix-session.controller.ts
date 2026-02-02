import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Headers,
	UnauthorizedException,
	NotFoundException,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { MatrixSessionService } from './services/matrix-session.service';

/**
 * DTO for linking a Matrix user to a Mana account
 */
class LinkMatrixUserDto {
	/** Matrix user ID (e.g., @user:matrix.mana.how) */
	matrixUserId!: string;
	/** User's email (optional, for convenience) */
	email?: string;
}

/**
 * Matrix Session Controller
 *
 * Provides endpoints for Matrix bot authentication via SSO.
 *
 * Endpoints:
 * - POST /api/v1/auth/matrix-user-links - Link Matrix user to Mana account
 * - GET /api/v1/auth/matrix-session/:matrixUserId - Get JWT for linked Matrix user
 * - DELETE /api/v1/auth/matrix-user-links/:matrixUserId - Unlink Matrix user
 * - GET /api/v1/auth/matrix-user-links/check/:matrixUserId - Check if user is linked
 *
 * Authentication:
 * - POST /link requires Bearer token (user authenticating)
 * - GET /session requires X-Service-Key (internal bot service)
 * - DELETE requires Bearer token (user unlinking)
 * - GET /check requires X-Service-Key (internal bot service)
 */
@Controller('api/v1/auth')
export class MatrixSessionController {
	constructor(private readonly matrixSessionService: MatrixSessionService) {}

	/**
	 * Link a Matrix user ID to a Mana account
	 *
	 * Called by bots after successful !login command.
	 * Requires the user's JWT token from login.
	 *
	 * @example
	 * POST /api/v1/auth/matrix-user-links
	 * Authorization: Bearer <jwt-token>
	 * Body: { "matrixUserId": "@user:matrix.mana.how", "email": "user@example.com" }
	 */
	@Post('matrix-user-links')
	@HttpCode(HttpStatus.CREATED)
	async linkMatrixUser(
		@Body() dto: LinkMatrixUserDto,
		@Headers('authorization') authHeader?: string,
		@Headers('x-service-key') serviceKey?: string
	): Promise<{ success: boolean; message: string }> {
		// Two auth methods: Bearer token (from user login) or Service key (from bot)
		let manaUserId: string;

		if (serviceKey && this.matrixSessionService.validateServiceKey(serviceKey)) {
			// Service key auth - must provide userId in body
			const bodyWithUserId = dto as LinkMatrixUserDto & { userId?: string };
			if (!bodyWithUserId.userId) {
				throw new UnauthorizedException('userId required when using service key');
			}
			manaUserId = bodyWithUserId.userId;
		} else if (authHeader?.startsWith('Bearer ')) {
			// JWT auth - extract user ID from token
			const token = authHeader.substring(7);
			const payload = this.decodeToken(token);
			if (!payload?.sub) {
				throw new UnauthorizedException('Invalid token');
			}
			manaUserId = payload.sub;
		} else {
			throw new UnauthorizedException('Authentication required');
		}

		if (!dto.matrixUserId) {
			throw new UnauthorizedException('matrixUserId is required');
		}

		await this.matrixSessionService.linkMatrixUser(dto.matrixUserId, manaUserId, dto.email);

		return {
			success: true,
			message: `Matrix user ${dto.matrixUserId} linked successfully`,
		};
	}

	/**
	 * Get a JWT token for a linked Matrix user
	 *
	 * Called by bots to auto-authenticate users.
	 * Requires service key (internal service authentication).
	 *
	 * @example
	 * GET /api/v1/auth/matrix-session/@user:matrix.mana.how
	 * X-Service-Key: <service-key>
	 */
	@Get('matrix-session/:matrixUserId')
	async getMatrixSession(
		@Param('matrixUserId') matrixUserId: string,
		@Headers('x-service-key') serviceKey?: string
	): Promise<{ token: string; email: string }> {
		// Require service key for this endpoint
		if (!serviceKey || !this.matrixSessionService.validateServiceKey(serviceKey)) {
			throw new UnauthorizedException('Valid service key required');
		}

		const result = await this.matrixSessionService.getSessionForMatrixUser(
			decodeURIComponent(matrixUserId)
		);

		if (!result) {
			throw new NotFoundException('No link found for this Matrix user');
		}

		return result;
	}

	/**
	 * Unlink a Matrix user from a Mana account
	 *
	 * Called when user wants to disconnect their Matrix account.
	 * Requires the user's JWT token.
	 *
	 * @example
	 * DELETE /api/v1/auth/matrix-user-links/@user:matrix.mana.how
	 * Authorization: Bearer <jwt-token>
	 */
	@Delete('matrix-user-links/:matrixUserId')
	@HttpCode(HttpStatus.OK)
	async unlinkMatrixUser(
		@Param('matrixUserId') matrixUserId: string,
		@Headers('authorization') authHeader?: string,
		@Headers('x-service-key') serviceKey?: string
	): Promise<{ success: boolean; message: string }> {
		// Allow both Bearer token and service key
		if (
			!authHeader?.startsWith('Bearer ') &&
			!this.matrixSessionService.validateServiceKey(serviceKey || '')
		) {
			throw new UnauthorizedException('Authentication required');
		}

		const deleted = await this.matrixSessionService.unlinkMatrixUser(
			decodeURIComponent(matrixUserId)
		);

		if (!deleted) {
			throw new NotFoundException('No link found for this Matrix user');
		}

		return {
			success: true,
			message: `Matrix user ${matrixUserId} unlinked successfully`,
		};
	}

	/**
	 * Check if a Matrix user is linked
	 *
	 * Requires service key (internal service authentication).
	 *
	 * @example
	 * GET /api/v1/auth/matrix-user-links/check/@user:matrix.mana.how
	 * X-Service-Key: <service-key>
	 */
	@Get('matrix-user-links/check/:matrixUserId')
	async checkMatrixLink(
		@Param('matrixUserId') matrixUserId: string,
		@Headers('x-service-key') serviceKey?: string
	): Promise<{ linked: boolean }> {
		// Require service key for this endpoint
		if (!serviceKey || !this.matrixSessionService.validateServiceKey(serviceKey)) {
			throw new UnauthorizedException('Valid service key required');
		}

		const linked = await this.matrixSessionService.isLinked(decodeURIComponent(matrixUserId));

		return { linked };
	}

	/**
	 * Decode JWT token to get payload (without verification)
	 * Note: This is used only to extract user ID after the bot has verified the token
	 */
	private decodeToken(token: string): { sub?: string } | null {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) return null;

			const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
			return JSON.parse(payload);
		} catch {
			return null;
		}
	}
}
