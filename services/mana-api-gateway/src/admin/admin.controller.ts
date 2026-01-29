import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from './admin.service';
import { AdminUpdateKeyDto } from './dto/admin-update-key.dto';

@ApiTags('Admin')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Get('api-keys')
	@ApiOperation({
		summary: 'List all API keys',
		description: 'Returns all API keys in the system. Requires admin role.',
	})
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiQuery({ name: 'userId', required: false, type: String })
	@ApiQuery({ name: 'tier', required: false, enum: ['free', 'pro', 'enterprise'] })
	@ApiQuery({ name: 'active', required: false, type: Boolean })
	@ApiResponse({ status: 200, description: 'List of all API keys' })
	@ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
	async listAllKeys(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('userId') userId?: string,
		@Query('tier') tier?: string,
		@Query('active') active?: string
	) {
		const pageNum = parseInt(page || '1', 10);
		const limitNum = parseInt(limit || '50', 10);
		const isActive = active === undefined ? undefined : active === 'true';

		const result = await this.adminService.listAllKeys({
			page: pageNum,
			limit: limitNum,
			userId,
			tier,
			active: isActive,
		});

		return result;
	}

	@Get('api-keys/:id')
	@ApiOperation({
		summary: 'Get API key details (admin)',
		description: 'Returns full details of any API key including usage stats.',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'API key details with usage' })
	@ApiResponse({ status: 404, description: 'API key not found' })
	async getKey(@Param('id') id: string) {
		return this.adminService.getKeyDetails(id);
	}

	@Patch('api-keys/:id')
	@ApiOperation({
		summary: 'Update API key (admin)',
		description: 'Update any API key including tier, credits, rate limits.',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'API key updated' })
	@ApiResponse({ status: 404, description: 'API key not found' })
	async updateKey(@Param('id') id: string, @Body() dto: AdminUpdateKeyDto) {
		return this.adminService.updateKey(id, dto);
	}

	@Delete('api-keys/:id')
	@ApiOperation({
		summary: 'Delete API key (admin)',
		description: 'Permanently delete any API key.',
	})
	@ApiParam({ name: 'id', description: 'API key ID (UUID)' })
	@ApiResponse({ status: 200, description: 'API key deleted' })
	@ApiResponse({ status: 404, description: 'API key not found' })
	async deleteKey(@Param('id') id: string) {
		await this.adminService.deleteKey(id);
		return { message: 'API key deleted successfully' };
	}

	@Get('usage/summary')
	@ApiOperation({
		summary: 'Get system-wide usage summary',
		description: 'Returns aggregated usage stats for all API keys.',
	})
	@ApiQuery({ name: 'days', required: false, type: Number })
	@ApiResponse({ status: 200, description: 'System usage summary' })
	async getSystemUsage(@Query('days') days?: string) {
		const daysNum = parseInt(days || '30', 10);
		return this.adminService.getSystemUsage(daysNum);
	}

	@Get('usage/top-users')
	@ApiOperation({
		summary: 'Get top users by usage',
		description: 'Returns users with highest API usage.',
	})
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiQuery({ name: 'days', required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Top users by usage' })
	async getTopUsers(@Query('limit') limit?: string, @Query('days') days?: string) {
		const limitNum = parseInt(limit || '10', 10);
		const daysNum = parseInt(days || '30', 10);
		return this.adminService.getTopUsers(limitNum, daysNum);
	}
}
