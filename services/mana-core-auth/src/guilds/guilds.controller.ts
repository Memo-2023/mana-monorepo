import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Headers,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GuildsService, CreateGuildDto } from './guilds.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { UpdateOrganizationDto } from '../auth/dto/update-organization.dto';

class InviteMemberDto {
	email: string;
	role: 'admin' | 'member';
}

class AcceptInvitationBodyDto {
	invitationId: string;
}

@ApiTags('gilden')
@ApiBearerAuth('JWT-auth')
@Controller('gilden')
@UseGuards(JwtAuthGuard)
export class GuildsController {
	constructor(private readonly guildsService: GuildsService) {}

	private extractToken(authorization: string): string {
		return authorization?.replace('Bearer ', '') || '';
	}

	@Post()
	@ApiOperation({ summary: 'Create a new guild' })
	@ApiResponse({ status: 201, description: 'Guild created with pool initialized' })
	async createGuild(@Headers('authorization') authorization: string, @Body() dto: CreateGuildDto) {
		const token = this.extractToken(authorization);
		return this.guildsService.createGuild(token, dto);
	}

	@Get()
	@ApiOperation({ summary: "List user's guilds" })
	@ApiResponse({ status: 200, description: 'Returns list of guilds with pool balances' })
	async listGuilds(
		@Headers('authorization') authorization: string,
		@CurrentUser() user: CurrentUserData
	) {
		const token = this.extractToken(authorization);
		return this.guildsService.listGuilds(token, user.userId);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get guild details with pool balance and members' })
	@ApiResponse({ status: 200, description: 'Returns guild details' })
	@ApiResponse({ status: 404, description: 'Guild not found' })
	async getGuild(
		@Param('id') id: string,
		@Headers('authorization') authorization: string,
		@CurrentUser() user: CurrentUserData
	) {
		const token = this.extractToken(authorization);
		return this.guildsService.getGuild(id, token, user.userId);
	}

	@Put(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update guild details' })
	@ApiResponse({ status: 200, description: 'Guild updated' })
	@ApiResponse({ status: 403, description: 'Only owners and admins can update' })
	async updateGuild(
		@Param('id') id: string,
		@Headers('authorization') authorization: string,
		@Body() dto: UpdateOrganizationDto
	) {
		const token = this.extractToken(authorization);
		return this.guildsService.updateGuild(id, dto, token);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete guild (cascades to pool)' })
	@ApiResponse({ status: 204, description: 'Guild deleted' })
	@ApiResponse({ status: 403, description: 'Only owners can delete' })
	async deleteGuild(@Param('id') id: string, @Headers('authorization') authorization: string) {
		const token = this.extractToken(authorization);
		await this.guildsService.deleteGuild(id, token);
	}

	@Post(':id/invite')
	@ApiOperation({ summary: 'Invite a member to the guild' })
	@ApiResponse({ status: 200, description: 'Invitation sent' })
	@ApiResponse({ status: 403, description: 'Only owners and admins can invite' })
	async inviteMember(
		@Param('id') guildId: string,
		@Headers('authorization') authorization: string,
		@Body() dto: InviteMemberDto
	) {
		const token = this.extractToken(authorization);
		return this.guildsService.inviteMember(guildId, dto.email, dto.role, token);
	}

	@Post('accept-invitation')
	@ApiOperation({ summary: 'Accept a guild invitation' })
	@ApiResponse({ status: 200, description: 'Invitation accepted' })
	async acceptInvitation(
		@Headers('authorization') authorization: string,
		@Body() dto: AcceptInvitationBodyDto
	) {
		const token = this.extractToken(authorization);
		return this.guildsService.acceptInvitation(dto.invitationId, token);
	}

	@Delete(':id/members/:memberId')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Remove a member from the guild' })
	@ApiResponse({ status: 204, description: 'Member removed' })
	@ApiResponse({ status: 403, description: 'Only owners and admins can remove members' })
	async removeMember(
		@Param('id') guildId: string,
		@Param('memberId') memberId: string,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		await this.guildsService.removeMember(guildId, memberId, token);
	}

	@Put(':id/members/:memberId/role')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update member role' })
	@ApiResponse({ status: 200, description: 'Role updated' })
	@ApiResponse({ status: 403, description: 'Only owners and admins can change roles' })
	async updateMemberRole(
		@Param('id') guildId: string,
		@Param('memberId') memberId: string,
		@Headers('authorization') authorization: string,
		@Body() dto: { role: string }
	) {
		const token = this.extractToken(authorization);
		return this.guildsService.updateMemberRole(guildId, memberId, dto.role, token);
	}
}
