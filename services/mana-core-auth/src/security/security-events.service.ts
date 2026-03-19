/**
 * Security Events Service
 *
 * Centralized audit logging for all authentication and security-relevant events.
 * All methods are fire-and-forget: errors are logged but never thrown,
 * so audit logging cannot break authentication flows.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb } from '../db/connection';
import { securityEvents } from '../db/schema/auth.schema';
import { LoggerService } from '../common/logger';
import type { Request } from 'express';

export const SecurityEventType = {
	// Authentication
	LOGIN_SUCCESS: 'login_success',
	LOGIN_FAILURE: 'login_failure',
	REGISTER: 'register',
	LOGOUT: 'logout',
	TOKEN_REFRESHED: 'token_refreshed',
	SSO_TOKEN_EXCHANGE: 'sso_token_exchange',

	// Password
	PASSWORD_CHANGED: 'password_changed',
	PASSWORD_RESET_REQUESTED: 'password_reset_requested',
	PASSWORD_RESET_COMPLETED: 'password_reset_completed',

	// Email
	EMAIL_VERIFIED: 'email_verified',
	EMAIL_VERIFICATION_RESENT: 'email_verification_resent',

	// Account
	ACCOUNT_DELETED: 'account_deleted',
	ACCOUNT_LOCKED: 'account_locked',
	ACCOUNT_UNLOCKED: 'account_unlocked',
	PROFILE_UPDATED: 'profile_updated',

	// API Keys
	API_KEY_CREATED: 'api_key_created',
	API_KEY_REVOKED: 'api_key_revoked',
	API_KEY_VALIDATED: 'api_key_validated',
	API_KEY_VALIDATION_FAILED: 'api_key_validation_failed',

	// Organizations
	ORG_CREATED: 'org_created',
	ORG_DELETED: 'org_deleted',
	ORG_MEMBER_INVITED: 'org_member_invited',
	ORG_MEMBER_REMOVED: 'org_member_removed',
	ORG_MEMBER_ROLE_CHANGED: 'org_member_role_changed',
	ORG_INVITATION_ACCEPTED: 'org_invitation_accepted',
} as const;

export type SecurityEventTypeValue = (typeof SecurityEventType)[keyof typeof SecurityEventType];

export interface SecurityEventParams {
	userId?: string;
	eventType: SecurityEventTypeValue;
	ipAddress?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
}

@Injectable()
export class SecurityEventsService {
	private readonly logger: LoggerService;
	private readonly databaseUrl: string;

	constructor(
		loggerService: LoggerService,
		private configService: ConfigService
	) {
		this.logger = loggerService;
		this.logger.setContext('SecurityEventsService');
		this.databaseUrl = this.configService.get<string>('database.url') || '';
	}

	/**
	 * Extract IP address and User-Agent from an Express request
	 */
	extractRequestInfo(req: Request): { ipAddress: string; userAgent: string } {
		const forwarded = req.headers['x-forwarded-for'];
		const ipAddress =
			(typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip) || 'unknown';
		const userAgent = (req.headers['user-agent'] as string) || 'unknown';
		return { ipAddress, userAgent };
	}

	/**
	 * Log a security event to the database.
	 * Fire-and-forget: never throws, only logs warnings on failure.
	 */
	async logEvent(params: SecurityEventParams): Promise<void> {
		try {
			const db = getDb(this.databaseUrl);
			await db.insert(securityEvents).values({
				userId: params.userId || null,
				eventType: params.eventType,
				ipAddress: params.ipAddress || null,
				userAgent: params.userAgent || null,
				metadata: params.metadata || null,
			});
		} catch (error) {
			this.logger.warn(`Failed to log security event: ${params.eventType}`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: params.userId,
			});
		}
	}

	/**
	 * Convenience: log event with request context
	 */
	async logEventWithRequest(
		req: Request,
		params: Omit<SecurityEventParams, 'ipAddress' | 'userAgent'>
	): Promise<void> {
		const { ipAddress, userAgent } = this.extractRequestInfo(req);
		await this.logEvent({ ...params, ipAddress, userAgent });
	}
}
