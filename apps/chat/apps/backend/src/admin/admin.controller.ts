import {
	Controller,
	Get,
	Delete,
	Param,
	UseGuards,
	Logger,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ServiceAuthGuard } from './guards/service-auth.guard';
import { UserDataResponse, DeleteUserDataResponse } from './dto/user-data-response.dto';

/**
 * Admin controller for user data queries
 * Used by mana-core-auth aggregation service
 * Protected by X-Service-Key authentication
 */
@Controller('admin')
@UseGuards(ServiceAuthGuard)
export class AdminController {
	private readonly logger = new Logger(AdminController.name);

	constructor(private readonly adminService: AdminService) {}

	/**
	 * Get user data counts for a specific user
	 * GET /api/v1/admin/user-data/:userId
	 */
	@Get('user-data/:userId')
	async getUserData(@Param('userId') userId: string): Promise<UserDataResponse> {
		this.logger.log(`Admin request: getUserData for userId=${userId}`);
		return this.adminService.getUserData(userId);
	}

	/**
	 * Delete all user data (GDPR right to be forgotten)
	 * DELETE /api/v1/admin/user-data/:userId
	 */
	@Delete('user-data/:userId')
	@HttpCode(HttpStatus.OK)
	async deleteUserData(@Param('userId') userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Admin request: deleteUserData for userId=${userId}`);
		return this.adminService.deleteUserData(userId);
	}
}
