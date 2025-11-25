# Authentication System Research - Executive Summary
**Researcher Agent | Hive Mind Collective**
**Date:** 2025-11-25

---

## Quick Recommendations

### Core Technology Stack
| Component | Recommendation | Why |
|-----------|----------------|-----|
| **Auth Framework** | Better Auth | Modern, TypeScript-first, comprehensive features, FREE |
| **Database** | PostgreSQL 16+ | Battle-tested, RLS for multi-tenancy, ACID compliance |
| **ORM** | Drizzle | Best Better Auth integration, type-safe, performant |
| **Payment** | Stripe | Industry standard, 47+ countries, excellent DX |
| **JWT Algorithm** | RS256 | Asymmetric keys for distributed systems |

---

## Key Findings

### 1. Better Auth vs Alternatives

**Better Auth** (RECOMMENDED)
- FREE and open-source (no usage limits)
- 2FA, passkeys, multi-session, organization management built-in
- Automatic schema generation and migrations
- Framework-agnostic (perfect for your NestJS/Expo/SvelteKit stack)
- YC-backed with active development

**Alternatives Considered:**
- **Auth.js:** Maintenance concerns (one person maintaining 90% of work)
- **Supabase Auth:** Critical reliability issues (random logouts, no session lifetime config, security concerns)
- **Clerk:** Excellent but expensive ($550/mo for 10k users)
- **Auth0:** Enterprise-grade but costly and overkill

### 2. PostgreSQL Security Best Practices

**Critical Configurations:**
- Use SCRAM-SHA-256 (replace MD5 immediately)
- Enable Row-Level Security (RLS) for all multi-tenant tables
- Set listen_addresses to specific IPs (not '*')
- Enable SSL/TLS for all connections
- Implement principle of least privilege

**RLS for Multi-Tenancy:**
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON posts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 3. JWT Security Best Practices

**Token Strategy:**
- Access tokens: 15-30 minutes expiration
- Refresh tokens: 7-14 days with rotation
- Algorithm: RS256 (asymmetric keys)
- Storage: httpOnly cookies (web), SecureStore (mobile)
- NEVER use localStorage

**Refresh Token Rotation:**
- Single-use refresh tokens
- New refresh token issued with each refresh
- Detects and blocks replay attacks
- Industry standard in 2025

**Claims Validation:**
```typescript
interface StandardClaims {
  iss: string;  // Issuer - MUST validate
  sub: string;  // Subject (user ID)
  aud: string | string[];  // Audience - MUST validate
  exp: number;  // Expiration - MUST validate
  iat: number;  // Issued at
  nbf?: number; // Not before
}
```

### 4. Credit System Architecture

**Pattern: Double-Entry Ledger**
- Every transaction creates debit + credit entries
- Ensures financial accuracy
- Complete audit trail
- Industry standard for financial systems

**Critical Features:**
- Use DECIMAL for monetary values (never FLOAT)
- Idempotency keys prevent duplicate charges
- Database transactions (BEGIN/COMMIT/ROLLBACK)
- Row locking during balance updates (SELECT FOR UPDATE)

**Schema Highlights:**
```sql
-- Accounts (user wallets)
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  balance DECIMAL(20, 2) NOT NULL CHECK (balance >= 0),
  -- ...
);

-- Transaction ledger
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,  -- Prevents duplicates
  amount DECIMAL(20, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  -- ...
);
```

### 5. Stripe Integration

**Integration Options:**
1. **Direct Integration** (Recommended initially)
   - Simple credit purchases
   - Single merchant
   - Easier setup

2. **Stripe Connect** (For future marketplace features)
   - Multi-party payments
   - Revenue sharing
   - More complex setup

**Critical Webhook Handling:**
```typescript
// ALWAYS verify webhook signatures
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
);

// Handle payment success
case 'payment_intent.succeeded':
  await creditUserAccount(paymentIntent.metadata);
  break;
```

**Best Practices:**
- Always verify webhook signatures
- Use idempotency keys for all operations
- Never trust client-side amounts
- Store Stripe customer ID in user table
- Test thoroughly in test mode

### 6. Multi-App Authentication Pattern

**Architecture:**
```
Mana Core Auth Service (Central)
    |
    ├── Issues: manaToken (universal)
    ├── Issues: appToken (app-specific, Supabase-compatible)
    └── Issues: refreshToken (long-lived)

Apps (Maerchenzauber, Memoro, Picture, Chat)
    └── Validate JWT + RLS policies + Use credits
```

**Token Types:**
1. **manaToken:** Universal auth across all apps
2. **appToken:** App-specific, Supabase RLS compatible
3. **refreshToken:** Long-lived, database-stored

**Shared Package:**
Create `@manacore/shared-auth` for:
- Platform-agnostic auth service
- Token management
- Auto-refresh logic
- Storage adapters (SecureStore, cookies)

---

## Implementation Priority

### Phase 1: Foundation (2 weeks)
- Set up Better Auth with PostgreSQL
- Generate RS256 key pair
- Basic auth API (login, register, refresh)
- JWT validation middleware

### Phase 2: Multi-App (2 weeks)
- Create @manacore/shared-auth package
- App-token generation
- Session management
- RLS policies

### Phase 3: Credits (2 weeks)
- Credit ledger schema
- Double-entry bookkeeping
- Idempotency handling
- Credit purchase/usage APIs

### Phase 4: Payments (2 weeks)
- Stripe integration
- Webhook handlers
- Payment method management
- Credit packages

### Phase 5: Advanced (4 weeks)
- 2FA
- Multi-session management
- Organization support
- OAuth providers

### Phase 6: Production (2 weeks)
- Security audit
- Performance testing
- Monitoring
- Documentation

**Total Estimated Time:** 14 weeks

---

## Cost Analysis

### Technology Costs

| Service | Cost | Notes |
|---------|------|-------|
| Better Auth | $0/month | Open-source, self-hosted |
| PostgreSQL | $25-200/month | Depends on hosting (Supabase Pro: $25/mo) |
| Stripe | 2.9% + $0.30/txn | Standard payment processing |
| Hosting | $20-100/month | For auth service (depends on scale) |

**Total Monthly:** ~$45-300/month (depending on scale)

### Comparison to Managed Solutions

| Solution | Cost at 10k Users | Cost at 100k Users |
|----------|-------------------|---------------------|
| Recommended Stack | ~$100/mo + Stripe fees | ~$300/mo + Stripe fees |
| Clerk | $550/mo | $2,500+/mo |
| Auth0 | $35-240/mo | $1,000+/mo |

**Savings:** Up to $2,000+/month at scale

---

## Risk Assessment

### Low Risk
- PostgreSQL (battle-tested, 25+ years)
- Stripe (industry standard)
- JWT with RS256 (well-established pattern)
- Double-entry ledger (accounting standard)

### Medium Risk
- Better Auth (new in 2024, but YC-backed and active)
  - Mitigation: Can migrate to Auth.js if needed (similar patterns)

### High Risk Areas to Monitor
- RLS policy configuration (extensive testing required)
- Webhook reliability (implement retry logic)
- Token revocation at scale (consider Redis for blacklist)

---

## Security Checklist

### Critical Must-Haves
- [ ] RS256 algorithm for JWT
- [ ] Token expiration (15min access, 7d refresh)
- [ ] Refresh token rotation
- [ ] httpOnly cookies (web) / SecureStore (mobile)
- [ ] HTTPS everywhere
- [ ] Stripe webhook signature verification
- [ ] PostgreSQL RLS enabled
- [ ] Idempotency keys for transactions
- [ ] Rate limiting on auth endpoints
- [ ] 2FA for admin accounts

### Additional Security
- [ ] Token blacklist (Redis)
- [ ] Device fingerprinting
- [ ] Suspicious activity monitoring
- [ ] Regular security audits
- [ ] Automated dependency updates
- [ ] Penetration testing

---

## Performance Considerations

### Expected Bottlenecks
1. **Database queries with RLS:**
   - Solution: Index tenant_id columns
   - Impact: Minimal with proper indexing

2. **JWT validation on every request:**
   - Solution: Cache public key, validate claims efficiently
   - Impact: <1ms per request

3. **Credit balance checks:**
   - Solution: Cache balances with TTL
   - Impact: Minimal with caching

### Scalability Targets
- 100 req/s: Easily achievable with single server
- 1,000 req/s: Requires load balancing + connection pooling
- 10,000 req/s: Requires distributed architecture + Redis

---

## Alternative Architectures Considered

### Alternative 1: Full Supabase Stack
**Pros:** Tight integration, managed infrastructure
**Cons:** Vendor lock-in, reliability concerns reported, limited customization
**Verdict:** Not recommended due to reliability issues

### Alternative 2: Clerk + Stripe
**Pros:** Best developer experience, managed solution
**Cons:** Extremely expensive ($550/mo for 10k users), vendor lock-in
**Verdict:** Too expensive for freemium model

### Alternative 3: Custom JWT + Prisma
**Pros:** Full control, familiar tools
**Cons:** Reinventing the wheel, maintenance burden, missing features (2FA, etc.)
**Verdict:** Better Auth provides same benefits with less work

---

## Next Steps

### Immediate Actions
1. **Set up Better Auth proof-of-concept** (2 days)
   - Install and configure
   - Test with PostgreSQL
   - Validate TypeScript generation

2. **Design database schema** (3 days)
   - User tables
   - Credit ledger
   - Sessions
   - RLS policies

3. **Create @manacore/shared-auth package** (5 days)
   - Auth service interface
   - Storage adapters
   - Token management

4. **Stripe account setup** (1 day)
   - Create test account
   - Configure webhooks
   - Design credit packages

### Decision Points
- Confirm Better Auth after POC
- Finalize credit pricing structure
- Choose hosting provider for auth service
- Decide on monitoring/observability stack

---

## Questions for Team

1. **Credit Pricing:** What should credit packages cost? (e.g., 100 credits for $9.99)
2. **Credit Expiration:** Should credits expire? If so, after how long?
3. **Subscription Model:** Offer monthly subscriptions or pay-as-you-go only?
4. **Multi-Tenancy:** Are organizations/teams a priority feature? (Better Auth supports this)
5. **OAuth Providers:** Which social login providers are required? (Google, GitHub, Apple?)
6. **Compliance:** Any specific compliance requirements? (GDPR, HIPAA, SOC 2?)

---

## Resources

### Full Report
- Comprehensive 12-section analysis: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/.hive-mind/auth-research-report.md`

### Key Documentation
- [Better Auth Docs](https://www.better-auth.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Stripe API Reference](https://docs.stripe.com/api)
- [JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)

---

## Confidence Levels

| Area | Confidence | Notes |
|------|-----------|-------|
| Better Auth | ⭐⭐⭐⭐☆ | New but YC-backed, excellent features |
| PostgreSQL + RLS | ⭐⭐⭐⭐⭐ | Battle-tested, industry standard |
| Stripe | ⭐⭐⭐⭐⭐ | Dominant market leader |
| JWT Strategy | ⭐⭐⭐⭐⭐ | Well-established best practices |
| Credit Ledger | ⭐⭐⭐⭐⭐ | Standard accounting pattern |

---

**Overall Assessment:** High confidence in recommended architecture. The stack is modern, cost-effective, secure, and aligns perfectly with the monorepo structure and technology choices (NestJS, Expo, SvelteKit).

**Recommendation:** Proceed with Better Auth + PostgreSQL + Stripe implementation.

---

*End of Executive Summary*
