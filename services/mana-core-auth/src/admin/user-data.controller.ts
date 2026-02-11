import {
	Controller,
	Get,
	Delete,
	Param,
	Query,
	UseGuards,
	Logger,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { UserDataService } from './user-data.service';
import { AdminGuard } from './guards/admin.guard';
import { UserDataSummary, DeleteUserDataResponse, UserListResponse } from './dto/user-data.dto';

/**
 * Admin controller for cross-project user data management
 * All endpoints require admin authentication (role=admin or in ADMIN_USER_IDS)
 */
@Controller('api/v1/admin')
@UseGuards(AdminGuard)
export class UserDataController {
	private readonly logger = new Logger(UserDataController.name);

	constructor(private readonly userDataService: UserDataService) {}

	/**
	 * List all users with pagination and search
	 * GET /api/v1/admin/users?page=1&limit=20&search=email
	 */
	@Get('users')
	async getUsers(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string
	): Promise<UserListResponse> {
		const pageNum = parseInt(page || '1', 10);
		const limitNum = Math.min(parseInt(limit || '20', 10), 100);

		this.logger.log(
			`Admin request: getUsers page=${pageNum} limit=${limitNum} search=${search || ''}`
		);
		return this.userDataService.getUsers(pageNum, limitNum, search);
	}

	/**
	 * Get aggregated user data from all projects
	 * GET /api/v1/admin/users/:userId/data
	 */
	@Get('users/:userId/data')
	async getUserData(@Param('userId') userId: string): Promise<UserDataSummary> {
		this.logger.log(`Admin request: getUserData for userId=${userId}`);
		return this.userDataService.getUserDataSummary(userId);
	}

	/**
	 * Delete all user data across all projects (GDPR right to be forgotten)
	 * DELETE /api/v1/admin/users/:userId/data
	 */
	@Delete('users/:userId/data')
	@HttpCode(HttpStatus.OK)
	async deleteUserData(@Param('userId') userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Admin request: deleteUserData for userId=${userId}`);
		return this.userDataService.deleteUserData(userId);
	}
}
