import {
	pgSchema,
	uuid,
	text,
	timestamp,
	jsonb,
	integer,
	index,
	pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const errorLogsSchema = pgSchema('error_logs');

// Source type enum
export const errorSourceTypeEnum = pgEnum('error_source_type', [
	'backend',
	'frontend_web',
	'frontend_mobile',
]);

// Environment enum
export const errorEnvironmentEnum = pgEnum('error_environment', [
	'development',
	'staging',
	'production',
]);

// Severity enum
export const errorSeverityEnum = pgEnum('error_severity', [
	'debug',
	'info',
	'warning',
	'error',
	'critical',
]);

// Error logs table
export const errorLogs = errorLogsSchema.table(
	'error_logs',
	{
		// Primary key
		id: uuid('id').primaryKey().defaultRandom(),

		// Error identification
		errorCode: text('error_code').notNull(),
		errorType: text('error_type').notNull(),
		message: text('message').notNull(),
		stackTrace: text('stack_trace'),

		// Source identification
		appId: text('app_id').notNull(),
		sourceType: errorSourceTypeEnum('source_type'),
		serviceName: text('service_name'),

		// User context (optional)
		userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
		sessionId: text('session_id'),

		// Request metadata (backend errors)
		requestUrl: text('request_url'),
		requestMethod: text('request_method'),
		requestHeaders: jsonb('request_headers'),
		requestBody: jsonb('request_body'),
		responseStatusCode: integer('response_status_code'),

		// Classification
		environment: errorEnvironmentEnum('environment'),
		severity: errorSeverityEnum('severity').default('error'),

		// Additional context
		context: jsonb('context').default({}),
		fingerprint: text('fingerprint'),

		// Browser/device info (frontend errors)
		userAgent: text('user_agent'),
		browserInfo: jsonb('browser_info'),
		deviceInfo: jsonb('device_info'),

		// Timestamps
		occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		appIdIdx: index('error_logs_app_id_idx').on(table.appId),
		userIdIdx: index('error_logs_user_id_idx').on(table.userId),
		environmentIdx: index('error_logs_environment_idx').on(table.environment),
		severityIdx: index('error_logs_severity_idx').on(table.severity),
		occurredAtIdx: index('error_logs_occurred_at_idx').on(table.occurredAt),
		errorCodeIdx: index('error_logs_error_code_idx').on(table.errorCode),
		fingerprintIdx: index('error_logs_fingerprint_idx').on(table.fingerprint),
	})
);

// Type exports
export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;
