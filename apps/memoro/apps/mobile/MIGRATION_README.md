# Audio Path Standardization Migration

## Overview

This migration standardizes all audio fields in the `memos.source` JSONB column to use `audio_path` instead of the legacy `path` field.

## Current State Analysis

- **Total memos with source data**: 17,627
- **Records ready for migration**: 1,286 (7.3%)
- **Records already using audio_path**: 16,319 (92.6%)
- **Blocking conflicts**: 0 (no records have both fields)
- **Records with empty paths**: 0

## Migration Status: ✅ READY TO PROCEED

## Files Included

1. **`audio_path_migration.sql`** - Main migration script
2. **`pre_migration_verification.sql`** - Verification queries to run BEFORE migration
3. **`post_migration_verification.sql`** - Verification queries to run AFTER migration
4. **`MIGRATION_README.md`** - This documentation file

## Pre-Migration Checklist

### 1. Backup Preparation

- [ ] Ensure database backup is recent (within 24 hours)
- [ ] Verify backup integrity
- [ ] Confirm backup restoration procedure is tested

### 2. Environment Verification

- [ ] Confirm you're connected to the correct database (memoro-prod)
- [ ] Verify you have necessary permissions (UPDATE, CREATE TABLE)
- [ ] Check database connectivity and stability

### 3. Pre-Migration Validation

```sql
-- Run the pre-migration verification queries
\i pre_migration_verification.sql
```

Expected results:

- 1,286 records ready for migration
- 0 blocking conflicts
- Migration status: "READY: Safe to proceed with migration"

### 4. Application Considerations

- [ ] Plan maintenance window if needed (recommended but not required)
- [ ] Notify team of migration timing
- [ ] Monitor application logs for any related issues

## Migration Execution

### Step 1: Run Pre-Migration Verification

```sql
\i pre_migration_verification.sql
```

### Step 2: Execute Migration

```sql
\i audio_path_migration.sql
```

### Step 3: Run Post-Migration Verification

```sql
\i post_migration_verification.sql
```

## Expected Migration Behavior

### What Will Happen

1. **Backup Creation**: Automatic backup of all records to be modified
2. **Field Conversion**: Convert `source.path` → `source.audio_path`
3. **Field Removal**: Remove legacy `path` field from source JSONB
4. **Timestamp Update**: Update `updated_at` timestamp for audit trail
5. **Verification**: Comprehensive validation of migration success

### What Will NOT Happen

- No data loss (backup created first)
- No downtime (operation is atomic)
- No changes to records already using `audio_path`
- No changes to non-audio records

## Safety Features

### ✅ Safe Migration Design

- **Atomic Transaction**: All-or-nothing execution
- **Automatic Backup**: Creates backup table before any changes
- **Idempotent**: Can be run multiple times safely
- **Validation**: Extensive pre/post migration checks
- **Rollback Ready**: Complete rollback procedure included

### ⚠️ Potential Risks (Low)

- Brief table-level lock during UPDATE operation (~30-60 seconds)
- Small increase in database size due to backup table
- Application cache invalidation for updated records

## Performance Expectations

- **Execution Time**: 30-60 seconds for ~1,300 records
- **Lock Duration**: Minimal (single UPDATE statement)
- **Memory Usage**: Low (set-based operations)
- **Rollback Time**: 10-20 seconds if needed

## Rollback Procedure

If you need to rollback the migration:

```sql
-- Included in the main migration file, uncomment and run:
/*
BEGIN;

UPDATE memos
SET
    source = b.source,
    updated_at = now()
FROM memo_source_backup_audio_migration b
WHERE memos.id = b.id;

-- Verify rollback worked
SELECT COUNT(*) FROM memos WHERE source ? 'path';

COMMIT;
*/
```

## Post-Migration Actions

### Immediate (Within 1 hour)

1. Run post-migration verification queries
2. Spot-check application functionality
3. Monitor error logs for any issues
4. Verify API responses include correct audio paths

### Short-term (Within 24 hours)

1. Monitor application performance
2. Check user-reported issues
3. Validate audio playback functionality
4. Review application metrics

### Long-term (After 48 hours)

1. Consider cleaning up backup table (optional)
2. Update application documentation if needed
3. Remove any temporary monitoring

## Monitoring After Migration

### Key Metrics to Watch

- Application error rates
- Audio playback success rates
- Database query performance
- User-reported issues

### Verification Queries

```sql
-- Should return 0
SELECT COUNT(*) FROM memos WHERE source ? 'path';

-- Should match pre-migration total
SELECT COUNT(*) FROM memos WHERE source ? 'audio_path';
```

## Cleanup (Optional)

After 48+ hours and confirming everything works correctly:

```sql
-- Optional: Remove backup table
DROP TABLE memo_source_backup_audio_migration;
```

**Recommendation**: Keep backup table for at least 1 week for extra safety.

## Troubleshooting

### Migration Fails

1. Check the error message in the migration output
2. Verify database permissions
3. Check for unexpected data changes since pre-migration verification
4. Contact database administrator if needed

### Partial Success

1. Check post-migration verification results
2. Look for records still having 'path' field
3. Run rollback if necessary
4. Investigate root cause before retry

### Performance Issues

1. Monitor database locks and connections
2. Check for application connection pool exhaustion
3. Review slow query logs
4. Consider running during low-traffic period

## Support Information

### Migration Created

- **Date**: 2025-08-25
- **Purpose**: Standardize audio path fields for consistency
- **Impact**: 1,286 records (~7.3% of total)

### For Issues

1. Check migration logs and verification query results
2. Review application error logs
3. Use rollback procedure if necessary
4. Document any unexpected behavior for future migrations

## Success Criteria

✅ **Migration is successful when**:

- 0 records have `source.path` field
- All converted records have `source.audio_path` field
- Backup table contains exactly 1,286 records
- All path values were transferred correctly
- Application continues to function normally
- Audio playback works as expected

This migration follows database best practices with comprehensive safety measures, verification procedures, and rollback capabilities.
