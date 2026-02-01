# Mana Core Auth - Disaster Recovery

## Overview

This document describes backup, recovery, and disaster recovery procedures for the Mana Core Auth service.

## Data Assets

### Critical Data

| Data | Location | Recovery Priority |
|------|----------|-------------------|
| User accounts | `auth.users` table | Critical |
| Sessions | `auth.sessions` table | High (can regenerate) |
| JWKS keys | `auth.jwks` table | Critical |
| Organizations | `auth.organizations` table | Critical |
| Credit balances | `credits.balances` table | Critical |

### Non-Critical Data (Can Regenerate)

- Sessions (users can re-login)
- Verification tokens (users can request new ones)
- Rate limit counters (stored in Redis)

## Backup Strategy

### Database Backups

#### Automated Daily Backups

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/mana-core-auth"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/manacore_auth_${DATE}.sql.gz"

# Create backup
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_FILE" "s3://your-backup-bucket/mana-core-auth/"
```

#### Before Major Changes

Always create a manual backup before:
- Database migrations
- Schema changes
- Bulk data operations

```bash
pg_dump "$DATABASE_URL" > pre_migration_backup.sql
```

### Redis Backups (if used)

Redis data is ephemeral (sessions). No backup required, but you can:

```bash
# Create RDB snapshot
redis-cli BGSAVE

# Copy dump.rdb to backup location
cp /var/lib/redis/dump.rdb /backups/redis/
```

### JWKS Key Backup

The JWKS keys are critical for JWT validation. Back them up separately:

```bash
# Export JWKS keys
psql "$DATABASE_URL" -c "COPY auth.jwks TO '/backups/jwks_backup.csv' CSV HEADER;"
```

## Recovery Procedures

### Scenario 1: Database Corruption

1. **Stop the service**
   ```bash
   docker stop mana-core-auth
   ```

2. **Restore from backup**
   ```bash
   # Drop and recreate database
   psql -c "DROP DATABASE manacore_auth;"
   psql -c "CREATE DATABASE manacore_auth;"

   # Restore backup
   gunzip -c /backups/manacore_auth_20240201.sql.gz | psql manacore_auth
   ```

3. **Verify data integrity**
   ```bash
   psql manacore_auth -c "SELECT COUNT(*) FROM auth.users;"
   psql manacore_auth -c "SELECT COUNT(*) FROM auth.jwks;"
   ```

4. **Restart the service**
   ```bash
   docker start mana-core-auth
   ```

5. **Verify health**
   ```bash
   curl http://localhost:3001/health/ready
   ```

### Scenario 2: JWKS Key Loss

If JWKS keys are lost, all existing JWTs become invalid.

1. **Option A: Restore from backup**
   ```bash
   psql "$DATABASE_URL" -c "COPY auth.jwks FROM '/backups/jwks_backup.csv' CSV HEADER;"
   ```

2. **Option B: Generate new keys (forces all users to re-login)**
   ```bash
   # Better Auth will auto-generate new keys on startup
   # All existing sessions will be invalidated
   docker restart mana-core-auth
   ```

3. **Notify affected services**
   - All services caching the old JWKS need to refresh
   - Users will need to log in again

### Scenario 3: Complete Service Failure

1. **Provision new infrastructure**
   - New database instance
   - New Redis instance (if used)
   - New compute instance

2. **Restore database**
   ```bash
   # Create database
   psql -c "CREATE DATABASE manacore_auth;"

   # Restore latest backup
   gunzip -c /backups/latest.sql.gz | psql manacore_auth
   ```

3. **Update DNS/Load Balancer**
   - Point to new service instance

4. **Verify all integrations**
   - Check OIDC clients can authenticate
   - Check other services can validate tokens

### Scenario 4: Accidental Data Deletion

1. **Identify affected data**
   ```sql
   -- Check what's missing
   SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NOT NULL;
   ```

2. **Restore from point-in-time backup**
   ```bash
   # If using PostgreSQL with WAL archiving
   pg_restore --target-time="2024-02-01 10:00:00" backup.dump
   ```

3. **Selective restore**
   ```sql
   -- Restore specific users from backup database
   INSERT INTO auth.users
   SELECT * FROM backup_db.auth.users
   WHERE id IN ('user1', 'user2');
   ```

## Key Rotation

### Scheduled Key Rotation

JWKS keys should be rotated periodically (recommended: every 90 days).

1. **Generate new key**
   ```bash
   # Better Auth handles this automatically
   # Or manually via database
   ```

2. **Keep old key for grace period**
   - Old tokens remain valid until expiry
   - New tokens use new key

3. **Remove old key after grace period**
   ```sql
   DELETE FROM auth.jwks
   WHERE created_at < NOW() - INTERVAL '7 days'
   AND id != (SELECT id FROM auth.jwks ORDER BY created_at DESC LIMIT 1);
   ```

### Emergency Key Rotation

If keys are compromised:

1. **Immediately revoke old keys**
   ```sql
   DELETE FROM auth.jwks;
   ```

2. **Restart service to generate new keys**
   ```bash
   docker restart mana-core-auth
   ```

3. **Notify all integrated services**
   - They need to refresh their JWKS cache
   - All users will need to re-authenticate

## Monitoring & Alerts

### Critical Alerts

Set up alerts for:

1. **Backup failures**
   - Backup script exit code != 0
   - Backup file size = 0

2. **Database health**
   - Connection failures
   - Replication lag (if applicable)

3. **Service health**
   - /health/ready returning non-200
   - High error rate

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Service restart | 5 min | 0 |
| Database restore | 30 min | 24h (daily backup) |
| Complete rebuild | 2 hours | 24h |

## Runbook

### Daily Operations

- [ ] Verify backup completed
- [ ] Check monitoring dashboards
- [ ] Review error logs

### Weekly Operations

- [ ] Test backup restoration (staging)
- [ ] Review security logs
- [ ] Check disk space

### Monthly Operations

- [ ] Full disaster recovery drill
- [ ] Review and update this document
- [ ] Verify all contact information is current

## Contact Information

| Role | Contact |
|------|---------|
| On-call Engineer | oncall@yourcompany.com |
| Database Admin | dba@yourcompany.com |
| Security Team | security@yourcompany.com |

## Appendix: SQL Scripts

### Verify Data Integrity

```sql
-- Check user count
SELECT COUNT(*) as total_users FROM auth.users;

-- Check for orphaned data
SELECT COUNT(*) as orphaned_sessions
FROM auth.sessions s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- Check JWKS keys
SELECT id, created_at FROM auth.jwks ORDER BY created_at DESC;

-- Check credit balances
SELECT COUNT(*) as users_with_balance
FROM credits.balances;
```

### Emergency Cleanup

```sql
-- Clear expired sessions
DELETE FROM auth.sessions WHERE expires_at < NOW();

-- Clear expired verification tokens
DELETE FROM auth.verification_tokens WHERE expires_at < NOW();
```
