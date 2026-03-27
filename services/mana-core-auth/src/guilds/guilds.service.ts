import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { members, organizations } from '../db/schema';
import { BetterAuthService } from '../auth/services/better-auth.service';
import { GuildPoolService } from '../credits/guild-pool.service';
import { InviteEmployeeDto } from '../auth/dto/invite-employee.dto';
import { AcceptInvitationDto } from '../auth/dto/accept-invitation.dto';
import { UpdateOrganizationDto } from '../auth/dto/update-organization.dto';
import { UpdateMemberRoleDto } from '../auth/dto/update-member-role.dto';

export class CreateGuildDto {
	name: string;
	slug?: string;
	logo?: string;
}

@Injectable()
export class GuildsService {
	private readonly logger = new Logger(GuildsService.name);

	constructor(
		private configService: ConfigService,
		private betterAuthService: BetterAuthService,
		private guildPoolService: GuildPoolService
	) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Create a new guild (organization + pool).
	 * Checks subscription limits for maxOrganizations.
	 */
	async createGuild(token: string, dto: CreateGuildDto) {
		// Create organization via Better Auth
		const result = await this.betterAuthService.createOrganizationDirect(token, {
			name: dto.name,
			slug: dto.slug,
			logo: dto.logo,
		});

		// Initialize the guild pool
		const pool = await this.guildPoolService.initializeGuildPool(result.id);

		this.logger.log('Guild created', { guildId: result.id, name: dto.name });

		return {
			gilde: {
				id: result.id,
				name: result.name,
				slug: result.slug,
				logo: result.logo,
				createdAt: result.createdAt,
			},
			pool: {
				balance: pool.balance,
				totalFunded: pool.totalFunded,
				totalSpent: pool.totalSpent,
			},
		};
	}

	/**
	 * List user's guilds with pool balances.
	 */
	async listGuilds(token: string, userId: string) {
		const result = await this.betterAuthService.listOrganizations(token);

		const db = this.getDb();
		const guilds = [];

		for (const org of result.organizations || []) {
			// Get pool balance for each guild
			try {
				const pool = await this.guildPoolService.getGuildPoolBalance(org.id, userId);
				guilds.push({
					gilde: {
						id: org.id,
						name: org.name,
						slug: org.slug,
						logo: org.logo,
						createdAt: org.createdAt,
					},
					pool,
					role: (org as any).role,
				});
			} catch {
				// Pool might not exist for legacy orgs
				guilds.push({
					gilde: {
						id: org.id,
						name: org.name,
						slug: org.slug,
						logo: org.logo,
						createdAt: org.createdAt,
					},
					pool: null,
					role: (org as any).role,
				});
			}
		}

		return { guilds };
	}

	/**
	 * Get guild details with pool balance and members.
	 */
	async getGuild(guildId: string, token: string, userId: string) {
		const org = await this.betterAuthService.getOrganization(guildId, token);
		let pool = null;

		try {
			pool = await this.guildPoolService.getGuildPoolBalance(guildId, userId);
		} catch {
			// Pool might not exist
		}

		return {
			gilde: {
				id: org.id,
				name: org.name,
				slug: org.slug,
				logo: org.logo,
				metadata: org.metadata,
				createdAt: org.createdAt,
			},
			pool,
			members: org.members,
		};
	}

	/**
	 * Update guild details.
	 */
	async updateGuild(guildId: string, dto: UpdateOrganizationDto, token: string) {
		return this.betterAuthService.updateOrganization(guildId, dto, token);
	}

	/**
	 * Delete guild. Pool is cascade-deleted.
	 */
	async deleteGuild(guildId: string, token: string) {
		return this.betterAuthService.deleteOrganization(guildId, token);
	}

	/**
	 * Invite a member to the guild.
	 */
	async inviteMember(guildId: string, email: string, role: string, token: string) {
		return this.betterAuthService.inviteEmployee({
			organizationId: guildId,
			employeeEmail: email,
			role: role as 'admin' | 'member',
			inviterToken: token,
		});
	}

	/**
	 * Accept a guild invitation.
	 */
	async acceptInvitation(invitationId: string, token: string) {
		return this.betterAuthService.acceptInvitation({
			invitationId,
			userToken: token,
		});
	}

	/**
	 * Remove a member from the guild.
	 */
	async removeMember(guildId: string, memberId: string, token: string) {
		return this.betterAuthService.removeMember({
			organizationId: guildId,
			memberId,
			removerToken: token,
		});
	}

	/**
	 * Update a member's role.
	 */
	async updateMemberRole(guildId: string, memberId: string, role: string, token: string) {
		return this.betterAuthService.updateMemberRole(
			guildId,
			memberId,
			role as 'admin' | 'member',
			token
		);
	}
}
