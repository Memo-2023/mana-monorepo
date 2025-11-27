import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import { SpaceService } from './space.service';
import { type Space, type SpaceMember } from '../db/schema/spaces.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpaceController {
	constructor(private readonly spaceService: SpaceService) {}

	@Get()
	async getUserSpaces(@CurrentUser() user: CurrentUserData): Promise<Space[]> {
		const result = await this.spaceService.getUserSpaces(user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get('owned')
	async getOwnedSpaces(@CurrentUser() user: CurrentUserData): Promise<Space[]> {
		const result = await this.spaceService.getOwnedSpaces(user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get('invitations')
	async getPendingInvitations(
		@CurrentUser() user: CurrentUserData
	): Promise<Array<{ invitation: SpaceMember; space: Space }>> {
		const result = await this.spaceService.getPendingInvitations(user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get(':id')
	async getSpace(@Param('id') id: string): Promise<Space> {
		const result = await this.spaceService.getSpace(id);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get(':id/members')
	async getSpaceMembers(@Param('id') id: string): Promise<SpaceMember[]> {
		const result = await this.spaceService.getSpaceMembers(id);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get(':id/role')
	async getUserRoleInSpace(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<{ role: 'owner' | 'admin' | 'member' | 'viewer' | null }> {
		const result = await this.spaceService.getUserRoleInSpace(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return { role: result.value };
	}

	@Post()
	async createSpace(
		@Body() body: { name: string; description?: string },
		@CurrentUser() user: CurrentUserData
	): Promise<Space> {
		const result = await this.spaceService.createSpace(user.userId, body.name, body.description);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Patch(':id')
	async updateSpace(
		@Param('id') id: string,
		@Body() body: { name?: string; description?: string; isArchived?: boolean },
		@CurrentUser() user: CurrentUserData
	): Promise<Space> {
		const result = await this.spaceService.updateSpace(id, user.userId, body);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Delete(':id')
	async deleteSpace(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<{ success: boolean }> {
		const result = await this.spaceService.deleteSpace(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return { success: true };
	}

	@Post(':id/invite')
	async inviteUser(
		@Param('id') id: string,
		@Body() body: { userId: string; role?: 'admin' | 'member' | 'viewer' },
		@CurrentUser() user: CurrentUserData
	): Promise<SpaceMember> {
		const result = await this.spaceService.inviteUserToSpace(
			id,
			body.userId,
			user.userId,
			body.role
		);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Post(':id/respond')
	async respondToInvitation(
		@Param('id') id: string,
		@Body() body: { status: 'accepted' | 'declined' },
		@CurrentUser() user: CurrentUserData
	): Promise<SpaceMember> {
		const result = await this.spaceService.respondToInvitation(id, user.userId, body.status);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Delete(':id/members/:userId')
	async removeMember(
		@Param('id') id: string,
		@Param('userId') userId: string,
		@CurrentUser() user: CurrentUserData
	): Promise<{ success: boolean }> {
		const result = await this.spaceService.removeMember(id, userId, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return { success: true };
	}

	@Patch(':id/members/:userId/role')
	async changeMemberRole(
		@Param('id') id: string,
		@Param('userId') userId: string,
		@Body() body: { role: 'admin' | 'member' | 'viewer' },
		@CurrentUser() user: CurrentUserData
	): Promise<SpaceMember> {
		const result = await this.spaceService.changeMemberRole(id, userId, body.role, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}
}
