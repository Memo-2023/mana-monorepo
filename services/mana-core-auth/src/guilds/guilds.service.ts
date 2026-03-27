import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { members, organizations } from '../db/schema';
import { subscriptions, plans } from '../db/schema/subscriptions.schema';
import { BetterAuthService } from '../auth/services/better-auth.service';
import { GuildPoolService } from '../credits/guild-pool.service';
import { UpdateOrganizationDto } from '../auth/dto/update-organization.dto';

export class CreateGuildDto {
	name: string;
	slug?: string;
	logo?: string;
}

// Default limits for users without a subscription (free tier)
const FREE_TIER_LIMITS = {
	maxOrganizations: 1,
	maxTeamMembers: 1, // Just themselves
};

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
	 * Get the user's subscription plan limits.
	 * Falls back to free tier defaults if no active subscription.
	 */
	private async getUserPlanLimits(userId: string) {
		const db = this.getDb();

		const [sub] = await db
			.select({
				maxTeamMembers: plans.maxTeamMembers,
				maxOrganizations: plans.maxOrganizations,
			})
			.from(subscriptions)
			.innerJoin(plans, eq(subscriptions.planId, plans.id))
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
			.limit(1);

		return {
			maxOrganizations: sub?.maxOrganizations ?? FREE_TIER_LIMITS.maxOrganizations,
			maxTeamMembers: sub?.maxTeamMembers ?? FREE_TIER_LIMITS.maxTeamMembers,
		};
	}

	/**
	 * Count how many guilds/organizations the user owns.
	 */
	private async countUserOwnedGuilds(userId: string): Promise<number> {
		const db = this.getDb();

		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(members)
			.where(and(eq(members.userId, userId), eq(members.role, 'owner')));

		return Number(result.count);
	}

	/**
	 * Count current members of a guild.
	 */
	private async countGuildMembers(guildId: string): Promise<number> {
		const db = this.getDb();

		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(members)
			.where(eq(members.organizationId, guildId));

		return Number(result.count);
	}

	/**
	 * Create a new guild (organization + pool).
	 * Enforces subscription limit for maxOrganizations.
	 */
	async createGuild(token: string, userId: string, dto: CreateGuildDto) {
		// Check subscription limit
		const limits = await this.getUserPlanLimits(userId);
		const ownedGuilds = await this.countUserOwnedGuilds(userId);

		if (limits.maxOrganizations !== null && ownedGuilds >= limits.maxOrganizations) {
			throw new BadRequestException(
				`Guild limit reached. Your plan allows ${limits.maxOrganizations} guild(s). Upgrade to create more.`
			);
		}

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

		const guilds = [];

		for (const org of result.organizations || []) {
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
	 * Enforces subscription limit for maxTeamMembers.
	 */
	async inviteMember(guildId: string, email: string, role: string, inviterUserId: string, token: string) {
		// Find guild owner to check their subscription limits
		const db = this.getDb();
		const [owner] = await db
			.select()
			.from(members)
			.where(and(eq(members.organizationId, guildId), eq(members.role, 'owner')))
			.limit(1);

		if (owner) {
			const limits = await this.getUserPlanLimits(owner.userId);
			const memberCount = await this.countGuildMembers(guildId);

			if (limits.maxTeamMembers !== null && memberCount >= limits.maxTeamMembers) {
				throw new BadRequestException(
					`Member limit reached. The guild owner's plan allows ${limits.maxTeamMembers} member(s). Upgrade to invite more.`
				);
			}
		}

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
