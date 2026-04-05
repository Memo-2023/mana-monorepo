/**
 * User Data Aggregation Service
 *
 * Aggregates user data from auth DB, mana-credits, and mana-sync
 * for GDPR self-service (/me) and admin endpoints.
 */

import { eq, sql, and, count, isNull, desc, ilike, or } from 'drizzle-orm';
import type { Database } from '../db/connection';
import type { Config } from '../config';
import {
	users,
	sessions,
	accounts,
	twoFactorAuth,
	passkeys,
	securityEvents,
} from '../db/schema/auth';
import { apiKeys } from '../db/schema/api-keys';
import postgres from 'postgres';

// ─── Types ─────────────────────────────────────────────────

export interface UserInfo {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: string;
	emailVerified: boolean;
}

export interface AuthDataSummary {
	sessionsCount: number;
	accountsCount: number;
	has2FA: boolean;
	lastLoginAt: string | null;
}

export interface CreditsDataSummary {
	balance: number;
	totalEarned: number;
	totalSpent: number;
	transactionsCount: number;
}

export interface EntityCount {
	entity: string;
	count: number;
	label: string;
}

export interface ProjectDataSummary {
	projectId: string;
	projectName: string;
	icon: string;
	available: boolean;
	error?: string;
	entities: EntityCount[];
	totalCount: number;
	lastActivityAt?: string;
}

export interface UserDataSummary {
	user: UserInfo;
	auth: AuthDataSummary;
	credits: CreditsDataSummary;
	projects: ProjectDataSummary[];
	totals: {
		totalEntities: number;
		projectsWithData: number;
	};
}

export interface ProjectDeleteResult {
	projectId: string;
	projectName: string;
	success: boolean;
	deletedCount?: number;
	error?: string;
}

export interface DeleteUserDataResponse {
	success: boolean;
	deletedFromProjects: ProjectDeleteResult[];
	deletedFromAuth: {
		sessions: number;
		accounts: number;
		credits: number;
		user: boolean;
	};
	totalDeleted: number;
}

export interface UserListItem {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: string;
	lastActiveAt?: string;
}

export interface UserListResponse {
	users: UserListItem[];
	total: number;
	page: number;
	limit: number;
}

// ─── Project Metadata ──────────────────────────────────────

const PROJECT_META: Record<string, { name: string; icon: string }> = {
	todo: { name: 'Todo', icon: '✅' },
	chat: { name: 'ManaChat', icon: '💬' },
	calendar: { name: 'Kalender', icon: '📅' },
	clock: { name: 'Clock', icon: '⏰' },
	contacts: { name: 'Kontakte', icon: '👤' },
	cards: { name: 'Cards', icon: '🃏' },
	picture: { name: 'ManaPicture', icon: '🎨' },
	zitare: { name: 'Zitare', icon: '✨' },
	presi: { name: 'Presi', icon: '📊' },
	inventar: { name: 'Inventar', icon: '📦' },
	nutriphi: { name: 'Nutriphi', icon: '🥗' },
	planta: { name: 'Planta', icon: '🌱' },
	storage: { name: 'Storage', icon: '☁️' },
	questions: { name: 'Questions', icon: '❓' },
	music: { name: 'Music', icon: '🎵' },
	context: { name: 'Context', icon: '📄' },
	photos: { name: 'Photos', icon: '📷' },
	skilltree: { name: 'SkillTree', icon: '🌳' },
	citycorners: { name: 'CityCorners', icon: '🏙️' },
	times: { name: 'Taktik', icon: '⏱️' },
	uload: { name: 'uLoad', icon: '🔗' },
	calc: { name: 'Calc', icon: '🧮' },
	mana: { name: 'Mana', icon: '💎' },
};

/** Convert camelCase/snake_case table name to readable label */
function tableNameToLabel(name: string): string {
	return name
		.replace(/([A-Z])/g, ' $1')
		.replace(/_/g, ' ')
		.replace(/^\w/, (c) => c.toUpperCase())
		.trim();
}

// ─── Service ───────────────────────────────────────────────

export class UserDataService {
	private syncSql: ReturnType<typeof postgres> | null = null;

	constructor(
		private db: Database,
		private config: Config
	) {}

	private getSyncSql() {
		if (!this.syncSql) {
			this.syncSql = postgres(this.config.syncDatabaseUrl, { max: 5 });
		}
		return this.syncSql;
	}

	// ─── User Info ───────────────────────────────────────────

	async getUserInfo(userId: string): Promise<UserInfo | null> {
		const [user] = await this.db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				role: users.role,
				createdAt: users.createdAt,
				emailVerified: users.emailVerified,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) return null;

		return {
			...user,
			createdAt: user.createdAt.toISOString(),
		};
	}

	// ─── Auth Data ───────────────────────────────────────────

	async getAuthData(userId: string): Promise<AuthDataSummary> {
		const [sessionsResult, accountsResult, twoFaResult, lastSession] = await Promise.all([
			this.db
				.select({ count: count() })
				.from(sessions)
				.where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt))),
			this.db.select({ count: count() }).from(accounts).where(eq(accounts.userId, userId)),
			this.db
				.select({ enabled: twoFactorAuth.enabled })
				.from(twoFactorAuth)
				.where(eq(twoFactorAuth.userId, userId))
				.limit(1),
			this.db
				.select({ lastActivity: sessions.lastActivityAt })
				.from(sessions)
				.where(eq(sessions.userId, userId))
				.orderBy(desc(sessions.lastActivityAt))
				.limit(1),
		]);

		return {
			sessionsCount: sessionsResult[0]?.count ?? 0,
			accountsCount: accountsResult[0]?.count ?? 0,
			has2FA: twoFaResult[0]?.enabled ?? false,
			lastLoginAt: lastSession[0]?.lastActivity?.toISOString() ?? null,
		};
	}

	// ─── Credits Data ────────────────────────────────────────

	async getCreditsData(userId: string): Promise<CreditsDataSummary> {
		try {
			const res = await fetch(
				`${this.config.manaCreditsUrl}/api/v1/internal/credits/balance/${userId}`,
				{ headers: { 'X-Service-Key': this.config.serviceKey } }
			);

			if (!res.ok) {
				return { balance: 0, totalEarned: 0, totalSpent: 0, transactionsCount: 0 };
			}

			const data = (await res.json()) as {
				balance?: number;
				totalEarned?: number;
				totalSpent?: number;
				transactionsCount?: number;
			};

			return {
				balance: data.balance ?? 0,
				totalEarned: data.totalEarned ?? 0,
				totalSpent: data.totalSpent ?? 0,
				transactionsCount: data.transactionsCount ?? 0,
			};
		} catch {
			return { balance: 0, totalEarned: 0, totalSpent: 0, transactionsCount: 0 };
		}
	}

	// ─── Project Data (from mana-sync) ───────────────────────

	async getProjectData(userId: string): Promise<ProjectDataSummary[]> {
		try {
			const syncSql = this.getSyncSql();

			// Get entity counts per app/table (latest state, excluding deleted)
			const entityCounts = await syncSql`
				SELECT app_id, table_name, COUNT(*) as count
				FROM (
					SELECT DISTINCT ON (app_id, table_name, record_id)
						app_id, table_name, record_id, op
					FROM sync_changes
					WHERE user_id = ${userId}
					ORDER BY app_id, table_name, record_id, created_at DESC
				) latest
				WHERE op != 'delete'
				GROUP BY app_id, table_name
				ORDER BY app_id, table_name
			`;

			// Get last activity per app
			const lastActivity = await syncSql`
				SELECT app_id, MAX(created_at) as last_activity
				FROM sync_changes
				WHERE user_id = ${userId}
				GROUP BY app_id
			`;

			const lastActivityMap = new Map<string, string>();
			for (const row of lastActivity) {
				lastActivityMap.set(row.app_id, new Date(row.last_activity).toISOString());
			}

			// Group by app
			const appEntities = new Map<string, EntityCount[]>();
			for (const row of entityCounts) {
				const appId = row.app_id;
				if (!appEntities.has(appId)) {
					appEntities.set(appId, []);
				}
				appEntities.get(appId)!.push({
					entity: row.table_name,
					count: Number(row.count),
					label: tableNameToLabel(row.table_name),
				});
			}

			// Build project summaries for all known projects
			const projects: ProjectDataSummary[] = [];

			for (const [projectId, meta] of Object.entries(PROJECT_META)) {
				const entities = appEntities.get(projectId) || [];
				const totalCount = entities.reduce((sum, e) => sum + e.count, 0);

				projects.push({
					projectId,
					projectName: meta.name,
					icon: meta.icon,
					available: true,
					entities,
					totalCount,
					lastActivityAt: lastActivityMap.get(projectId),
				});
			}

			// Add any unknown apps from sync data
			for (const [appId, entities] of appEntities) {
				if (!PROJECT_META[appId]) {
					const totalCount = entities.reduce((sum, e) => sum + e.count, 0);
					projects.push({
						projectId: appId,
						projectName: appId,
						icon: '📁',
						available: true,
						entities,
						totalCount,
						lastActivityAt: lastActivityMap.get(appId),
					});
				}
			}

			return projects;
		} catch (err) {
			// If sync DB is unavailable, return all projects as unavailable
			return Object.entries(PROJECT_META).map(([projectId, meta]) => ({
				projectId,
				projectName: meta.name,
				icon: meta.icon,
				available: false,
				error: 'Sync-Datenbank nicht erreichbar',
				entities: [],
				totalCount: 0,
			}));
		}
	}

	// ─── Full Summary ────────────────────────────────────────

	async getUserDataSummary(userId: string): Promise<UserDataSummary | null> {
		const userInfo = await this.getUserInfo(userId);
		if (!userInfo) return null;

		const [auth, credits, projects] = await Promise.all([
			this.getAuthData(userId),
			this.getCreditsData(userId),
			this.getProjectData(userId),
		]);

		const totalEntities = projects.reduce((sum, p) => sum + p.totalCount, 0);
		const projectsWithData = projects.filter((p) => p.totalCount > 0).length;

		return {
			user: userInfo,
			auth,
			credits,
			projects,
			totals: { totalEntities, projectsWithData },
		};
	}

	// ─── Export ──────────────────────────────────────────────

	async exportUserData(userId: string) {
		const summary = await this.getUserDataSummary(userId);
		if (!summary) return null;

		// Also fetch detailed auth data for export
		const [userSessions, userPasskeys, userApiKeys, userSecurityEvents] = await Promise.all([
			this.db
				.select({
					id: sessions.id,
					createdAt: sessions.createdAt,
					expiresAt: sessions.expiresAt,
					ipAddress: sessions.ipAddress,
					deviceName: sessions.deviceName,
					lastActivityAt: sessions.lastActivityAt,
					revokedAt: sessions.revokedAt,
				})
				.from(sessions)
				.where(eq(sessions.userId, userId)),
			this.db
				.select({
					id: passkeys.id,
					friendlyName: passkeys.friendlyName,
					deviceType: passkeys.deviceType,
					createdAt: passkeys.createdAt,
					lastUsedAt: passkeys.lastUsedAt,
				})
				.from(passkeys)
				.where(eq(passkeys.userId, userId)),
			this.db
				.select({
					id: apiKeys.id,
					name: apiKeys.name,
					keyPrefix: apiKeys.keyPrefix,
					scopes: apiKeys.scopes,
					createdAt: apiKeys.createdAt,
					lastUsedAt: apiKeys.lastUsedAt,
					revokedAt: apiKeys.revokedAt,
				})
				.from(apiKeys)
				.where(eq(apiKeys.userId, userId)),
			this.db
				.select({
					eventType: securityEvents.eventType,
					ipAddress: securityEvents.ipAddress,
					createdAt: securityEvents.createdAt,
				})
				.from(securityEvents)
				.where(eq(securityEvents.userId, userId))
				.orderBy(desc(securityEvents.createdAt))
				.limit(200),
		]);

		return {
			exportedAt: new Date().toISOString(),
			exportVersion: '2.0',
			data: summary,
			details: {
				sessions: userSessions,
				passkeys: userPasskeys,
				apiKeys: userApiKeys,
				securityEvents: userSecurityEvents,
			},
		};
	}

	// ─── Delete ──────────────────────────────────────────────

	async deleteUserData(userId: string, userEmail: string): Promise<DeleteUserDataResponse> {
		const deletedFromProjects: ProjectDeleteResult[] = [];
		let totalDeleted = 0;

		// 1. Delete sync data
		try {
			const syncSql = this.getSyncSql();
			const result = await syncSql`
				DELETE FROM sync_changes WHERE user_id = ${userId}
			`;
			const deletedCount = result.count;
			totalDeleted += deletedCount;
			deletedFromProjects.push({
				projectId: 'sync',
				projectName: 'Sync-Daten',
				success: true,
				deletedCount,
			});
		} catch (err) {
			deletedFromProjects.push({
				projectId: 'sync',
				projectName: 'Sync-Daten',
				success: false,
				error: 'Sync-Datenbank nicht erreichbar',
			});
		}

		// 2. Delete credits data
		let creditsDeleted = 0;
		try {
			const res = await fetch(
				`${this.config.manaCreditsUrl}/api/v1/internal/credits/balance/${userId}`,
				{
					method: 'DELETE',
					headers: { 'X-Service-Key': this.config.serviceKey },
				}
			);
			if (res.ok) {
				const data = (await res.json()) as { deletedCount?: number };
				creditsDeleted = data.deletedCount ?? 0;
			}
		} catch {
			// Credits deletion is best-effort
		}

		// 3. Count auth records before deletion
		const [sessionsCount, accountsCount] = await Promise.all([
			this.db.select({ count: count() }).from(sessions).where(eq(sessions.userId, userId)),
			this.db.select({ count: count() }).from(accounts).where(eq(accounts.userId, userId)),
		]);

		const deletedSessions = sessionsCount[0]?.count ?? 0;
		const deletedAccounts = accountsCount[0]?.count ?? 0;
		totalDeleted += deletedSessions + deletedAccounts + creditsDeleted;

		// 4. Delete user (cascades sessions, accounts, passkeys, api keys, etc.)
		await this.db.delete(users).where(eq(users.id, userId));
		totalDeleted += 1; // the user record itself

		return {
			success: true,
			deletedFromProjects,
			deletedFromAuth: {
				sessions: deletedSessions,
				accounts: deletedAccounts,
				credits: creditsDeleted,
				user: true,
			},
			totalDeleted,
		};
	}

	// ─── User List (Admin) ───────────────────────────────────

	async listUsers(
		page: number = 1,
		limit: number = 20,
		search?: string
	): Promise<UserListResponse> {
		const offset = (page - 1) * limit;

		// Count total
		let totalQuery = this.db.select({ count: count() }).from(users);
		if (search) {
			totalQuery = totalQuery.where(
				or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`))
			) as typeof totalQuery;
		}
		const [{ count: total }] = await totalQuery;

		// Fetch page with last activity
		let query = this.db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				role: users.role,
				createdAt: users.createdAt,
			})
			.from(users);

		if (search) {
			query = query.where(
				or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`))
			) as typeof query;
		}

		const rows = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

		// Get last activity for these users
		const userIds = rows.map((r) => r.id);
		const lastActivities =
			userIds.length > 0
				? await this.db
						.select({
							userId: sessions.userId,
							lastActivity: sql<Date>`MAX(${sessions.lastActivityAt})`.as('last_activity'),
						})
						.from(sessions)
						.where(sql`${sessions.userId} IN ${userIds}`)
						.groupBy(sessions.userId)
				: [];

		const activityMap = new Map(lastActivities.map((a) => [a.userId, a.lastActivity]));

		return {
			users: rows.map((r) => ({
				id: r.id,
				email: r.email,
				name: r.name,
				role: r.role,
				createdAt: r.createdAt.toISOString(),
				lastActiveAt: activityMap.get(r.id)?.toISOString(),
			})),
			total,
			page,
			limit,
		};
	}
}
