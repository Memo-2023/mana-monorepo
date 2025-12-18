# Quick Start Guide - Mana Core Auth

Get the authentication system running in 5 minutes!

## Prerequisites

- Node.js 20+
- pnpm 9.15.0+
- Docker & Docker Compose
- OpenSSL (for key generation)

## Step 1: Generate JWT Keys (2 minutes)

```bash
cd mana-core-auth
chmod +x scripts/generate-keys.sh
./scripts/generate-keys.sh
```

This will create `private.pem` and `public.pem` and show you the formatted keys for .env

## Step 2: Configure Environment (1 minute)

```bash
# Copy the example
cp .env.example .env

# Edit .env and add:
# 1. JWT keys from Step 1
# 2. Change default passwords
# 3. Add Stripe test keys (optional for now)
```

**Minimum required changes in .env:**

```env
POSTGRES_PASSWORD=your-secure-password-here
REDIS_PASSWORD=your-redis-password-here
```

> **Note:** JWT signing keys are managed automatically by Better Auth (EdDSA/Ed25519).
> No manual key generation is required - keys are stored in the `auth.jwks` database table.

## Step 3: Start Infrastructure (30 seconds)

```bash
# From monorepo root
docker-compose up postgres redis -d

# Wait for services to be healthy
docker-compose ps
```

## Step 4: Run Migrations (10 seconds)

```bash
cd mana-core-auth
pnpm migration:run
```

Expected output:

```
Running migrations...
Migrations completed successfully
```

## Step 5: Start the Service (10 seconds)

```bash
pnpm start:dev
```

You should see:

```
🚀 Mana Core Auth running on: http://localhost:3001
📚 Environment: development
```

## Test It Works!

### 1. Register a User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

Expected response:

```json
{
	"id": "uuid-here",
	"email": "test@example.com",
	"name": "Test User",
	"createdAt": "2025-11-25T..."
}
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Expected response:

```json
{
	"user": {
		"id": "uuid-here",
		"email": "test@example.com",
		"name": "Test User",
		"role": "user"
	},
	"accessToken": "eyJhbGciOiJSUzI1NiIs...",
	"refreshToken": "long-random-string",
	"expiresIn": 900,
	"tokenType": "Bearer"
}
```

### 3. Check Credit Balance

```bash
# Replace YOUR_TOKEN with accessToken from login
curl -X GET http://localhost:3001/api/v1/credits/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:

```json
{
	"balance": 0,
	"freeCreditsRemaining": 150,
	"totalEarned": 0,
	"totalSpent": 0,
	"dailyFreeCredits": 5
}
```

### 4. Use Some Credits

```bash
curl -X POST http://localhost:3001/api/v1/credits/use \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "appId": "test",
    "description": "Test credit usage",
    "idempotencyKey": "test-unique-123"
  }'
```

Expected response:

```json
{
	"success": true,
	"transaction": {
		"id": "uuid-here",
		"userId": "uuid-here",
		"type": "usage",
		"status": "completed",
		"amount": -10,
		"balanceBefore": 150,
		"balanceAfter": 140,
		"appId": "test",
		"description": "Test credit usage"
	},
	"newBalance": {
		"balance": 0,
		"freeCreditsRemaining": 140,
		"totalSpent": 10
	}
}
```

## You're Done! 🎉

The authentication system is now running and ready to use.

## Next Steps

1. **Integrate with your apps**
   - Add the auth endpoints to your mobile/web apps
   - Implement token refresh logic
   - Store tokens securely (SecureStore on mobile, httpOnly cookies on web)

2. **Add Stripe integration**
   - Get Stripe API keys
   - Add webhook endpoint
   - Create credit packages
   - Test payment flow

3. **Production deployment**
   - Follow DOCKER_DEPLOYMENT_GUIDE.md
   - Set up on VPS
   - Configure domain and SSL
   - Enable monitoring

## Troubleshooting

### "Connection refused" to PostgreSQL

**Problem:** Database not ready yet

**Solution:**

```bash
docker-compose ps  # Check if postgres is healthy
docker-compose logs postgres  # Check logs
```

### "JWT key not found" error

**Problem:** JWT keys not set in .env

**Solution:**

```bash
# Run the key generator again
./scripts/generate-keys.sh

# Copy the keys to .env
# Make sure they're properly escaped (with \n for newlines)
```

### Migrations fail

**Problem:** Database schema issues

**Solution:**

```bash
# Drop and recreate database
docker-compose down -v
docker-compose up postgres -d
# Wait 10 seconds
pnpm migration:run
```

### Port 3001 already in use

**Problem:** Another service is using the port

**Solution:**

```bash
# Change PORT in .env
echo "PORT=3002" >> .env

# Or kill the process using 3001
lsof -ti:3001 | xargs kill
```

## Development Tips

### Watch Database Changes

```bash
pnpm db:studio
# Opens Drizzle Studio at http://localhost:4983
```

### View Logs

```bash
# Application logs
# The service prints to console when running in dev mode

# Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Run Tests

```bash
pnpm test
pnpm test:watch
pnpm test:cov
```

### Format Code

```bash
pnpm format
pnpm lint
```

## Common Commands

```bash
# Start dev server
pnpm start:dev

# Build for production
pnpm build

# Start production server
pnpm start:prod

# Generate new migration
pnpm migration:generate

# Run migrations
pnpm migration:run

# Open database GUI
pnpm db:studio
```

## Environment Variables Reference

### Required

- `DATABASE_URL` - PostgreSQL connection string

### JWT Configuration (all optional - Better Auth manages keys automatically)

- `JWT_ISSUER` - JWT issuer claim (default: manacore)
- `JWT_AUDIENCE` - JWT audience claim (default: manacore)
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token lifetime (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token lifetime (default: 7d)

> **Note:** JWT signing uses EdDSA (Ed25519) via Better Auth. Keys are auto-generated and stored in `auth.jwks` table.

### Optional (have defaults)

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (default: development)
- `REDIS_HOST` - Redis host (default: localhost)
- `CORS_ORIGINS` - Allowed origins (default: localhost:3000,localhost:8081)
- `CREDITS_SIGNUP_BONUS` - Signup credits (default: 150)
- `CREDITS_DAILY_FREE` - Daily free credits (default: 5)

### For Production

- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `ACME_EMAIL` - Email for Let's Encrypt SSL
- `AUTH_DOMAIN` - Domain name for the service

## Resources

- **Full Documentation:** `README.md`
- **Database Schema:** `docs/DATABASE_SCHEMA.md`
- **Migration Guide:** `MIGRATIONS.md`

## Support

If you encounter issues:

1. Check this guide first
2. Review the logs
3. Consult the master plan
4. Ask the development team

---

**Time to Complete:** ~5 minutes

**Status:** Ready for Development & Testing
