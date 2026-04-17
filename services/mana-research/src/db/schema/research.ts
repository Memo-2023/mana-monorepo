/**
 * Research Schema — provider configs, eval runs, results, and stats.
 *
 * Lives in mana_platform DB under the `research` pgSchema.
 * All userId columns are text without FK (separate ownership from auth.users).
 */

import {
	pgSchema,
	uuid,
	integer,
	text,
	timestamp,
	jsonb,
	boolean,
	real,
	index,
	uniqueIndex,
	primaryKey,
	pgEnum,
} from 'drizzle-orm/pg-core';

export const researchSchema = pgSchema('research');

export const billingModeEnum = pgEnum('research_billing_mode', [
	'server-key',
	'byo-key',
	'free',
	'mixed',
]);

export const runCategoryEnum = pgEnum('research_run_category', ['search', 'extract', 'agent']);

export const runModeEnum = pgEnum('research_run_mode', ['single', 'compare', 'auto']);

/** A single research request: one query, one or more providers. */
export const evalRuns = researchSchema.table(
	'eval_runs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id'),
		query: text('query').notNull(),
		queryType: text('query_type'),
		mode: runModeEnum('mode').notNull(),
		category: runCategoryEnum('category').notNull(),
		providersRequested: text('providers_requested').array().notNull(),
		billingMode: billingModeEnum('billing_mode').notNull(),
		totalCostCredits: integer('total_cost_credits').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userIdx: index('eval_runs_user_idx').on(t.userId, t.createdAt),
		queryIdx: index('eval_runs_query_idx').on(t.query),
	})
);

/** One provider response per run. */
export const evalResults = researchSchema.table(
	'eval_results',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		runId: uuid('run_id')
			.notNull()
			.references(() => evalRuns.id, { onDelete: 'cascade' }),
		providerId: text('provider_id').notNull(),
		success: boolean('success').notNull(),
		latencyMs: integer('latency_ms').notNull(),
		costCredits: integer('cost_credits').notNull().default(0),
		billingMode: billingModeEnum('billing_mode').notNull(),
		cacheHit: boolean('cache_hit').notNull().default(false),
		rawResponse: jsonb('raw_response'),
		normalizedResult: jsonb('normalized_result'),
		errorCode: text('error_code'),
		errorMessage: text('error_message'),
		userRating: integer('user_rating'),
		userNotes: text('user_notes'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		runIdx: index('eval_results_run_idx').on(t.runId),
		providerIdx: index('eval_results_provider_idx').on(t.providerId, t.createdAt),
	})
);

/** Per-user BYO-key config + budgets. `userId=null` reserved for server-default row. */
export const providerConfigs = researchSchema.table(
	'provider_configs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id'),
		providerId: text('provider_id').notNull(),
		apiKeyEncrypted: text('api_key_encrypted'),
		enabled: boolean('enabled').notNull().default(true),
		dailyBudgetCredits: integer('daily_budget_credits'),
		monthlyBudgetCredits: integer('monthly_budget_credits'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userProviderUnique: uniqueIndex('provider_configs_user_provider_unique').on(
			t.userId,
			t.providerId
		),
	})
);

/** Aggregated per-day stats for Admin dashboard + auto-router. */
export const providerStats = researchSchema.table(
	'provider_stats',
	{
		providerId: text('provider_id').notNull(),
		day: text('day').notNull(),
		totalCalls: integer('total_calls').notNull().default(0),
		totalLatencyMs: integer('total_latency_ms').notNull().default(0),
		totalCostCredits: integer('total_cost_credits').notNull().default(0),
		successCount: integer('success_count').notNull().default(0),
		errorCount: integer('error_count').notNull().default(0),
		avgUserRating: real('avg_user_rating'),
		ratingCount: integer('rating_count').notNull().default(0),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.providerId, t.day] }),
	})
);

export type EvalRun = typeof evalRuns.$inferSelect;
export type NewEvalRun = typeof evalRuns.$inferInsert;
export type EvalResult = typeof evalResults.$inferSelect;
export type NewEvalResult = typeof evalResults.$inferInsert;
export type ProviderConfig = typeof providerConfigs.$inferSelect;
export type ProviderStat = typeof providerStats.$inferSelect;

export const asyncJobStatusEnum = pgEnum('research_async_status', [
	'queued',
	'running',
	'completed',
	'failed',
	'cancelled',
]);

/** Long-running research tasks (openai-deep-research). User submits, polls. */
export const asyncJobs = researchSchema.table(
	'async_jobs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		providerId: text('provider_id').notNull(),
		externalId: text('external_id'),
		status: asyncJobStatusEnum('status').notNull().default('queued'),
		query: text('query').notNull(),
		options: jsonb('options'),
		reservationId: text('reservation_id'),
		costCredits: integer('cost_credits').notNull().default(0),
		result: jsonb('result'),
		errorMessage: text('error_message'),
		runId: uuid('run_id').references(() => evalRuns.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userIdx: index('async_jobs_user_idx').on(t.userId, t.createdAt),
		statusIdx: index('async_jobs_status_idx').on(t.status),
	})
);

export type AsyncJob = typeof asyncJobs.$inferSelect;
export type NewAsyncJob = typeof asyncJobs.$inferInsert;
