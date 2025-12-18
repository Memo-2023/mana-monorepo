import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb } from '../db/connection';
import { securityEvents } from '../db/schema/auth.schema';
import { randomUUID } from 'crypto';

/**
 * Security Event Types
 *
 * Comprehensive list of security-relevant events for audit logging
 * and compliance (GDPR, SOC 2, ISO 27001).
 */
export type SecurityEventType =
	| 'login_success'
	| 'login_failure'
	| 'logout'
	| 'password_change'
	| 'password_reset_requested'
	| 'password_reset_completed'
	| 'account_created'
	| 'account_deleted'
	| 'token_refresh'
	| 'token_validation_failure'
	| 'session_expired'
	| 'session_revoked'
	| 'email_verified'
	| 'organization_joined'
	| 'organization_left';

/**
 * Parameters for logging security events
 */
export interface LogSecurityEventParams {
	/** User ID (null for anonymous events like failed login) */
	userId?: string;

	/** Type of security event */
	eventType: SecurityEventType;

	/** IP address of the request */
	ipAddress?: string;

	/** User agent string from the request */
	userAgent?: string;

	/** Additional metadata (device info, error codes, etc.) */
	metadata?: Record<string, unknown>;
}

/**
 * Security Events Service
 *
 * Provides centralized security event logging for compliance and audit trails.
 * All authentication and authorization events should be logged here.
 *
 * Usage:
 * ```typescript
 * await this.securityEventsService.logEvent({
 *   userId: user.id,
 *   eventType: 'login_success',
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 *   metadata: { deviceId: 'xyz' }
 * });
 * ```
 */
@Injectable()
export class SecurityEventsService {
	private databaseUrl: string;

	constructor(private configService: ConfigService) {
		this.databaseUrl = this.configService.get<string>('database.url')!;
	}

	/**
	 * Log a security event to the database
	 *
	 * This method never throws - if logging fails, it logs to console
	 * to prevent security logging from breaking application flow.
	 *
	 * @param params - Event parameters
	 */
	async logEvent(params: LogSecurityEventParams): Promise<void> {
		try {
			const db = getDb(this.databaseUrl);

			await db.insert(securityEvents).values({
				id: randomUUID(),
				userId: params.userId || null,
				eventType: params.eventType,
				ipAddress: params.ipAddress || null,
				userAgent: params.userAgent || null,
				metadata: params.metadata || null,
				createdAt: new Date(),
			});
		} catch (error) {
			// Never throw - security logging should not break app flow
			console.error('[SecurityEventsService] Failed to log security event:', {
				eventType: params.eventType,
				userId: params.userId,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Query recent security events for a user
	 *
	 * Useful for "Recent Activity" features and security dashboards.
	 *
	 * @param userId - User ID
	 * @param limit - Max number of events to return (default: 10)
	 * @returns Recent security events
	 */
	async getUserRecentEvents(userId: string, limit = 10) {
		try {
			const db = getDb(this.databaseUrl);
			const { eq, desc } = await import('drizzle-orm');

			return await db
				.select()
				.from(securityEvents)
				.where(eq(securityEvents.userId, userId))
				.orderBy(desc(securityEvents.createdAt))
				.limit(limit);
		} catch (error) {
			console.error('[SecurityEventsService] Failed to query user events:', error);
			return [];
		}
	}
}
