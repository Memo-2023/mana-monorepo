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
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ServiceAuthGuard } from './guards/service-auth.guard';
import { UserDataResponse, DeleteUserDataResponse } from './dto/user-data-response.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(ServiceAuthGuard)
export class AdminController {
	private readonly logger = new Logger(AdminController.name);

	constructor(private readonly adminService: AdminService) {}

	/**
	 * Get user data summary for this backend
	 * Called by mana-core-auth admin service to aggregate cross-project data
	 */
	@Get('user-data/:userId')
	async getUserData(@Param('userId') userId: string): Promise<UserDataResponse> {
		this.logger.log(`Admin request: getUserData for userId=${userId}`);
		return this.adminService.getUserData(userId);
	}

	/**
	 * Delete all user data from this backend (GDPR right to be forgotten)
	 * Called by mana-core-auth admin service during cross-project deletion
	 */
	@Delete('user-data/:userId')
	@HttpCode(HttpStatus.OK)
	async deleteUserData(@Param('userId') userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Admin request: deleteUserData for userId=${userId}`);
		return this.adminService.deleteUserData(userId);
	}
}
