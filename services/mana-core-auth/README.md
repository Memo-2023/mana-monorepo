# Mana Core Auth

Central authentication and credit management system for the Mana Universe ecosystem.

## Features

- **JWT-based Authentication** (EdDSA algorithm via Better Auth)
  - User registration and login
  - Refresh token rotation
  - Multi-session management
  - JWKS endpoint for token verification

- **Credit System**
  - User balance management
  - Transaction ledger (purchase, usage, refund, gift)
  - Optimistic locking for concurrency
  - Idempotency for credit operations
  - Gift code system with auto-redemption on registration

- **Security**
  - Row-Level Security (RLS) on PostgreSQL
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - SCRAM-SHA-256 password authentication

- **Infrastructure**
  - Docker-based deployment
  - Traefik reverse proxy with automatic SSL
  - PgBouncer connection pooling
  - Redis caching
  - Prometheus + Grafana monitoring

## Quick Start

### Development Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Generate JWT keys**

   ```bash
   cd mana-core-auth
   ./scripts/generate-keys.sh
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and add your JWT keys and other configuration
   ```

4. **Start PostgreSQL and Redis** (using Docker)

   ```bash
   docker-compose up postgres redis -d
   ```

5. **Run migrations**

   ```bash
   pnpm migration:generate
   pnpm migration:run
   ```

6. **Start development server**

   ```bash
   pnpm start:dev
   ```

   The server will be available at `http://localhost:3001/api/v1`

### Production Deployment (Docker)

1. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Generate JWT keys**

   ```bash
   ./mana-core-auth/scripts/generate-keys.sh
   # Add the generated keys to .env
   ```

3. **Start all services**

   ```bash
   docker-compose up -d
   ```

4. **Check service health**
   ```bash
   docker-compose ps
   docker-compose logs -f mana-core-auth
   ```

## API Endpoints

### Authentication

**POST** `/api/v1/auth/register`

- Register a new user
- Body: `{ email, password, name? }`
- Returns: User object

**POST** `/api/v1/auth/login`

- Login with email and password
- Body: `{ email, password, deviceId?, deviceName? }`
- Returns: `{ user, accessToken, refreshToken, expiresIn, tokenType }`

**POST** `/api/v1/auth/refresh`

- Refresh access token
- Body: `{ refreshToken }`
- Returns: New token pair

**POST** `/api/v1/auth/logout`

- Logout and revoke session
- Requires: Bearer token
- Returns: Success message

**POST** `/api/v1/auth/validate`

- Validate a JWT token
- Body: `{ token }`
- Returns: `{ valid, payload }`

### Credits

**GET** `/api/v1/credits/balance`

- Get current credit balance
- Requires: Bearer token
- Returns: `{ balance, totalEarned, totalSpent }`

**POST** `/api/v1/credits/use`

- Deduct credits from balance
- Requires: Bearer token
- Body: `{ amount, appId, description, idempotencyKey?, metadata? }`
- Returns: Transaction details

**GET** `/api/v1/credits/transactions?limit=50&offset=0`

- Get transaction history
- Requires: Bearer token
- Returns: Array of transactions

**GET** `/api/v1/credits/purchases`

- Get purchase history
- Requires: Bearer token
- Returns: Array of purchases

**GET** `/api/v1/credits/packages`

- Get available credit packages
- Requires: Bearer token
- Returns: Array of packages

## Database Schema

### Auth Schema

- `auth.users` - User accounts
- `auth.sessions` - Active sessions
- `auth.passwords` - Hashed passwords
- `auth.accounts` - OAuth provider accounts
- `auth.verification_tokens` - Email verification & password reset
- `auth.two_factor_auth` - 2FA configuration
- `auth.security_events` - Security audit log

### Credits Schema

- `credits.balances` - User credit balances
- `credits.transactions` - Transaction ledger
- `credits.packages` - Available credit packages
- `credits.purchases` - Purchase history
- `credits.usage_stats` - Usage analytics

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis configuration
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Stripe integration
- `CORS_ORIGINS` - Allowed origins for CORS
- `BASE_URL` - Base URL for JWKS endpoint (e.g., http://localhost:3001)

## Development

### Available Scripts

```bash
# Start development server with hot-reload
pnpm start:dev

# Build for production
pnpm build

# Start production server
pnpm start:prod

# Run tests
pnpm test

# Generate database migration
pnpm migration:generate

# Run migrations
pnpm migration:run

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Lint and format
pnpm lint
pnpm format
```

## Architecture

### Token Flow

1. User registers/logs in → Receives `accessToken` (15min) + `refreshToken` (7 days)
2. Client stores tokens securely (httpOnly cookies on web, SecureStore on mobile)
3. Client includes `Authorization: Bearer <accessToken>` in requests
4. When access token expires, client uses refresh token to get new pair
5. Refresh tokens are single-use (rotation for security)

### Credit System

- **Paid Credits**: Purchased via Stripe (100 mana = €1)
- **Gift Codes**: Can be created and redeemed, auto-redeem on registration if pending
- **Transaction Types**: purchase, usage, refund, gift
- **Idempotency**: Duplicate requests with same key are detected and ignored
- **Concurrency**: Optimistic locking prevents race conditions

## Security Considerations

1. **JWT Keys**: Better Auth auto-generates EdDSA keys stored in `auth.jwks` table
2. **Database**: Use strong passwords and enable SSL in production
3. **Redis**: Always set a password for Redis
4. **CORS**: Only allow trusted origins
5. **Rate Limiting**: Configured via Traefik and NestJS throttler
6. **RLS Policies**: Enforce data isolation at database level
7. **HTTPS**: Always use SSL/TLS in production (via Traefik)

## Monitoring

- **Prometheus**: Available at `http://localhost:9090`
- **Grafana**: Available at `http://localhost:3000`
- **Logs**: `docker-compose logs -f mana-core-auth`

## License

Private - Mana Universe

## Support

For issues and questions, contact the development team.
