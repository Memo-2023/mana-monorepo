import { text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { authSchema, users } from './auth.schema';

/**
 * API Keys table for programmatic access to services.
 * Keys are hashed using SHA-256 for security - the full key is only shown once at creation.
 */
export const apiKeys = authSchema.table(
	'api_keys',
	{
		id: text('id').primaryKey(), // nanoid
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		name: text('name').notNull(), // User-friendly name for the key
		keyPrefix: text('key_prefix').notNull(), // "sk_live_abc..." for display (first 12 chars)
		keyHash: text('key_hash').notNull(), // SHA-256 hash of the full key
		scopes: jsonb('scopes').$type<string[]>().default(['stt', 'tts']).notNull(), // Allowed service scopes
		rateLimitRequests: integer('rate_limit_requests').default(60).notNull(), // Requests per window
		rateLimitWindow: integer('rate_limit_window').default(60).notNull(), // Window in seconds
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
	},
	(table) => [
		index('api_keys_user_id_idx').on(table.userId),
		index('api_keys_key_hash_idx').on(table.keyHash),
	]
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
