import { pgSchema, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const apiGatewaySchema = pgSchema('api_gateway');

export const apiKeys = apiGatewaySchema.table(
	'api_keys',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Key identifiers
		key: text('key').notNull().unique(), // sk_live_xxx or sk_test_xxx
		keyHash: text('key_hash').notNull(), // SHA256 hash for lookup
		keyPrefix: text('key_prefix').notNull(), // sk_live_ or sk_test_

		// Owner (can be user or organization)
		userId: text('user_id'), // B2C owner
		organizationId: text('organization_id'), // B2B owner

		// Metadata
		name: text('name').notNull(), // "Production API Key"
		description: text('description'),

		// Tier & Limits
		tier: text('tier').notNull().default('free'), // free, pro, enterprise
		rateLimit: integer('rate_limit').notNull().default(10), // requests/minute
		monthlyCredits: integer('monthly_credits').notNull().default(100),
		creditsUsed: integer('credits_used').notNull().default(0),
		creditsResetAt: timestamp('credits_reset_at', { withTimezone: true }),

		// Permissions
		allowedEndpoints: text('allowed_endpoints'), // JSON array: ["search", "tts"]
		allowedIps: text('allowed_ips'), // JSON array or null for any

		// Status
		active: boolean('active').notNull().default(true),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		keyHashIdx: index('api_keys_key_hash_idx').on(table.keyHash),
		userIdIdx: index('api_keys_user_id_idx').on(table.userId),
		organizationIdIdx: index('api_keys_organization_id_idx').on(table.organizationId),
	})
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
