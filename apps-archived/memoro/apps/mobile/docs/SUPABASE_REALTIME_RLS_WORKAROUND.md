# Supabase Realtime RLS Workaround: Broadcast Channels

## Problem Statement

When using Supabase Edge Functions with `service_role` keys to update database records, the updates bypass Row Level Security (RLS) policies. However, Supabase Realtime **still respects RLS policies** even for service_role operations. This means:

- ✅ Database updates work (service_role bypasses RLS)
- ❌ Realtime subscriptions don't receive updates (Realtime respects RLS)

This is a known limitation documented in [Supabase GitHub issue #226](https://github.com/supabase/realtime/issues/226).

### Symptoms
- Edge functions successfully update records in the database
- Client-side realtime subscriptions don't receive these updates
- Updates only appear when manually refreshing data or switching views
- Problem occurs specifically when edge functions use `service_role` for operations

## Solution: Broadcast Channels

Use Supabase Broadcast Channels to manually notify clients when edge functions make updates. This creates a parallel communication channel that bypasses the RLS limitation.

## Implementation Guide

### 1. Client-Side: Create a Broadcast Subscription Service

```typescript
// memoRealtimeService.ts
class MemoRealtimeService {
  private supabaseClient: any = null;

  /**
   * Subscribe to a broadcast channel for receiving updates
   * This is useful for receiving updates from service_role operations that bypass RLS
   */
  subscribeToBroadcastChannel(
    channelName: string, 
    callback: (payload: any) => void
  ): () => void {
    if (!this.supabaseClient) {
      console.warn('No authenticated client available for broadcast subscription');
      return () => {};
    }

    console.log(`Subscribing to broadcast channel: ${channelName}`);
    
    const channel = this.supabaseClient.channel(channelName);
    
    channel
      .on('broadcast', { event: '*' }, (payload: any) => {
        console.log(`Broadcast received on ${channelName}:`, payload);
        callback(payload);
      })
      .subscribe((status: string) => {
        console.log(`Broadcast channel ${channelName} status:`, status);
      });

    // Return unsubscribe function
    return () => {
      console.log(`Unsubscribing from broadcast channel: ${channelName}`);
      channel.unsubscribe();
    };
  }

  /**
   * Get current data without subscription
   */
  async getCurrentMemoData(memoId: string): Promise<any | null> {
    if (!this.supabaseClient) {
      return null;
    }
    
    try {
      const { data: memo, error } = await this.supabaseClient
        .from('memos')
        .select('*')
        .eq('id', memoId)
        .single();
        
      if (error) {
        console.error('Error fetching memo data:', error);
        return null;
      }
      
      return memo;
    } catch (error) {
      console.error('Error in getCurrentMemoData:', error);
      return null;
    }
  }
}
```

### 2. Client-Side: Subscribe to Updates for Specific Records

```typescript
// In your React component or similar
useEffect(() => {
  if (memoId) {
    // Subscribe to broadcast channel for this specific memo
    const broadcastUnsubscribe = memoRealtimeService.subscribeToBroadcastChannel(
      `memo-updates-${memoId}`,
      async (payload) => {
        console.log('📡 Broadcast update received:', payload);
        
        // Handle the nested payload structure from broadcast
        const broadcastData = payload.payload || payload;
        
        if (broadcastData.type === 'memo-updated' && broadcastData.memoId === memoId) {
          // Fetch fresh data when broadcast is received
          const freshData = await memoRealtimeService.getCurrentMemoData(memoId);
          if (freshData) {
            // Update your local state with fresh data
            updateLocalState(freshData);
          }
        }
      }
    );

    // Cleanup on unmount
    return () => {
      broadcastUnsubscribe();
    };
  }
}, [memoId]);
```

### 3. Edge Function: Send Broadcast After Updates

```typescript
// In your Supabase Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// After updating the database record
const { error: updateError } = await supabase
  .from('memos')
  .update({
    title: newTitle,
    updated_at: new Date().toISOString()
  })
  .eq('id', memoId);

if (!updateError) {
  // Send broadcast update to notify clients
  try {
    const channel = supabase.channel(`memo-updates-${memoId}`);
    
    // Subscribe first to ensure the channel is ready
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'memo-updated',
          payload: {
            type: 'memo-updated',
            memoId: memoId,
            changes: {
              title: newTitle,
              updated_at: new Date().toISOString()
            },
            source: 'your-edge-function-name'
          }
        });
        console.log(`Broadcast sent for memo ${memoId} update`);
        
        // Clean up the channel after sending
        supabase.removeChannel(channel);
      }
    });
  } catch (broadcastError) {
    console.warn('Failed to send broadcast update:', broadcastError);
    // Don't fail the function if broadcast fails
  }
}
```

## Key Considerations

### 1. Channel Naming Convention
Use a consistent naming pattern for channels:
- `{resource}-updates-{resourceId}` (e.g., `memo-updates-123`)
- This allows targeted updates for specific records

### 2. Payload Structure
Supabase broadcasts wrap payloads in an extra level. The actual structure is:
```json
{
  "event": "memo-updated",
  "type": "broadcast",
  "payload": {
    "type": "memo-updated",
    "memoId": "123",
    "changes": {...},
    "source": "edge-function-name"
  }
}
```

Always access the nested `payload.payload` in your client code.

### 3. Channel Cleanup
**Important**: Always clean up channels to prevent memory leaks:
- Client-side: Return and call the unsubscribe function
- Edge functions: Call `supabase.removeChannel(channel)` after sending

### 4. Error Handling
- Broadcast failures should not fail your edge function
- Wrap broadcast logic in try-catch blocks
- Log failures for debugging but continue execution

### 5. Subscribe Before Sending
In edge functions, subscribe to the channel before sending to ensure it's ready:
```typescript
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    // Now safe to send
  }
});
```

## Alternative Approaches

### 1. User Context Switching (Not Recommended)
Some suggest switching to user context in edge functions, but this:
- Requires passing user tokens to edge functions
- Adds complexity and security concerns
- May not work for all use cases

### 2. Separate Notification Table
Create a separate table without RLS for notifications:
- More complex to maintain
- Requires additional database operations
- The broadcast approach is cleaner

### 3. Polling (Not Recommended)
Periodically fetch data from the client:
- Inefficient and wastes resources
- Poor user experience with delays
- Should be avoided

## Testing the Implementation

1. **Verify Broadcast Reception**:
   ```typescript
   // Add detailed logging
   console.log('📡 Broadcast update received:', JSON.stringify(payload, null, 2));
   ```

2. **Check Channel Status**:
   ```typescript
   .subscribe((status: string) => {
     console.log(`Channel status: ${status}`);
     // Should see: SUBSCRIBED
   });
   ```

3. **Monitor Edge Function Logs**:
   - Verify "Broadcast sent" messages appear
   - Check for any error messages

## Common Issues and Solutions

### Issue: Updates Not Received
- **Check**: Is the channel name consistent between sender and receiver?
- **Check**: Are you accessing `payload.payload` for the nested structure?
- **Check**: Is the channel subscription active before sending?

### Issue: Memory Leaks
- **Solution**: Always cleanup channels
- **Solution**: Use unique channel names per resource
- **Solution**: Implement proper unsubscribe logic

### Issue: Delayed Updates
- **Solution**: Ensure edge function subscribes before sending
- **Solution**: Add small delay after subscription if needed
- **Solution**: Check network latency

## Example: Complete Implementation

See the Memoro app implementation:
- Client: `/app/(protected)/(tabs)/index.tsx`
- Service: `/features/memos/services/memoRealtimeService.ts`
- Edge Functions: `/supabase/functions/headline/index.ts`

This pattern can be adapted for any Supabase project facing RLS limitations with service_role operations.