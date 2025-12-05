import { pgTable, uuid, timestamp, varchar, jsonb, index } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.schema';

export type ConnectionStatus = 'active' | 'disconnected' | 'error';

export const connectedAccounts = pgTable(
	'connected_accounts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		// Link to local account
		accountId: uuid('account_id')
			.references(() => accounts.id, { onDelete: 'cascade' })
			.notNull(),

		// Provider info
		provider: varchar('provider', { length: 50 }).notNull(), // plaid, gocardless, etc.
		externalId: varchar('external_id', { length: 255 }).notNull(),

		// Status
		status: varchar('status', { length: 20 }).default('active').notNull().$type<ConnectionStatus>(),

		// Sync info
		lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),

		// Provider-specific metadata
		metadata: jsonb('metadata').$type<Record<string, unknown>>(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('connected_accounts_user_idx').on(table.userId),
		accountIdx: index('connected_accounts_account_idx').on(table.accountId),
		providerIdx: index('connected_accounts_provider_idx').on(table.provider),
		externalIdx: index('connected_accounts_external_idx').on(table.externalId),
	})
);

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type NewConnectedAccount = typeof connectedAccounts.$inferInsert;
