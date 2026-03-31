# Broadcast Trigger Payload Size Fix - July 2025

## Timeline of Events

### Background
- **Before July 5, 2025**: Transcription updates worked perfectly
- **July 5, 2025**: New broadcast triggers added to enhance real-time updates
- **July 8, 2025**: "Payload string too long" errors started occurring during transcription completion

## The Error

### Symptoms
```
Error: Failed to update memo: payload string too long
PostgreSQL Error Code: 22023
```

### Affected Operations
- Transcription completion updates failing for memos with:
  - Text length: 46,465 characters
  - Utterances: 377 items
  - Request payload sizes: 55KB - 121KB

### Error Logs
From memoro-service:
```
[handleTranscriptionCompleted] Error updating memo: {
  code: '22023',
  details: null,
  hint: null,
  message: 'payload string too long'
}
```

From Supabase API Gateway:
```json
{
  "event_message": "PATCH | 400 | ... | https://npgifbrwhftlbrbaglmi.supabase.co/rest/v1/memos",
  "content_length": "121057",
  "status_code": 400
}
```

## Initial (Wrong) Assumptions

### Assumption 1: Supabase Realtime NOTIFY Limit
**What we thought**: The existing replica identity fix from the `realtime-payload-limit-fix.md` wasn't working properly.

**Why this seemed logical**:
- Same error code (22023)
- Same error message ("payload string too long")
- PostgreSQL NOTIFY has an 8KB limit
- We had fixed this exact issue before

**Why we were wrong**: The replica identity was correctly set and working. The issue was elsewhere.

### Assumption 2: Database Column Limits
**What we thought**: Maybe the jsonb/text columns had size constraints.

**Why this seemed possible**:
- Large payloads were being stored
- Error occurred during UPDATE operations

**Why we were wrong**: PostgreSQL jsonb and text columns can store much larger data (up to 1GB).

### Assumption 3: HTTP Request Size Limits
**What we thought**: The Supabase REST API might have payload limits.

**Why we considered this**:
- Request sizes were 55KB-121KB
- Error happened during HTTP PATCH requests

**Why we were wrong**: Supabase supports payloads up to 1GB via HTTP.

## The Real Problem

### Discovery Process
1. Checked replica identity: ✓ Correctly set to INDEX (only sends ID)
2. Investigated table triggers: Found new broadcast triggers added July 5
3. Examined trigger function: Found the culprit!

### Root Cause
The `broadcast_memo_changes()` trigger function added on July 5, 2025 was using:
```sql
PERFORM pg_notify(
  'realtime:broadcast',
  json_build_object(
    'payload', json_build_object(
      'new', row_to_json(NEW),  -- ENTIRE row data!
      'old', row_to_json(OLD),  -- ENTIRE row data!
      ...
    )
  )::text
);
```

This trigger was attempting to send the ENTIRE memo data (including large transcripts and utterances) through PostgreSQL's NOTIFY mechanism, which has a hard 8KB limit.

### Why It Wasn't Caught Earlier
- The trigger was added recently (July 5)
- Initial testing likely used smaller memos
- The error only occurs with transcriptions > ~6KB total size

## The Fix

### Solution Applied
Modified the `broadcast_memo_changes()` function to send minimal data:

```sql
CREATE OR REPLACE FUNCTION public.broadcast_memo_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Broadcast only essential information to avoid payload size limits
  PERFORM pg_notify(
    'realtime:broadcast',
    json_build_object(
      'type', 'broadcast',
      'event', 'postgres_changes',
      'payload', json_build_object(
        'event', TG_OP,
        'schema', TG_TABLE_SCHEMA,
        'table', TG_TABLE_NAME,
        'id', CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.id
          ELSE NEW.id
        END,
        'eventTs', to_char(current_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
    )::text
  );
  
  RETURN NEW;
END;
$$;
```

### What Changed
- **Before**: Sent entire row data (`row_to_json(NEW/OLD)`)
- **After**: Sends only the memo ID
- **Result**: Payload size reduced from 55KB+ to < 200 bytes

### Impact on Frontend
- Frontend still receives real-time notifications
- Must fetch full memo data using the provided ID
- No breaking changes to the notification structure

## Key Learnings

### 1. Multiple Systems Can Hit NOTIFY Limits
- **Supabase Realtime**: Uses replica identity (already fixed)
- **Custom Triggers**: Can also use pg_notify (new issue)
- Both must respect the 8KB NOTIFY limit

### 2. Error Messages Can Be Misleading
- Same error (22023) can have different causes
- Important to check ALL uses of NOTIFY, not just Supabase Realtime

### 3. Trigger Side Effects
- New triggers can break existing functionality
- Always consider payload sizes when using pg_notify
- Test with realistic data sizes, not just small test cases

### 4. Debugging Approach
1. Check recent changes (migrations, triggers)
2. Examine all NOTIFY usage, not just obvious ones
3. Use Supabase API logs to see actual request sizes
4. Don't assume the first similar fix applies

## Prevention Guidelines

### For Future Triggers
1. **Never send full row data through NOTIFY**
2. **Always send minimal identifiers only**
3. **Test with large, realistic payloads**
4. **Document payload size considerations**

### For Broadcast Mechanisms
1. **Use ID-only patterns**: Send identifiers, let clients fetch data
2. **Consider payload sizes**: NOTIFY limit is 8000 bytes total
3. **Monitor for 22023 errors**: Set up alerts for this specific error
4. **Review all NOTIFY usage**: Both Supabase and custom triggers

## Resolution Timeline
- **Issue Reported**: July 8, 2025, 14:59 CEST
- **Investigation Started**: July 8, 2025, 15:00 CEST
- **Root Cause Found**: Broadcast trigger sending full row data
- **Fix Applied**: Modified trigger to send ID only
- **Resolution Confirmed**: Transcriptions now complete successfully

## Related Documentation
- [Realtime Payload Limit Fix](./realtime-payload-limit-fix.md) - Original NOTIFY limit issue
- [PostgreSQL NOTIFY Documentation](https://www.postgresql.org/docs/current/sql-notify.html)
- Migration: `20250705022315_add_memo_update_broadcast_trigger`