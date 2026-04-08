import {
	pgSchema,
	uuid,
	text,
	timestamp,
	boolean,
	jsonb,
	pgEnum,
	index,
	integer,
} from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'service']);

// Enum for access tiers (controls which apps a user can access)
// Hierarchy: founder > alpha > beta > public > guest
export const accessTierEnum = pgEnum('access_tier', [
	'guest',
	'public',
	'beta',
	'alpha',
	'founder',
]);

// Users table (Better Auth schema)
export const users = authSchema.table('users', {
	id: text('id').primaryKey(), // Better Auth generates nanoid
	name: text('name').notNull(),
	email: text('email').unique().notNull(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'), // Better Auth uses 'image' not 'avatarUrl'
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	// Custom fields (not required by Better Auth)
	role: userRoleEnum('role').default('user').notNull(),
	accessTier: accessTierEnum('access_tier').default('public').notNull(),
	twoFactorEnabled: boolean('two_factor_enabled').default(false),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Sessions table (Better Auth schema)
export const sessions = authSchema.table('sessions', {
	id: text('id').primaryKey(), // Better Auth generates nanoid
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	token: text('token').unique().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	// Custom fields (not required by Better Auth)
	refreshToken: text('refresh_token').unique(),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
	deviceId: text('device_id'),
	deviceName: text('device_name'),
	lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow(),
	revokedAt: timestamp('revoked_at', { withTimezone: true }),
	rememberMe: boolean('remember_me').default(false),
});

// Accounts table (for OAuth providers and credentials - Better Auth schema)
export const accounts = authSchema.table('accounts', {
	id: text('id').primaryKey(), // Better Auth generates nanoid
	accountId: text('account_id').notNull(), // Better Auth field
	providerId: text('provider_id').notNull(), // Better Auth field (was 'provider')
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
	scope: text('scope'),
	password: text('password'), // Better Auth stores hashed password here for credential provider
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Verification table (Better Auth schema - for email verification, password reset)
export const verificationTokens = authSchema.table(
	'verification',
	{
		id: text('id').primaryKey(), // Better Auth generates nanoid
		identifier: text('identifier').notNull(), // Better Auth uses identifier (e.g., email)
		value: text('value').notNull(), // Better Auth uses value (the token)
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		identifierIdx: index('verification_identifier_idx').on(table.identifier),
	})
);

// Password table (separate for security)
export const passwords = authSchema.table('passwords', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	hashedPassword: text('hashed_password').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Two-factor authentication
export const twoFactorAuth = authSchema.table('two_factor_auth', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	secret: text('secret').notNull(),
	enabled: boolean('enabled').default(false).notNull(),
	backupCodes: text('backup_codes').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	enabledAt: timestamp('enabled_at', { withTimezone: true }),
});

// Security events log
export const securityEvents = authSchema.table('security_events', {
	id: uuid('id').primaryKey().defaultRandom(), // Our table, can keep UUID
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	eventType: text('event_type').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// JWKS table (Better Auth JWT plugin - stores signing keys)
export const jwks = authSchema.table('jwks', {
	id: text('id').primaryKey(),
	publicKey: text('public_key').notNull(),
	privateKey: text('private_key').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Passkeys table (WebAuthn credentials)
export const passkeys = authSchema.table(
	'passkeys',
	{
		id: text('id').primaryKey(), // nanoid
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		credentialId: text('credential_id').unique().notNull(), // base64url-encoded
		publicKey: text('public_key').notNull(), // base64url-encoded COSE public key
		counter: integer('counter').default(0).notNull(), // signature counter
		deviceType: text('device_type').notNull(), // 'singleDevice' | 'multiDevice'
		backedUp: boolean('backed_up').default(false).notNull(),
		transports: jsonb('transports').$type<string[]>(), // ['internal', 'hybrid', etc.]
		friendlyName: text('friendly_name'),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('passkeys_user_id_idx').on(table.userId),
	})
);

// User settings table (synced across all apps)
export const userSettings = authSchema.table('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),

	// Global defaults (applies to all apps)
	// { nav: { desktopPosition, sidebarCollapsed }, theme: { mode, colorScheme }, locale }
	globalSettings: jsonb('global_settings')
		.default({
			nav: { desktopPosition: 'top', sidebarCollapsed: false },
			theme: { mode: 'system', colorScheme: 'ocean' },
			locale: 'de',
		})
		.notNull(),

	// Per-app overrides (applies to all devices)
	// { "calendar": { nav: {...}, theme: {...} }, "chat": {...} }
	appOverrides: jsonb('app_overrides').default({}).notNull(),

	// Per-device settings (device-specific app settings)
	// { "device-abc-123": { deviceName: "MacBook", deviceType: "desktop", lastSeen: "...", apps: { "calendar": { dayStartHour: 6, ... } } } }
	deviceSettings: jsonb('device_settings').default({}).notNull(),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
