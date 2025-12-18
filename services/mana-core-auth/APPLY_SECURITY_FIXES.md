# Apply Security Fixes - Quick Start Guide

This guide provides the quickest path to implementing all critical security fixes.

## Pre-Flight Checklist

- [ ] Backup current code: `git stash` or create a branch
- [ ] Review the complete analysis: `docs/MANA_CORE_AUTH_ANALYSIS.md`
- [ ] Review implementation guide: `docs/SECURITY_FIXES_IMPLEMENTATION_GUIDE.md`

## Quick Apply (Recommended Order)

### Fix 1: JWT Fallback - MANUAL EDIT REQUIRED ⚠️

The JWT fallback code needs to be manually edited because the file has been recently modified.

**File:** `src/auth/services/better-auth.service.ts`
**Lines:** ~449-508

**Find this block** (search for "Generate JWT access token"):

```typescript
// Generate JWT access token using Better Auth's JWT plugin
let accessToken = '';
try {
	const jwtResult = await this.api.signJWT({
		// ... lots of code ...
	});
	// ... fallback code with RS256 ...
} catch (jwtError) {
	// Manual JWT generation fallback
}
```

**Replace entire block with:**

```typescript
// Generate JWT access token using Better Auth's JWT plugin
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
		authorization: `Bearer ${sessionToken}`,
	},
});

const accessToken = jwtResult?.token;

if (!accessToken) {
	throw new UnauthorizedException('Failed to generate access token');
}
```

**Verification:**

```bash
cd services/mana-core-auth
pnpm start:dev
# Test login, check console for EdDSA tokens
```

---

### Fix 2: Cookie Cache - READY TO APPLY ✅

**File:** `src/auth/better-auth.config.ts`
**Line:** ~148

Run this command to apply:

```bash
cd services/mana-core-auth

# Backup first
cp src/auth/better-auth.config.ts src/auth/better-auth.config.ts.backup

# Then manually edit or use this patch
```

**Manual edit:** Find `session:` block, add after `updateAge`:

```typescript
session: {
	expiresIn: 60 * 60 * 24 * 7,
	updateAge: 60 * 60 * 24,

	// ✅ ADD THIS BLOCK:
	cookieCache: {
		enabled: true,
		maxAge: 5 * 60, // 5 minutes
		strategy: "jwe", // Encrypted
		refreshCache: true,
	}
},
```

**Verification:**

```bash
# Check response headers after login
curl -v http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"yourpassword"}' \
  | grep -i "set-cookie"
```

---

### Fix 3: Remember Me Feature - MULTI-STEP

#### Step 3a: Schema Change

**File:** `src/db/schema/auth.schema.ts`
**Line:** ~32 (in sessions table)

Add this field:

```typescript
export const sessions = authSchema.table('sessions', {
	// ... existing fields ...

	// ✅ ADD THIS:
	rememberMe: boolean('remember_me').default(false),
});
```

#### Step 3b: Run Migration

```bash
cd services/mana-core-auth
pnpm db:generate
pnpm db:migrate
```

#### Step 3c: Update DTO

**File:** `src/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(12) // ✅ FIXED: was 8
	password: string;

	@IsOptional()
	@IsString()
	deviceId?: string;

	@IsOptional()
	@IsString()
	deviceName?: string;

	// ✅ NEW:
	@IsOptional()
	@IsBoolean()
	rememberMe?: boolean;

	@IsOptional()
	@IsString()
	ipAddress?: string;

	@IsOptional()
	@IsString()
	userAgent?: string;
}
```

#### Step 3d: Update signIn Method

**File:** `src/auth/services/better-auth.service.ts`

**After line 447** (after `const sessionToken = ...`), add:

```typescript
// Adjust session expiration based on rememberMe
if (dto.rememberMe && session?.id) {
	const db = getDb(this.databaseUrl);
	const { sessions } = await import('../../db/schema');
	const { eq } = await import('drizzle-orm');

	const extendedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

	await db
		.update(sessions)
		.set({
			expiresAt: extendedExpiresAt,
			rememberMe: true,
		})
		.where(eq(sessions.id, session.id));
}
```

---

### Fix 4: Security Logging - NEW FILES

#### Step 4a: Create SecurityEventsService

```bash
mkdir -p services/mana-core-auth/src/security
```

Create file: `src/security/security-events.service.ts`

```bash
cat > services/mana-core-auth/src/security/security-events.service.ts << 'EOF'
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
	| 'account_created'
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
			console.error('[SecurityEventsService] Failed to log security event:', error);
		}
	}
}
EOF
```

#### Step 4b: Create SecurityModule

Create file: `src/security/security.module.ts`

```bash
cat > services/mana-core-auth/src/security/security.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityEventsService } from './security-events.service';

@Module({
	imports: [ConfigModule],
	providers: [SecurityEventsService],
	exports: [SecurityEventsService],
})
export class SecurityModule {}
EOF
```

#### Step 4c: Add to AppModule

**File:** `src/app.module.ts`

Add import:

```typescript
import { SecurityModule } from './security/security.module';
```

Add to imports array:

```typescript
@Module({
	imports: [
		// ... existing imports ...
		SecurityModule, // ✅ ADD THIS
	],
})
```

#### Step 4d: Inject into BetterAuthService

**File:** `src/auth/services/better-auth.service.ts`

Add import:

```typescript
import { SecurityEventsService } from '../../security/security-events.service';
```

Add to constructor:

```typescript
constructor(
	private configService: ConfigService,
	private securityEventsService: SecurityEventsService, // ✅ ADD THIS
	// ... other services
) {
	// ...
}
```

Add logging after successful login (after line ~519):

```typescript
// Log successful login
await this.securityEventsService
	.logEvent({
		userId: user.id,
		eventType: 'login_success',
		ipAddress: dto.ipAddress,
		userAgent: dto.userAgent,
		metadata: { deviceId: dto.deviceId, rememberMe: dto.rememberMe },
	})
	.catch((err) => console.error('Failed to log login success:', err));
```

Add logging for failed login (in catch block):

```typescript
// Log failed login
await this.securityEventsService
	.logEvent({
		eventType: 'login_failure',
		ipAddress: dto.ipAddress,
		userAgent: dto.userAgent,
		metadata: { email: dto.email },
	})
	.catch((err) => console.error('Failed to log login failure:', err));
```

---

### Fix 5: Security Headers - APPLY TO MAIN.TS

**File:** `src/main.ts`

**Replace existing `helmet()` call** with this:

```typescript
// Comprehensive security headers
app.use(
	helmet({
		strictTransportSecurity: {
			maxAge: 31536000,
			includeSubDomains: true,
			preload: true,
		},
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", 'data:', 'https:'],
				connectSrc: ["'self'"],
				fontSrc: ["'self'", 'data:'],
				objectSrc: ["'none'"],
				mediaSrc: ["'self'"],
				frameSrc: ["'none'"],
			},
		},
		frameguard: { action: 'deny' },
		noSniff: true,
		xssFilter: true,
		referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
		crossOriginResourcePolicy: { policy: 'cross-origin' },
		crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
		hidePoweredBy: true,
	})
);
```

**Add HTTPS enforcement** (after helmet, before other middleware):

```typescript
// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
	app.use((req: any, res: any, next: any) => {
		const protocol = req.header('x-forwarded-proto') || req.protocol;
		if (protocol !== 'https') {
			return res.redirect(301, `https://${req.header('host')}${req.url}`);
		}
		next();
	});
}
```

---

## Testing Checklist

After applying all fixes:

```bash
# 1. Build
cd services/mana-core-auth
pnpm build

# 2. Start
pnpm start:dev

# 3. Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456789","rememberMe":true}'

# 4. Check token algorithm
# (Should be EdDSA, not RS256)

# 5. Check security events table
psql $DATABASE_URL -c "SELECT * FROM auth.security_events ORDER BY created_at DESC LIMIT 5;"

# 6. Check session with rememberMe
psql $DATABASE_URL -c "SELECT id, user_id, remember_me, expires_at FROM auth.sessions ORDER BY created_at DESC LIMIT 5;"
```

---

## Rollback if Needed

```bash
# Restore backups
git restore .

# Or if you made backups:
cp src/auth/better-auth.config.ts.backup src/auth/better-auth.config.ts

# Revert migration
pnpm db:drop
pnpm db:push
```

---

## Success Criteria

✅ **JWT Fix:** Login generates EdDSA tokens (not RS256)
✅ **Cookie Cache:** Response includes encrypted session cookie
✅ **Remember Me:** Can login with 30-day session
✅ **Security Logging:** Events appear in `auth.security_events`
✅ **Security Headers:** HSTS, CSP headers present in responses

---

## Get Help

If you encounter issues:

1. Check the detailed guide: `docs/SECURITY_FIXES_IMPLEMENTATION_GUIDE.md`
2. Check the analysis: `docs/MANA_CORE_AUTH_ANALYSIS.md`
3. Review Better Auth docs: https://www.better-auth.com/docs

---

🏗️ ManaCore Monorepo
