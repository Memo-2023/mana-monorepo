# Fixing "Payload String Too Long" Error in Supabase Realtime

## The Problem

During transcription completion, the memoro service was failing with the following error:

```
Error: Failed to update memo: payload string too long
PostgreSQL Error Code: 22023
```

This error occurred when updating memos with transcription results, even for relatively small transcriptions (4-30 minutes of audio).

## Initial Assumptions (Incorrect)

### Assumption 1: HTTP Request Payload Limit
**What we thought:** The error was caused by Supabase's HTTP API having a small payload size limit for PATCH requests.

**Evidence that seemed to support this:**
- Error occurred during database UPDATE operations
- Supabase logs showed PATCH requests with `content_length` of 9.7KB and 28KB
- The error message "payload string too long" seemed to indicate a size limit

**Why this was wrong:** Supabase's HTTP API actually supports payloads up to 1GB, far exceeding our transcription data size.

### Assumption 2: Database Column Size Limit
**What we thought:** The PostgreSQL database had column size limits that were being exceeded.

**Evidence that seemed to support this:**
- Database columns were `text` and `jsonb` types
- Large speaker diarization data (utterances, speakers) was being stored

**Why this was wrong:** PostgreSQL `text` and `jsonb` columns can store much larger data than we were sending.

## The Real Issue: PostgreSQL NOTIFY Payload Limit

### Root Cause
The error was actually caused by **Supabase Realtime's internal use of PostgreSQL's NOTIFY/LISTEN mechanism**, which has a hard limit of **8000 bytes** for payload size.

### How It Works
1. **Supabase Realtime** uses PostgreSQL's NOTIFY/LISTEN for real-time updates
2. When a row is updated, the **entire row data** is sent through NOTIFY
3. Our transcription data (source with utterances + transcript + metadata) exceeded 8000 bytes
4. PostgreSQL threw error code **22023: "payload string too long"**

### Key Evidence
- Error code `22023` is specifically related to NOTIFY payload limits
- The error occurred even with small payloads (9.7KB) because NOTIFY limit is only 8KB
- Updates worked fine when not subscribed to realtime

## The Solution

### What We Did
Changed the table's **replica identity** to only include the primary key:

```sql
ALTER TABLE public.memos REPLICA IDENTITY USING INDEX memos_pkey;
```

### How This Fixes It
1. **Before:** Realtime notifications included all column data from the updated row
2. **After:** Realtime notifications only include the primary key (`id`)
3. **Result:** NOTIFY payload stays well under the 8000-byte limit

### Impact on Frontend
- **Realtime notifications now only contain the memo `id`**
- **Frontend must fetch full memo data separately** when receiving notifications
- **More efficient:** Avoids sending large payloads unnecessarily
- **No breaking changes:** Frontend can handle this gracefully

## Alternative Solutions Considered

### Option 1: Split Updates
**Approach:** Break large updates into multiple smaller PATCH requests
**Why rejected:** Wouldn't solve the NOTIFY payload issue

### Option 2: Disable Realtime
**Approach:** Remove memos table from `supabase_realtime` publication
**Why rejected:** Frontend needs realtime updates for user experience

### Option 3: Column-Specific Publication
**Approach:** Only publish specific columns to realtime
**Why rejected:** Complex to maintain and still risky with metadata growth

## Prevention for Future

### Database Design
- **Consider realtime payload size** when designing tables with large columns
- **Separate large data** into different tables if realtime is needed
- **Use replica identity wisely** to control what data is sent via NOTIFY

### Development Process
- **Test with realistic data sizes** including speaker diarization data
- **Monitor Supabase logs** for realtime-related errors
- **Understand the difference** between HTTP payload limits and NOTIFY limits

## Key Learnings

1. **Supabase Realtime uses PostgreSQL NOTIFY** with an 8000-byte limit
2. **Error code 22023** specifically indicates NOTIFY payload issues
3. **Replica identity controls** what data is sent in realtime notifications
4. **HTTP API limits and NOTIFY limits are completely different** systems
5. **Real-time efficiency** often benefits from sending only IDs, not full data

## Documentation References

- [PostgreSQL NOTIFY Documentation](https://www.postgresql.org/docs/current/sql-notify.html)
- [Supabase Realtime Quotas](https://supabase.com/docs/guides/realtime/quotas)
- [PostgreSQL Replica Identity](https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-REPLICA-IDENTITY)

## Resolution Status

✅ **Fixed**: Transcription completion now works without payload errors  
✅ **Tested**: Updates to large transcript and source data work correctly  
✅ **Verified**: Realtime notifications still function (with ID-only payloads)