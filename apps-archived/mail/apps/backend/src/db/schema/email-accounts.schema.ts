import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	boolean,
	integer,
	jsonb,
} from 'drizzle-orm/pg-core';

export interface SyncState {
	// IMAP sync state
	uidValidity?: number;
	lastUid?: number;
	// Gmail sync state
	historyId?: string;
	// Outlook sync state
	deltaLink?: string;
}

export const emailAccounts = pgTable('email_accounts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	// Account info
	name: varchar('name', { length: 255 }).notNull(),
	email: varchar('email', { length: 255 }).notNull(),
	provider: varchar('provider', { length: 50 }).notNull(), // gmail, outlook, imap
	isDefault: boolean('is_default').default(false),

	// IMAP/SMTP credentials (encrypted)
	imapHost: varchar('imap_host', { length: 255 }),
	imapPort: integer('imap_port'),
	imapSecurity: varchar('imap_security', { length: 20 }), // ssl, tls, none
	smtpHost: varchar('smtp_host', { length: 255 }),
	smtpPort: integer('smtp_port'),
	smtpSecurity: varchar('smtp_security', { length: 20 }),
	encryptedPassword: text('encrypted_password'),

	// OAuth tokens (Gmail/Outlook)
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
	tokenScopes: jsonb('token_scopes').$type<string[]>(),

	// Sync settings
	syncEnabled: boolean('sync_enabled').default(true),
	syncInterval: integer('sync_interval').default(5), // minutes
	lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
	lastSyncError: text('last_sync_error'),
	syncState: jsonb('sync_state').$type<SyncState>(),

	// Display settings
	color: varchar('color', { length: 7 }).default('#3B82F6'),
	signature: text('signature'),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type NewEmailAccount = typeof emailAccounts.$inferInsert;
