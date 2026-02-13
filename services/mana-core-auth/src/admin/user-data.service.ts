import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { eq, sql, desc, ilike, or } from 'drizzle-orm';
import { getDb } from '../db/connection';
import * as schema from '../db/schema';
import {
	UserDataSummary,
	ProjectDataSummary,
	DeleteUserDataResponse,
	UserListItem,
	UserListResponse,
} from './dto/user-data.dto';

interface ProjectConfig {
	id: string;
	name: string;
	icon: string;
	url: string;
}

@Injectable()
export class UserDataService {
	private readonly logger = new Logger(UserDataService.name);
	private readonly serviceKey: string;
	private readonly projectConfigs: ProjectConfig[];

	constructor(
		private readonly configService: ConfigService,
		private readonly httpService: HttpService
	) {
		this.serviceKey = this.configService.get<string>('ADMIN_SERVICE_KEY', 'dev-admin-key');

		// Configure backend URLs from environment or use defaults
		this.projectConfigs = this.initProjectConfigs();
	}

	private getDatabase() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	private initProjectConfigs(): ProjectConfig[] {
		return [
			{
				id: 'chat',
				name: 'Chat',
				icon: '💬',
				url: this.configService.get('CHAT_BACKEND_URL', 'http://localhost:3002'),
			},
			{
				id: 'todo',
				name: 'Todo',
				icon: '✅',
				url: this.configService.get('TODO_BACKEND_URL', 'http://localhost:3018'),
			},
			{
				id: 'contacts',
				name: 'Contacts',
				icon: '👥',
				url: this.configService.get('CONTACTS_BACKEND_URL', 'http://localhost:3015'),
			},
			{
				id: 'calendar',
				name: 'Calendar',
				icon: '📅',
				url: this.configService.get('CALENDAR_BACKEND_URL', 'http://localhost:3014'),
			},
			{
				id: 'picture',
				name: 'Picture',
				icon: '🎨',
				url: this.configService.get('PICTURE_BACKEND_URL', 'http://localhost:3006'),
			},
			{
				id: 'zitare',
				name: 'Zitare',
				icon: '💡',
				url: this.configService.get('ZITARE_BACKEND_URL', 'http://localhost:3007'),
			},
			{
				id: 'presi',
				name: 'Presi',
				icon: '📊',
				url: this.configService.get('PRESI_BACKEND_URL', 'http://localhost:3008'),
			},
			{
				id: 'photos',
				name: 'Photos',
				icon: '📷',
				url: this.configService.get('PHOTOS_BACKEND_URL', 'http://localhost:3019'),
			},
			{
				id: 'clock',
				name: 'Clock',
				icon: '⏰',
				url: this.configService.get('CLOCK_BACKEND_URL', 'http://localhost:3017'),
			},
			{
				id: 'storage',
				name: 'Storage',
				icon: '💾',
				url: this.configService.get('STORAGE_BACKEND_URL', 'http://localhost:3016'),
			},
		];
	}

	/**
	 * Get list of all users with pagination
	 */
	async getUsers(page: number = 1, limit: number = 20, search?: string): Promise<UserListResponse> {
		const db = this.getDatabase();
		const offset = (page - 1) * limit;

		// Build base query
		const baseConditions = search
			? or(ilike(schema.users.email, `%${search}%`), ilike(schema.users.name, `%${search}%`))
			: undefined;

		const [users, countResult] = await Promise.all([
			db
				.select()
				.from(schema.users)
				.where(baseConditions)
				.orderBy(desc(schema.users.createdAt))
				.limit(limit)
				.offset(offset),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.users)
				.where(baseConditions),
		]);

		// Get last session for each user
		const userIds = users.map((user: typeof schema.users.$inferSelect) => user.id);
		const lastSessions =
			userIds.length > 0
				? await db
						.select({
							odriUserId: schema.sessions.userId,
							lastActivityAt: sql<Date>`MAX(${schema.sessions.lastActivityAt})`,
						})
						.from(schema.sessions)
						.where(sql`${schema.sessions.userId} IN (${sql.join(userIds, sql`, `)})`)
						.groupBy(schema.sessions.userId)
				: [];

		const sessionMap = new Map(
			lastSessions.map((session) => [session.odriUserId, session.lastActivityAt])
		);

		const userList: UserListItem[] = users.map((user: typeof schema.users.$inferSelect) => ({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			createdAt: user.createdAt.toISOString(),
			lastActiveAt: sessionMap.get(user.id)?.toISOString(),
		}));

		return {
			users: userList,
			total: countResult[0]?.count ?? 0,
			page,
			limit,
		};
	}

	/**
	 * Get aggregated user data from all projects
	 */
	async getUserDataSummary(userId: string): Promise<UserDataSummary> {
		const db = this.getDatabase();
		this.logger.log(`Getting user data summary for userId: ${userId}`);

		// Get user data from local DB
		const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

		if (!user.length) {
			throw new NotFoundException(`User ${userId} not found`);
		}

		// Get auth data
		const [sessionsCount, accountsCount, has2FA, lastSession] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.sessions)
				.where(eq(schema.sessions.userId, userId)),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.accounts)
				.where(eq(schema.accounts.userId, userId)),
			db
				.select()
				.from(schema.twoFactorAuth)
				.where(eq(schema.twoFactorAuth.userId, userId))
				.limit(1),
			db
				.select({ lastActivityAt: schema.sessions.lastActivityAt })
				.from(schema.sessions)
				.where(eq(schema.sessions.userId, userId))
				.orderBy(desc(schema.sessions.lastActivityAt))
				.limit(1),
		]);

		// Get credits data
		const creditsResult = await db
			.select()
			.from(schema.balances)
			.where(eq(schema.balances.userId, userId))
			.limit(1);

		const transactionsCount = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.transactions)
			.where(eq(schema.transactions.userId, userId));

		const credits = creditsResult[0];

		// Query all backends in parallel
		const projectResults = await Promise.all(
			this.projectConfigs.map((config) => this.queryBackend(config, userId))
		);

		// Calculate totals
		const totalEntities = projectResults.reduce(
			(sum, p) => sum + (p.available ? p.totalCount : 0),
			0
		);
		const projectsWithData = projectResults.filter((p) => p.available && p.totalCount > 0).length;

		return {
			user: {
				id: user[0].id,
				email: user[0].email,
				name: user[0].name,
				role: user[0].role,
				createdAt: user[0].createdAt.toISOString(),
				emailVerified: user[0].emailVerified,
			},
			auth: {
				sessionsCount: sessionsCount[0]?.count ?? 0,
				accountsCount: accountsCount[0]?.count ?? 0,
				has2FA: has2FA.length > 0,
				lastLoginAt: lastSession[0]?.lastActivityAt?.toISOString() ?? null,
			},
			credits: {
				balance: credits?.balance ?? 0,
				totalEarned: credits?.totalEarned ?? 0,
				totalSpent: credits?.totalSpent ?? 0,
				transactionsCount: transactionsCount[0]?.count ?? 0,
			},
			projects: projectResults,
			totals: {
				totalEntities,
				projectsWithData,
			},
		};
	}

	/**
	 * Delete all user data across all projects (GDPR)
	 */
	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		const db = this.getDatabase();
		this.logger.log(`Deleting all user data for userId: ${userId}`);

		// Verify user exists
		const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

		if (!user.length) {
			throw new NotFoundException(`User ${userId} not found`);
		}

		// Delete from all backends in parallel
		const projectResults = await Promise.all(
			this.projectConfigs.map(async (config) => {
				try {
					const response = await firstValueFrom(
						this.httpService.delete(`${config.url}/api/v1/admin/user-data/${userId}`, {
							headers: { 'X-Service-Key': this.serviceKey },
							timeout: 10000,
						})
					);
					return {
						projectId: config.id,
						projectName: config.name,
						success: true,
						deletedCount: response.data?.totalDeleted ?? 0,
					};
				} catch (error: any) {
					this.logger.warn(`Failed to delete data from ${config.name}: ${error.message}`);
					return {
						projectId: config.id,
						projectName: config.name,
						success: false,
						error: error.message,
					};
				}
			})
		);

		// Delete from local auth tables
		const [deletedSessions, deletedAccounts, deletedTransactions] = await Promise.all([
			db.delete(schema.sessions).where(eq(schema.sessions.userId, userId)).returning(),
			db.delete(schema.accounts).where(eq(schema.accounts.userId, userId)).returning(),
			db.delete(schema.transactions).where(eq(schema.transactions.userId, userId)).returning(),
		]);

		// Delete credits balance
		await db.delete(schema.balances).where(eq(schema.balances.userId, userId));

		// Delete 2FA
		await db.delete(schema.twoFactorAuth).where(eq(schema.twoFactorAuth.userId, userId));

		// Soft delete user (or hard delete if preferred)
		await db.update(schema.users).set({ deletedAt: new Date() }).where(eq(schema.users.id, userId));

		const totalFromProjects = projectResults
			.filter((p) => p.success)
			.reduce((sum, p) => sum + (p.deletedCount ?? 0), 0);

		return {
			success: true,
			deletedFromProjects: projectResults,
			deletedFromAuth: {
				sessions: deletedSessions.length,
				accounts: deletedAccounts.length,
				credits: deletedTransactions.length,
				user: true,
			},
			totalDeleted:
				totalFromProjects +
				deletedSessions.length +
				deletedAccounts.length +
				deletedTransactions.length,
		};
	}

	/**
	 * Get full export data including sessions, security events, and transactions
	 */
	async getFullExportData(userId: string) {
		const summary = await this.getUserDataSummary(userId);

		// Get additional details for export
		const [sessions, securityEvents, transactions] = await Promise.all([
			this.getSessionHistory(userId),
			this.getSecurityEvents(userId),
			this.getTransactionHistory(userId),
		]);

		return {
			...summary,
			exportedAt: new Date().toISOString(),
			exportVersion: '2.0',
			sessions: {
				active: sessions.filter((s) => !s.revokedAt && new Date(s.expiresAt) > new Date()),
				history: sessions,
			},
			securityEvents,
			creditTransactions: transactions,
		};
	}

	/**
	 * Get session history for a user
	 */
	private async getSessionHistory(userId: string) {
		const db = this.getDatabase();

		return db
			.select({
				id: schema.sessions.id,
				createdAt: schema.sessions.createdAt,
				expiresAt: schema.sessions.expiresAt,
				lastActivityAt: schema.sessions.lastActivityAt,
				ipAddress: schema.sessions.ipAddress,
				userAgent: schema.sessions.userAgent,
				deviceName: schema.sessions.deviceName,
				revokedAt: schema.sessions.revokedAt,
			})
			.from(schema.sessions)
			.where(eq(schema.sessions.userId, userId))
			.orderBy(desc(schema.sessions.createdAt))
			.limit(100);
	}

	/**
	 * Get security events for a user
	 */
	private async getSecurityEvents(userId: string) {
		const db = this.getDatabase();

		return db
			.select({
				id: schema.securityEvents.id,
				eventType: schema.securityEvents.eventType,
				ipAddress: schema.securityEvents.ipAddress,
				userAgent: schema.securityEvents.userAgent,
				metadata: schema.securityEvents.metadata,
				createdAt: schema.securityEvents.createdAt,
			})
			.from(schema.securityEvents)
			.where(eq(schema.securityEvents.userId, userId))
			.orderBy(desc(schema.securityEvents.createdAt))
			.limit(100);
	}

	/**
	 * Get transaction history for a user
	 */
	private async getTransactionHistory(userId: string) {
		const db = this.getDatabase();

		return db
			.select({
				id: schema.transactions.id,
				type: schema.transactions.type,
				status: schema.transactions.status,
				amount: schema.transactions.amount,
				balanceBefore: schema.transactions.balanceBefore,
				balanceAfter: schema.transactions.balanceAfter,
				appId: schema.transactions.appId,
				description: schema.transactions.description,
				createdAt: schema.transactions.createdAt,
				completedAt: schema.transactions.completedAt,
			})
			.from(schema.transactions)
			.where(eq(schema.transactions.userId, userId))
			.orderBy(desc(schema.transactions.createdAt));
	}

	/**
	 * Get user data for email (before deletion)
	 */
	async getUserForEmail(userId: string) {
		const db = this.getDatabase();

		const user = await db
			.select({
				email: schema.users.email,
				name: schema.users.name,
			})
			.from(schema.users)
			.where(eq(schema.users.id, userId))
			.limit(1);

		return user[0] || null;
	}

	/**
	 * Query a single backend for user data
	 */
	private async queryBackend(config: ProjectConfig, userId: string): Promise<ProjectDataSummary> {
		try {
			const response = await firstValueFrom(
				this.httpService.get(`${config.url}/api/v1/admin/user-data/${userId}`, {
					headers: { 'X-Service-Key': this.serviceKey },
					timeout: 5000,
				})
			);

			return {
				projectId: config.id,
				projectName: config.name,
				icon: config.icon,
				available: true,
				entities: response.data.entities || [],
				totalCount: response.data.totalCount || 0,
				lastActivityAt: response.data.lastActivityAt,
			};
		} catch (error: any) {
			this.logger.warn(`Backend ${config.name} unavailable: ${error.message}`);
			return {
				projectId: config.id,
				projectName: config.name,
				icon: config.icon,
				available: false,
				error: error.code === 'ECONNREFUSED' ? 'Backend offline' : error.message,
				entities: [],
				totalCount: 0,
			};
		}
	}
}
