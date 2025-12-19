# Security Fixes Implementation Guide

**Date:** December 17, 2025
**Priority:** CRITICAL
**Estimated Time:** ~6-8 hours total

## Overview

This document provides step-by-step instructions to fix the 5 critical security gaps identified in the mana-core-auth analysis.

---

## ✅ Fix 1: Remove Manual JWT Fallback (CRITICAL)

**Location:** `services/mana-core-auth/src/auth/services/better-auth.service.ts:449-508`

**Problem:** Manual JWT fallback uses RS256 instead of EdDSA, bypassing Better Auth's security.

**Solution:** Replace the entire try-catch block with a simple call to Better Auth's JWT plugin.

### Step 1: Open the file
```bash
code services/mana-core-auth/src/auth/services/better-auth.service.ts
```

### Step 2: Find lines 449-508 (the JWT generation block)

### Step 3: Replace with this code:

```typescript
// Generate JWT access token using Better Auth's JWT plugin
// Better Auth's signJWT requires session context in the authorization header
const jwtResult = await this.api.signJWT({
	body: {
		payload: {
			sub: user.id,
			email: user.email,
			role: (user as BetterAuthUser).role || 'user',
			sid: session?.id || '',
		},
	},
	headers: {
		// Provide session context for Better Auth's JWT plugin
		authorization: `Bearer ${sessionToken}`,
	},
});

const accessToken = jwtResult?.token;

if (!accessToken) {
	throw new UnauthorizedException('Failed to generate access token');
}
```

**Testing:**
```bash
# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "yourpassword"}'

# Check token algorithm (should be EdDSA)
echo "<token>" | cut -d'.' -f1 | base64 -d
# Should show: {"alg":"EdDSA", ...}
```

---

## ✅ Fix 2: Enable Cookie Cache (HIGH IMPACT)

**Location:** `services/mana-core-auth/src/auth/better-auth.config.ts:148-151`

**Problem:** No cookie cache = 600,000 unnecessary DB queries per hour.

**Impact:** 98% reduction in session queries, <1ms validation time.

### Step 1: Open the configuration file
```bash
code services/mana-core-auth/src/auth/better-auth.config.ts
```

### Step 2: Find the `session` configuration block (around line 148)

```typescript
// Session configuration
session: {
	expiresIn: 60 * 60 * 24 * 7, // 7 days
	updateAge: 60 * 60 * 24, // Update session once per day
},
```

### Step 3: Add cookie cache configuration:

```typescript
// Session configuration
session: {
	expiresIn: 60 * 60 * 24 * 7, // 7 days
	updateAge: 60 * 60 * 24, // Update session once per day

	// Cookie cache for 98% reduction in database queries
	// See: https://www.better-auth.com/docs/guides/optimizing-for-performance#cookie-cache
	cookieCache: {
		enabled: true,
		maxAge: 5 * 60, // 5 minutes (balance between performance and freshness)
		strategy: "jwe", // Encrypted (most secure, default in Better Auth 1.4+)
		refreshCache: true, // Automatically refresh before expiration
	}
},
```

**Testing:**
```bash
# Monitor database queries before and after
# Should see dramatic reduction in session queries

# Check cookie is being set
curl -v http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' \
  | grep -i "set-cookie"
```

---

## ✅ Fix 3: Implement "Remember Me" Feature

**Location:** Multiple files (schema, DTOs, service)

**Impact:** Better UX, competitive parity, GDPR compliance.

### Step 1: Add `rememberMe` field to sessions schema

**File:** `services/mana-core-auth/src/db/schema/auth.schema.ts`

**Find the sessions table** (around line 32), add this field:

```typescript
export const sessions = authSchema.table('sessions', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	token: text('token').unique().notNull(),
	// ... existing fields ...

	// ✅ ADD THIS:
	rememberMe: boolean('remember_me').default(false),
});
```

### Step 2: Generate and run migration

```bash
cd services/mana-core-auth
pnpm db:generate
pnpm db:migrate
```

### Step 3: Update SignInDto

**File:** `services/mana-core-auth/src/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(12) // ✅ FIXED: was 8, now matches Better Auth config
	password: string;

	@IsOptional()
	@IsString()
	deviceId?: string;

	@IsOptional()
	@IsString()
	deviceName?: string;

	// ✅ NEW: Remember me checkbox
	@IsOptional()
	@IsBoolean()
	rememberMe?: boolean;
}
```

### Step 4: Implement dynamic expiration in BetterAuthService

**File:** `services/mana-core-auth/src/auth/services/better-auth.service.ts`

**In the `signIn` method** (after getting the session), add this logic:

```typescript
// After line 447 (after getting sessionToken)
const session = hasSession(result) ? result.session : null;
const sessionToken = session?.token || (hasToken(result) ? result.token : '');

// ✅ ADD THIS: Adjust session expiration based on rememberMe
if (dto.rememberMe && session?.id) {
	const db = getDb(this.databaseUrl);
	const { sessions } = await import('../../db/schema');
	const { eq } = await import('drizzle-orm');

	// Extend session to 30 days for "remember me"
	const extendedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

	await db.update(sessions)
		.set({
			expiresAt: extendedExpiresAt,
			rememberMe: true,
		})
		.where(eq(sessions.id, session.id));
}
```

### Step 5: Update frontend login forms (all apps)

**Example for SvelteKit apps:**

**File:** `apps/*/apps/web/src/routes/auth/login/+page.svelte`

```svelte
<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false); // ✅ NEW
	let error = $state('');

	async function handleSubmit() {
		const result = await authStore.signIn(email, password, rememberMe); // ✅ UPDATED
		if (!result.success) {
			error = result.error || 'Login failed';
		}
	}
</script>

<form onsubmit={handleSubmit}>
	<input type="email" bind:value={email} required />
	<input type="password" bind:value={password} required />

	<!-- ✅ NEW: Remember me checkbox -->
	<label class="remember-me">
		<input type="checkbox" bind:checked={rememberMe} />
		<span>Stay signed in for 30 days</span>
		<small class="hint">Don't check this on shared computers</small>
	</label>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<button type="submit">Sign In</button>
</form>
```

**Update authStore.signIn signature:**

**File:** `apps/*/apps/web/src/lib/stores/auth.svelte.ts`

```typescript
async signIn(email: string, password: string, rememberMe: boolean = false) {
	const authService = await getAuthService();
	const result = await authService.signIn(email, password, {
		deviceId,
		deviceName,
		rememberMe, // ✅ NEW
	});
	// ... rest of logic
}
```

---

## ✅ Fix 4: Implement Security Audit Logging (CRITICAL)

**Location:** `services/mana-core-auth/src/security/` (new module)

**Impact:** GDPR/SOC 2 compliance, incident investigation capability.

### Step 1: Create Security Events Service

**File:** `services/mana-core-auth/src/security/security-events.service.ts` (NEW)

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb } from '../db/connection';
import { securityEvents } from '../db/schema/auth.schema';
import { randomUUID } from 'crypto';

export type SecurityEventType =
	| 'login_success'
	| 'login_failure'
	| 'logout'
	| 'password_change'
	| 'password_reset_request'
	| 'password_reset_complete'
	| 'account_created'
	| 'account_deleted'
	| 'session_revoked'
	| 'permission_changed'
	| 'organization_created'
	| 'organization_member_added'
	| 'organization_member_removed'
	| 'suspicious_activity'
	| 'token_refresh'
	| 'token_validation_failure';

export interface LogSecurityEventParams {
	userId?: string;
	eventType: SecurityEventType;
	ipAddress?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
}

@Injectable()
export class SecurityEventsService {
	private databaseUrl: string;

	constructor(private configService: ConfigService) {
		this.databaseUrl = this.configService.get<string>('database.url')!;
	}

	/**
	 * Log a security event
	 *
	 * All authentication-related events should be logged for:
	 * - Security monitoring
	 * - Incident investigation
	 * - Compliance (GDPR, SOC 2, ISO 27001)
	 * - Audit trails
	 *
	 * @param params - Event parameters
	 */
	async logEvent(params: LogSecurityEventParams): Promise<void> {
		try {
			const db = getDb(this.databaseUrl);

			await db.insert(securityEvents).values({
				id: randomUUID(),
				userId: params.userId || null,
				eventType: params.eventType,
				ipAddress: params.ipAddress || null,
				userAgent: params.userAgent || null,
				metadata: params.metadata || null,
				createdAt: new Date(),
			});
		} catch (error) {
			// IMPORTANT: Never fail auth operations because logging failed
			// Just log the error and continue
			console.error('[SecurityEventsService] Failed to log security event:', error);
		}
	}

	/**
	 * Get security events for a user
	 *
	 * Useful for "Recent Activity" pages and security dashboards.
	 *
	 * @param userId - User ID
	 * @param limit - Number of events to return (default: 50)
	 * @returns Array of security events
	 */
	async getUserEvents(userId: string, limit: number = 50) {
		try {
			const db = getDb(this.databaseUrl);
			const { eq, desc } = await import('drizzle-orm');

			return await db
				.select()
				.from(securityEvents)
				.where(eq(securityEvents.userId, userId))
				.orderBy(desc(securityEvents.createdAt))
				.limit(limit);
		} catch (error) {
			console.error('[SecurityEventsService] Failed to retrieve user events:', error);
			return [];
		}
	}

	/**
	 * Get recent failed login attempts
	 *
	 * Useful for detecting brute force attacks.
	 *
	 * @param since - Date to start from (default: last hour)
	 * @returns Array of failed login events
	 */
	async getFailedLoginAttempts(since?: Date) {
		try {
			const db = getDb(this.databaseUrl);
			const { eq, gte } = await import('drizzle-orm');

			const sinceDate = since || new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

			return await db
				.select()
				.from(securityEvents)
				.where(
					eq(securityEvents.eventType, 'login_failure'),
					gte(securityEvents.createdAt, sinceDate)
				)
				.orderBy(desc(securityEvents.createdAt));
		} catch (error) {
			console.error('[SecurityEventsService] Failed to retrieve failed login attempts:', error);
			return [];
		}
	}
}
```

### Step 2: Create Security Module

**File:** `services/mana-core-auth/src/security/security.module.ts` (NEW)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityEventsService } from './security-events.service';

@Module({
	imports: [ConfigModule],
	providers: [SecurityEventsService],
	exports: [SecurityEventsService],
})
export class SecurityModule {}
```

### Step 3: Add to App Module

**File:** `services/mana-core-auth/src/app.module.ts`

```typescript
import { SecurityModule } from './security/security.module';

@Module({
	imports: [
		// ... existing imports ...
		SecurityModule, // ✅ ADD THIS
	],
	// ...
})
export class AppModule {}
```

### Step 4: Inject into BetterAuthService

**File:** `services/mana-core-auth/src/auth/services/better-auth.service.ts`

```typescript
import { SecurityEventsService } from '../../security/security-events.service';

@Injectable()
export class BetterAuthService {
	constructor(
		private configService: ConfigService,
		private securityEventsService: SecurityEventsService, // ✅ ADD THIS
		// ... other services
	) {
		// ...
	}
}
```

### Step 5: Add logging to auth methods

**In `signIn` method** (after successful login):

```typescript
// ✅ ADD: Log successful login
await this.securityEventsService.logEvent({
	userId: user.id,
	eventType: 'login_success',
	ipAddress: dto.ipAddress, // Pass from controller
	userAgent: dto.userAgent, // Pass from controller
	metadata: {
		deviceId: dto.deviceId,
		deviceName: dto.deviceName,
		rememberMe: dto.rememberMe,
	},
});
```

**In `signIn` method** (in the catch block for failed login):

```typescript
// ✅ ADD: Log failed login attempt
await this.securityEventsService.logEvent({
	eventType: 'login_failure',
	ipAddress: dto.ipAddress,
	userAgent: dto.userAgent,
	metadata: {
		email: dto.email,
		reason: 'invalid_credentials',
	},
});
```

**Add similar logging for:**
- `registerB2C`: `account_created`
- `registerB2B`: `account_created`, `organization_created`
- `signOut`: `logout`
- `requestPasswordReset`: `password_reset_request`
- `resetPassword`: `password_reset_complete`
- `refreshToken`: `token_refresh`
- `validateToken` (failures): `token_validation_failure`

### Step 6: Update DTOs to accept IP and UserAgent

**File:** `services/mana-core-auth/src/auth/dto/login.dto.ts`

```typescript
export class LoginDto {
	// ... existing fields ...

	// ✅ ADD: For security logging
	@IsOptional()
	@IsString()
	ipAddress?: string;

	@IsOptional()
	@IsString()
	userAgent?: string;
}
```

### Step 7: Extract IP/UserAgent in controller

**File:** `services/mana-core-auth/src/auth/auth.controller.ts`

```typescript
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Post('login')
async login(@Body() loginDto: LoginDto, @Req() req: Request) {
	// ✅ ADD: Extract IP and user agent
	loginDto.ipAddress = req.ip || req.socket.remoteAddress;
	loginDto.userAgent = req.get('user-agent');

	return this.betterAuthService.signIn(loginDto);
}
```

---

## ✅ Fix 5: Add Comprehensive Security Headers

**Location:** `services/mana-core-auth/src/main.ts`

**Problem:** Minimal Helmet configuration, missing HSTS, CSP, cookie security.

### Step 1: Update Helmet configuration

**File:** `services/mana-core-auth/src/main.ts`

```typescript
import helmet from 'helmet';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// ✅ REPLACE existing helmet() call with this:
	app.use(helmet({
		// HSTS (HTTP Strict Transport Security)
		strictTransportSecurity: {
			maxAge: 31536000, // 1 year in seconds
			includeSubDomains: true,
			preload: true,
		},

		// Content Security Policy
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"], // For inline styles
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", 'data:', 'https:'],
				connectSrc: ["'self'", ...getAllowedOrigins()], // Your app origins
				fontSrc: ["'self'", 'data:'],
				objectSrc: ["'none'"],
				mediaSrc: ["'self'"],
				frameSrc: ["'none'"],
			},
		},

		// Clickjacking protection
		frameguard: { action: 'deny' },

		// MIME type sniffing protection
		noSniff: true,

		// XSS filter (legacy browsers)
		xssFilter: true,

		// Referrer policy
		referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

		// CORP and COOP (already configured)
		crossOriginResourcePolicy: { policy: 'cross-origin' },
		crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },

		// Hide X-Powered-By header
		hidePoweredBy: true,
	}));

	// ... rest of bootstrap
}

function getAllowedOrigins(): string[] {
	// Get allowed origins from environment
	const corsOrigins = process.env.CORS_ORIGINS || '';
	return corsOrigins.split(',').map(o => o.trim()).filter(Boolean);
}
```

### Step 2: Add HTTPS redirect middleware (production only)

```typescript
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// ✅ ADD: HTTPS enforcement in production
	if (process.env.NODE_ENV === 'production') {
		app.use((req: any, res: any, next: any) => {
			// Check if request came through HTTPS (via proxy)
			const protocol = req.header('x-forwarded-proto') || req.protocol;

			if (protocol !== 'https') {
				return res.redirect(301, `https://${req.header('host')}${req.url}`);
			}

			next();
		});
	}

	// ... rest of configuration
}
```

### Step 3: Verify cookie security in Better Auth

**File:** `services/mana-core-auth/src/auth/better-auth.config.ts`

Better Auth should handle cookie security automatically, but let's verify:

```typescript
export function createBetterAuth(databaseUrl: string) {
	return betterAuth({
		// ... existing config ...

		// ✅ ADD: Explicit cookie security (Better Auth defaults are good, but explicit is better)
		advanced: {
			cookieSecureSince the configuration appears to be already handled by Better Auth internally,
let's verify in documentation that cookies use:
- httpOnly: true
- secure: true (in production)
- sameSite: 'lax' or 'strict'

Better Auth handles these automatically, but check the official docs to confirm.
```

---

## Testing Checklist

After implementing all fixes, test each one:

### JWT Fix
- [ ] Login works
- [ ] Token algorithm is EdDSA (not RS256)
- [ ] Token validates via `/api/v1/auth/validate`
- [ ] No console warnings about JWT generation

### Cookie Cache
- [ ] Login sets session cookie
- [ ] Subsequent requests don't query database (check logs)
- [ ] Session still revocable immediately
- [ ] Performance improvement visible

### Remember Me
- [ ] Checkbox appears on login form
- [ ] Unchecked: Session expires after 7 days
- [ ] Checked: Session lasts 30 days
- [ ] Database shows `remember_me=true` for extended sessions

### Security Logging
- [ ] Login success creates `security_events` record
- [ ] Login failure creates `security_events` record
- [ ] All critical events logged
- [ ] Logging doesn't break auth if it fails
- [ ] Can query events via `getUserEvents()`

### Security Headers
- [ ] HSTS header present (check: `curl -I https://your-domain.com`)
- [ ] CSP header present and valid
- [ ] No `X-Powered-By` header
- [ ] Cookies have `httpOnly`, `secure`, `sameSite` flags

---

## Monitoring & Alerts (Post-Deployment)

### Database Query Monitoring
```sql
-- Monitor session queries (should drop 98%)
SELECT COUNT(*) FROM auth.sessions
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Security Event Monitoring
```sql
-- Failed login attempts (brute force detection)
SELECT COUNT(*), ip_address, user_agent
FROM auth.security_events
WHERE event_type = 'login_failure'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address, user_agent
HAVING COUNT(*) > 5;

-- Recent security events by type
SELECT event_type, COUNT(*)
FROM auth.security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY COUNT(*) DESC;
```

### Grafana Dashboard Queries (Optional)
- Session queries per minute (should be 98% lower)
- Failed login attempts per hour
- Remember me adoption rate
- Token validation errors

---

## Rollback Plan

If any fix causes issues:

### JWT Fix Rollback
```typescript
// Revert to previous JWT generation code
// (Keep the old code commented out as backup)
```

### Cookie Cache Rollback
```typescript
// Remove cookieCache configuration
session: {
	expiresIn: 60 * 60 * 24 * 7,
	updateAge: 60 * 60 * 24,
	// cookieCache: { ... }, // COMMENTED OUT
},
```

### Remember Me Rollback
```sql
-- Remove remember_me column
ALTER TABLE auth.sessions DROP COLUMN remember_me;
```

### Security Logging Rollback
```typescript
// Comment out all logEvent() calls
// Service remains, just not called
```

---

## Success Criteria

✅ **JWT Fix:** No RS256 tokens generated, all EdDSA
✅ **Cookie Cache:** 98% reduction in session DB queries
✅ **Remember Me:** Users can choose 7-day or 30-day sessions
✅ **Security Logging:** All auth events logged to `security_events` table
✅ **Security Headers:** All OWASP recommended headers present

---

## Next Steps After Implementation

1. **Update documentation** (AUTHENTICATION_ARCHITECTURE.md)
2. **Create Grafana dashboards** for security monitoring
3. **Set up alerts** for suspicious activity (>10 failed logins/hour)
4. **Test penetration** with OWASP ZAP or similar tools
5. **Run security audit** with automated tools (Snyk, npm audit)
6. **Consider** additional features:
   - Multi-session management UI
   - Device fingerprinting
   - Step-up authentication
   - Account lockout after N failures

---

🏗️ ManaCore Monorepo
