import { pgTable, uuid, timestamp, varchar, text, jsonb } from 'drizzle-orm/pg-core';

export interface GoogleContactsProviderData {
	syncToken?: string;
	lastSyncedAt?: string;
	importedResourceNames?: string[];
	totalContacts?: number;
}

export type ProviderData = GoogleContactsProviderData;

export const connectedAccounts = pgTable('connected_accounts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	// Provider identification
	provider: varchar('provider', { length: 50 }).notNull(), // 'google'
	providerAccountId: varchar('provider_account_id', { length: 255 }),
	providerEmail: varchar('provider_email', { length: 255 }),

	// OAuth tokens
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token'),
	tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
	scope: text('scope'),

	// Provider-specific metadata
	providerData: jsonb('provider_data').$type<ProviderData>(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type NewConnectedAccount = typeof connectedAccounts.$inferInsert;
