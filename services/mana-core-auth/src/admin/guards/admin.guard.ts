import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	ForbiddenException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { BetterAuthService } from '../../auth/services/better-auth.service';

/**
 * Guard for admin-only endpoints
 * Checks JWT token and verifies user has admin role or is in ADMIN_USER_IDS
 */
@Injectable()
export class AdminGuard implements CanActivate {
	private readonly logger = new Logger(AdminGuard.name);
	private readonly adminUserIds: string[];

	constructor(
		private readonly configService: ConfigService,
		private readonly betterAuthService: BetterAuthService
	) {
		const adminIds = this.configService.get<string>('ADMIN_USER_IDS', '');
		this.adminUserIds = adminIds ? adminIds.split(',').map((id) => id.trim()) : [];
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			this.logger.warn('Missing or invalid Authorization header');
			throw new UnauthorizedException('Missing authorization token');
		}

		const token = authHeader.substring(7);

		try {
			// Validate JWT using Better Auth
			const result = await this.betterAuthService.validateToken(token);

			if (!result.valid || !result.payload) {
				throw new UnauthorizedException('Invalid token');
			}

			const userId = result.payload.sub;
			const userRole = result.payload.role;

			// Check if user is admin (by role or by explicit ID)
			const isAdmin = userRole === 'admin' || this.adminUserIds.includes(userId);

			if (!isAdmin) {
				this.logger.warn(`User ${userId} attempted admin access without permission`);
				throw new ForbiddenException('Admin access required');
			}

			// Attach user info to request
			(request as any).user = result.payload;

			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Token validation error: ${error.message}`);
			throw new UnauthorizedException('Token validation failed');
		}
	}
}
