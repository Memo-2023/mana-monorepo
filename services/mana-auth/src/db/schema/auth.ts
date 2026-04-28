import {
	pgSchema,
	uuid,
	text,
	timestamp,
	boolean,
	jsonb,
	index,
	integer,
} from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

// Enums live inside the auth schema so drizzle-kit push with
// `schemaFilter: ['auth']` can introspect them. Defining via pgEnum()
// would put them in public and cause spurious CREATE TYPE attempts on
// every push (the filter hides them, drizzle thinks they're missing).
export const userRoleEnum = authSchema.enum('user_role', ['user', 'admin', 'service']);

// Hierarchy: founder > alpha > beta > public > guest
export const accessTierEnum = authSchema.enum('access_tier', [
	'guest',
	'public',
	'beta',
	'alpha',
	'founder',
]);

// `human` is the default for everyone real. `persona` is for the auto-test
// users driven by the persona-runner — they go through the same
// auth/register/JWT pipeline as humans (no bypass), but admin UIs and
// product analytics filter them out by default. `system` is reserved for
// service principals (e.g. mana-ai's planner identity).
// See docs/plans/mana-mcp-and-personas.md (M2 — Persona-Primitives).
export const userKindEnum = authSchema.enum('user_kind', ['human', 'persona', 'system']);

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
	kind: userKindEnum('kind').default('human').notNull(),
	twoFactorEnabled: boolean('two_factor_enabled').default(false),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
	// Null = user hasn't finished the 3-screen onboarding flow yet (Name
	// → Look → Templates). The flow is skippable, but even a skip sets
	// this timestamp so we don't re-prompt. See docs/plans/onboarding-flow.md.
	onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
	// Public-feedback identity opt-ins (Phase 3.C of feedback-rewards-and-identity).
	// Off by default — users stay anonymous as their tier-pseudonym ("Wachsame
	// Eule #4528"). Opt-in shows the real `name` next to the pseudonym in the
	// auth-required feedback feed only; the public-mirror NEVER exposes it.
	feedbackShowRealName: boolean('feedback_show_real_name').default(false).notNull(),
	// Karma += 1 per reaction received from another user, decremented on unreact.
	// Drives the public Bronze/Silver/Gold/Platinum-Eulen tier badge.
	feedbackKarma: integer('feedback_karma').default(0).notNull(),
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

// Passkeys table (WebAuthn credentials).
// Field names match `@better-auth/passkey`'s expected schema so the
// Drizzle adapter can write/read directly without a translation layer.
// Notably: the TS field is `credentialID` (capital I/D) even though
// the SQL column stays snake_case; the plugin dereferences by TS name.
// `transports` is a comma-separated string (not jsonb) because the
// plugin stores the AuthenticatorTransport[] as a CSV.
// `name` (was `friendlyName`) is user-provided.
// `lastUsedAt` is ours — populated by the wrapper on successful
// authentication; the plugin itself doesn't touch it.
export const passkeys = authSchema.table(
	'passkeys',
	{
		id: text('id').primaryKey(), // nanoid
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		credentialID: text('credential_id').unique().notNull(), // base64url-encoded
		publicKey: text('public_key').notNull(), // base64url-encoded COSE public key
		counter: integer('counter').default(0).notNull(), // signature counter
		deviceType: text('device_type').notNull(), // 'singleDevice' | 'multiDevice'
		backedUp: boolean('backed_up').default(false).notNull(),
		transports: text('transports'), // CSV of AuthenticatorTransport values
		name: text('name'),
		aaguid: text('aaguid'), // authenticator AAGUID (optional)
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
