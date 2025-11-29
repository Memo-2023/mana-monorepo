# Realtime Broadcast Fix - Implementation Summary

## Issue Description

The memo list and memo preview components were not updating in real-time when status changes occurred on the Supabase backend, particularly for operations performed by edge functions using `service_role` credentials.

### Root Cause

**Supabase Realtime respects RLS (Row Level Security) policies even for service_role operations.** This means that when edge functions (running with service_role credentials) update memo records, the postgres_changes realtime subscriptions don't fire for regular users because the RLS policies filter them out.

## Solution Implemented

Implemented a **hybrid subscription model** combining:

1. **postgres_changes subscriptions** - For user-initiated direct updates
2. **Broadcast channel subscriptions** - For service_role edge function updates

### Edge Functions (Backend)

Edge functions already send broadcasts to `memo-updates-{memoId}` channels when they complete processing:

- `batch-transcribe-callback/index.ts` - Sends broadcasts after transcription
- `headline/index.ts` - Sends broadcasts after headline generation
- `translate/index.ts` - Sends broadcasts after translation
- `blueprint/index.ts` - Sends broadcasts after blueprint processing

### Client Components (Frontend)

**Files Modified:**

1. `/memoro_app/components/molecules/MemoList.tsx`
2. `/memoro_app/components/molecules/MemoPreview.tsx`

#### MemoList.tsx Changes

**Import Added:**

```typescript
import { memoRealtimeService } from '~/features/memos/services/memoRealtimeService';
```

**New useEffect Hook (lines 387-437):**

```typescript
useEffect(() => {
	const unsubscribeFunctions: (() => void)[] = [];

	// Subscribe to broadcasts for all visible memos
	memos.forEach((memo) => {
		const unsubscribe = memoRealtimeService.subscribeToBroadcastChannel(
			`memo-updates-${memo.id}`,
			async (payload) => {
				console.log('MemoList: Received broadcast for memo', memo.id, payload);

				try {
					// Fetch fresh memo data from Supabase
					const supabase = await getAuthenticatedClient();
					const { data: updatedMemo, error } = await supabase
						.from('memos')
						.select('*')
						.eq('id', memo.id)
						.single();

					if (error) {
						console.error('MemoList: Error fetching updated memo after broadcast:', error);
						return;
					}

					if (updatedMemo) {
						// Update the memo in the list immediately
						setMemos((prevMemos) => prevMemos.map((m) => (m.id === memo.id ? updatedMemo : m)));

						console.log('MemoList: Updated memo from broadcast', {
							id: updatedMemo.id,
							title: updatedMemo.title,
							headlineStatus: updatedMemo.metadata?.processing?.headline_and_intro?.status,
						});
					}
				} catch (error) {
					console.error('MemoList: Error processing broadcast update:', error);
				}
			}
		);

		unsubscribeFunctions.push(unsubscribe);
	});

	// Cleanup on unmount or memo list change
	return () => {
		unsubscribeFunctions.forEach((unsub) => unsub());
	};
}, [memos.map((m) => m.id).join(',')]); // Re-subscribe when memo IDs change
```

#### MemoPreview.tsx Changes

**Import Added:**

```typescript
import { memoRealtimeService } from '~/features/memos/services/memoRealtimeService';
```

**New useEffect Hook (lines 242-287):**

```typescript
useEffect(() => {
	if (!memo?.id) return;

	const unsubscribe = memoRealtimeService.subscribeToBroadcastChannel(
		`memo-updates-${memo.id}`,
		async (payload) => {
			console.log('MemoPreview: Received broadcast for memo', memo.id, payload);

			try {
				// Fetch fresh memo data from Supabase
				const supabase = await getAuthenticatedClient();
				const { data: updatedMemo, error } = await supabase
					.from('memos')
					.select('*')
					.eq('id', memo.id)
					.single();

				if (error) {
					console.error('MemoPreview: Error fetching updated memo after broadcast:', error);
					return;
				}

				if (updatedMemo) {
					// If this is the latest memo on recording page, update it in the store
					if (reactToGlobalRecordingStatus) {
						setLatestMemo(updatedMemo);
					}

					console.log('MemoPreview: Updated memo from broadcast', {
						id: updatedMemo.id,
						title: updatedMemo.title,
						headlineStatus: updatedMemo.metadata?.processing?.headline_and_intro?.status,
					});

					// The useMemoProcessing hook will automatically recalculate displayTitle
					// based on the updated memo state
				}
			} catch (error) {
				console.error('MemoPreview: Error processing broadcast update:', error);
			}
		}
	);

	return () => unsubscribe();
}, [memo?.id, reactToGlobalRecordingStatus, setLatestMemo]);
```

## How It Works

### Data Flow

```
Edge Function (service_role)
    ↓
Updates Memo in Database
    ↓
Sends Broadcast to memo-updates-{memoId}
    ↓
MemoList/MemoPreview receives broadcast
    ↓
Fetches fresh memo data from Supabase
    ↓
Updates local component state
    ↓
UI re-renders with new title/status
```

### Key Features

1. **Automatic Subscription Management**
   - Subscriptions created when component mounts or memo list changes
   - Automatic cleanup when component unmounts
   - Re-subscribes when memo IDs change

2. **Error Handling**
   - Try-catch blocks around all async operations
   - Detailed error logging for debugging
   - Graceful degradation if broadcast fails

3. **Performance Optimization**
   - Only subscribes to visible memos in the list
   - Immediate state updates without batching delay
   - Leverages existing memoRealtimeService infrastructure

4. **Comprehensive Logging**
   - Broadcasts received logged with payload details
   - Updated memo data logged for verification
   - Errors logged with context

## Testing

### Manual Testing Steps

1. **Create a new memo via recording**
   - Verify memo appears in list with "Transcribing Memo" status
   - Wait for transcription to complete
   - Verify title updates to "Generating Headline"
   - Wait for headline generation
   - Verify title updates to generated headline

2. **Check MemoPreview on recording page**
   - Create new memo
   - Observe realtime title updates
   - Verify processing status changes

3. **Check MemoList in memo index page**
   - Navigate to memo list
   - Create new memo in another tab/device
   - Verify new memo appears in list
   - Verify title updates as processing completes

### Expected Console Output

When broadcast received:

```
MemoList: Received broadcast for memo {memoId} {payload}
MemoList: Updated memo from broadcast {id, title, headlineStatus}
```

## Benefits

1. **Solves RLS Limitation**
   - Works around Supabase Realtime RLS restriction
   - Ensures updates from service_role operations reach clients

2. **Maintains Existing Functionality**
   - postgres_changes subscriptions still active for direct updates
   - Hybrid approach provides redundancy

3. **Follows Established Pattern**
   - Uses same pattern as home screen (already working)
   - Leverages existing memoRealtimeService

4. **Low Risk**
   - Additive changes only, no removal of existing code
   - Error handling prevents crashes
   - Automatic cleanup prevents memory leaks

## Known Limitations

1. **Network Dependency**
   - Requires active internet connection for broadcasts
   - Falls back to postgres_changes for direct updates

2. **Subscription Overhead**
   - Creates one broadcast subscription per visible memo
   - Cleaned up automatically when memos change

3. **Eventual Consistency**
   - Small delay between broadcast and UI update
   - Acceptable for this use case

## Future Improvements

1. **Add Connection Status Indicator**
   - Show user when realtime is disconnected
   - Display "stale data" warning if appropriate

2. **Implement Offline Queue**
   - Queue updates when offline
   - Sync when connection restored

3. **Add Metrics**
   - Track broadcast latency
   - Monitor subscription health
   - Alert on failures

## Related Documentation

- `/memoro_app/docs/SUPABASE_REALTIME_RLS_WORKAROUND.md` - Original RLS workaround documentation
- `/memoro_app/features/memos/services/memoRealtimeService.ts` - Realtime service implementation
- Edge function broadcast implementations in `/memoro_edgefunction/supabase/functions-dev/`

## Implementation Date

October 23, 2025

## Contributors

- Claude Code Swarm (Coordinator, Frontend Analyst, Backend Analyst, Solution Architect, Implementation Engineer)
