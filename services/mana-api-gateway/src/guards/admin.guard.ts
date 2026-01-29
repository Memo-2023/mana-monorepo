import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
	private readonly adminUserIds: string[];

	constructor(private readonly configService: ConfigService) {
		// Admin user IDs from environment variable (comma-separated)
		const adminIds = this.configService.get<string>('admin.userIds') || '';
		this.adminUserIds = adminIds
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);
	}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user || !user.userId) {
			throw new ForbiddenException('User not authenticated');
		}

		// Check if user has admin role
		if (user.role === 'admin') {
			return true;
		}

		// Check if user ID is in the admin list
		if (this.adminUserIds.includes(user.userId)) {
			return true;
		}

		throw new ForbiddenException('Admin access required');
	}
}
