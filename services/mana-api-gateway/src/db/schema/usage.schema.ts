import { uuid, text, integer, timestamp, jsonb, index, unique, date } from 'drizzle-orm/pg-core';
import { apiGatewaySchema, apiKeys } from './api-keys.schema';

// Detailed usage log
export const apiUsage = apiGatewaySchema.table(
	'api_usage',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Key reference
		apiKeyId: uuid('api_key_id')
			.references(() => apiKeys.id, { onDelete: 'cascade' })
			.notNull(),

		// Request details
		endpoint: text('endpoint').notNull(), // search, stt, tts
		method: text('method').notNull(), // POST, GET
		path: text('path').notNull(), // /v1/search

		// Metrics
		requestSize: integer('request_size'), // bytes
		responseSize: integer('response_size'), // bytes
		latencyMs: integer('latency_ms'), // milliseconds
		statusCode: integer('status_code'), // 200, 400, 500...

		// Credit calculation
		creditsUsed: integer('credits_used').notNull().default(0),
		creditReason: text('credit_reason'), // "1000 characters TTS"

		// Metadata
		metadata: jsonb('metadata'), // additional context (user agent, etc.)

		// Timestamp
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		apiKeyIdIdx: index('api_usage_api_key_id_idx').on(table.apiKeyId),
		createdAtIdx: index('api_usage_created_at_idx').on(table.createdAt),
		endpointIdx: index('api_usage_endpoint_idx').on(table.endpoint),
	})
);

// Aggregated daily usage (for dashboard/billing)
export const apiUsageDaily = apiGatewaySchema.table(
	'api_usage_daily',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		apiKeyId: uuid('api_key_id')
			.references(() => apiKeys.id, { onDelete: 'cascade' })
			.notNull(),
		date: date('date').notNull(),
		endpoint: text('endpoint').notNull(),

		// Aggregates
		requestCount: integer('request_count').notNull().default(0),
		creditsUsed: integer('credits_used').notNull().default(0),
		totalLatencyMs: integer('total_latency_ms').notNull().default(0),
		errorCount: integer('error_count').notNull().default(0),
	},
	(table) => ({
		// Unique constraint for upsert
		uniqueDaily: unique('api_usage_daily_unique').on(table.apiKeyId, table.date, table.endpoint),
		dateIdx: index('api_usage_daily_date_idx').on(table.date),
	})
);

export type ApiUsage = typeof apiUsage.$inferSelect;
export type NewApiUsage = typeof apiUsage.$inferInsert;
export type ApiUsageDaily = typeof apiUsageDaily.$inferSelect;
export type NewApiUsageDaily = typeof apiUsageDaily.$inferInsert;
