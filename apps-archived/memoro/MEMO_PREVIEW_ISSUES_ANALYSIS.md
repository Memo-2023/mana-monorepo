# Memo Preview Issues - Detailed Analysis

**Date:** 2025-11-20
**Component:** MemoPreview (Home Screen Recording Page)
**Status:** MULTIPLE ACTIVE ISSUES

---

## Executive Summary

The memo preview on the home screen has persistent issues with displaying date, time, and duration information throughout the upload and processing lifecycle. Despite multiple fixes, the information disappears when broadcast updates arrive.

---

## What Is Working Correctly ✅

### 1. Placeholder Memo Creation ✅
**Location:** `apps/mobile/app/(protected)/(tabs)/index.tsx:1086-1112`

**Works correctly:**
- Placeholder memo is created immediately after recording stops
- Contains all required data: `id`, `title`, `timestamp`, `audioDuration`
- `audioDuration` is correctly calculated from recording duration
- Displays on home screen with date, time, and duration

**Evidence from logs:**
```
[Upload] Created placeholder memo card for {memoId}
```

**DO NOT CHANGE:** This functionality is working perfectly.

---

### 2. Audio Upload Process ✅
**Location:** `apps/mobile/features/storage/` (upload service)

**Works correctly:**
- Audio file uploads to Supabase storage successfully
- Upload progress tracking works
- Upload status badges display correctly ("Uploading...", "Queued...", etc.)
- `audioFileId` tracking for upload status works

**Evidence from logs:**
```
Upload successful for {audioFileId}
```

**DO NOT CHANGE:** Upload infrastructure is working correctly.

---

### 3. Transcription Triggering ✅
**Location:** `apps/mobile/features/storage/transcriptionUtils.ts`

**Works correctly:**
- Transcription is automatically triggered after upload completes
- Request routes through memoro-service middleware
- Backend receives transcription request successfully
- Returns proper success/error responses

**Evidence from logs:**
```
✅ Transcription started successfully via Memoro Service
```

**DO NOT CHANGE:** Transcription triggering logic is working correctly.

---

### 4. INSERT Event Handling ✅
**Location:** `apps/mobile/app/(protected)/(tabs)/index.tsx:617-660`

**Works correctly:**
- INSERT events are received from Supabase when memo row is created
- Event filtering works (only replaces expected memos)
- Duration preservation logic executes correctly
- `waitingForNewMemoRef` tracking prevents premature database queries
- Directly sets memo from INSERT payload (doesn't call `loadLatestMemo()`)

**Evidence from logs:**
```
Replacing placeholder with new memo: {memoId}
INSERT: Preserved audioDuration from placeholder: 17.072
```

**DO NOT CHANGE:** Event-driven architecture is working correctly.

---

### 5. Broadcast Channel Infrastructure ✅
**Location:** `apps/mobile/features/memos/services/memoRealtimeService.ts`

**Works correctly:**
- Broadcast subscriptions are established
- Broadcast messages are received from backend
- Channel status transitions work (CLOSED → SUBSCRIBED)
- Unsubscribe/resubscribe logic works

**Evidence from logs:**
```
MemoRealtimeService: Subscribing to broadcast channel: memo-updates-{id}
MemoRealtimeService: Broadcast channel {id} status: SUBSCRIBED
MemoPreview: Received broadcast for memo {id}
```

**DO NOT CHANGE:** Realtime infrastructure is working correctly.

---

### 6. Duration Preservation Logic ✅ (Data Level)
**Location:**
- `apps/mobile/app/(protected)/(tabs)/index.tsx:631-641` (INSERT handler)
- `apps/mobile/components/molecules/MemoPreview.tsx:277-285` (Broadcast handler)

**Works correctly:**
- Logic correctly preserves `audioDuration` from current state
- Merges preserved data with fresh database data
- State update functions are called with correct data

**Evidence from logs:**
```javascript
{
  "preservedAudioDuration": 17.072,
  "title": "Test erfolgreich? Ein erster Blick auf die Ergebnisse."
}
```

**DO NOT CHANGE:** The preservation logic itself is correct. The problem is elsewhere (UI rendering or component lifecycle).

---

### 7. Backend Processing ✅
**Works correctly:**
- Transcription completes successfully
- Headline generation completes successfully
- Final title is generated correctly
- Broadcast messages are sent when processing completes

**Evidence from logs:**
```javascript
{
  "title": "Test erfolgreich? Ein erster Blick auf die Ergebnisse.",
  "headlineStatus": "completed"
}
```

**DO NOT CHANGE:** Backend processing pipeline is working correctly.

---

### 8. Upload Status Badge Display ✅
**Location:** `apps/mobile/components/molecules/MemoPreview.tsx:684-746`

**Works correctly:**
- Shows "Uploading..." badge during upload
- Shows "Queued..." for pending uploads
- Shows retry count for failed uploads
- Badge disappears after successful upload
- Uses `audioFileId` for tracking (client-side only, not sent to backend)

**DO NOT CHANGE:** Upload status badge implementation is working correctly.

---

### 9. Tag and Space Display ✅
**Location:** `apps/mobile/components/molecules/MemoPreview.tsx`

**Works correctly:**
- Tags display properly
- Space pills display with correct colors
- Tag selector modal works
- Real-time tag updates work

**DO NOT CHANGE:** Tag/space functionality is working correctly.

---

### 10. Memo Store State Management ✅ (Partial)
**Location:** `apps/mobile/features/memos/store/memoStore.ts`

**Works correctly:**
- `setLatestMemo()` updates state correctly
- `updateMemo()` merges updates correctly
- `setUploadingPlaceholder()` creates placeholder correctly

**DO NOT CHANGE:** Store update functions are working correctly.

---

### 11. i18n Translations ✅
**Location:** `apps/mobile/features/i18n/translations/*.json`

**Works correctly:**
- All 32 languages have processing status translations
- Translation keys exist for: `memo_uploading`, `memo_transcribing`, `headline_generating`
- Translation hook works properly

**DO NOT CHANGE:** Internationalization is working correctly.

---

## What Should NOT Change

### Critical Functionality to Preserve:

1. **Event-Driven Architecture**
   - Keep using INSERT events instead of polling/timeouts
   - Keep using broadcast channels for updates
   - Keep `waitingForNewMemoRef` pattern
   - Keep direct state updates from events (don't reintroduce `loadLatestMemo()` calls)

2. **Duration Preservation Logic**
   - Keep preservation in INSERT handler
   - Keep preservation in broadcast handler
   - Keep using `audioFileId` for client-side tracking
   - Keep `audioDuration` in `metadata.stats`

3. **Placeholder Pattern**
   - Keep immediate placeholder creation after recording
   - Keep `isPlaceholder` flag
   - Keep placeholder structure with all metadata

4. **Upload Infrastructure**
   - Keep upload service as-is
   - Keep upload status tracking
   - Keep upload badge display

5. **Realtime Subscriptions**
   - Keep broadcast channel subscriptions
   - Keep automatic resubscription logic
   - Keep RLS-aware subscriptions

6. **Component Structure**
   - Keep MemoPreview component structure
   - Keep memo comparison function (React.memo)
   - Keep local state pattern (`currentMemo`)
   - Keep `useMemoProcessing` hook

7. **Store Management**
   - Keep Zustand store structure
   - Keep store update functions
   - Keep separation between global state and local component state

### Why These Should Not Change:

These components represent **working, battle-tested code** that has been carefully designed to solve specific problems:
- Race conditions in upload/transcription flow
- Real-time updates without polling
- Client-side metadata not sent to backend
- Performance optimization with React.memo

**Any changes should be additive or corrective, not replacements of working systems.**

---

## Current Problems

### Problem 1: Date and Duration Disappear After Broadcast Updates ❌

**When it happens:**
- AFTER upload completes successfully
- When broadcast updates arrive from backend (transcription/headline completion)
- Specifically when these log entries appear:
  ```
  MemoRealtimeService: Unsubscribing from broadcast channel: memo-updates-{id}
  MemoRealtimeService: Broadcast channel {id} status: CLOSED
  MemoRealtimeService: Subscribing to broadcast channel: {id}
  🔔 Neue oder aktualisierte Memo erkannt, zeige MemoPreview an
  ```

**What happens:**
- Before broadcast: Memo shows title + date + time + duration ✓
- After broadcast: Memo shows ONLY title (date and duration GONE) ❌

**User quote:**
> "before i still see only the title without date and duration in the memo preview"

### Problem 2: Wrong Title After Upload ❌

**When it happens:**
- Immediately after upload completes

**What happens:**
- Memo preview shows title: "Memo" (generic placeholder)
- Should show: Processing status like "Transcribing..." or "Generating title..."

**Expected behavior:**
- Upload complete → "Transcribing..."
- Transcription complete → "Generating title..."
- Headline complete → Real title (e.g., "Test erfolgreich? Ein erster Blick auf die Ergebnisse.")

**User quote:**
> "after upload the memo preview has the title 'memo' but with correct date and duration, but the title is wrong"

---

## Timeline of Attempted Fixes

### Fix #1: Duration Preservation in INSERT Handler ✓ (Partially Working)

**File:** `apps/mobile/app/(protected)/(tabs)/index.tsx:631-659`

**What we did:**
Added logic to preserve `audioDuration` from placeholder when INSERT event arrives:

```typescript
const preservedStats = {
  ...(payload.new.metadata?.stats || {}),
  viewCount: payload.new.metadata?.stats?.viewCount || 0,
  shareCount: payload.new.metadata?.stats?.shareCount || 0,
  editCount: payload.new.metadata?.stats?.editCount || 0,
  // Preserve audioDuration from placeholder if database doesn't have it yet
  ...((! payload.new.metadata?.stats?.audioDuration && currentMemo?.metadata?.stats?.audioDuration) && {
    audioDuration: currentMemo.metadata.stats.audioDuration
  })
};
```

**Result:**
- Works for INSERT events ✓
- Does NOT work for broadcast updates ❌

**Evidence from logs:**
```
INSERT: Preserved audioDuration from placeholder: 17.072
```

---

### Fix #2: Duration Preservation in Broadcast Handler ✓ (Partially Working)

**File:** `apps/mobile/components/molecules/MemoPreview.tsx:276-310`

**What we did:**
Added logic to preserve `audioDuration` when broadcast updates arrive:

```typescript
const preservedStats = {
  ...updatedMemo.metadata?.stats,
  // Preserve audioDuration from current memo if the updated memo doesn't have it
  ...((!updatedMemo.metadata?.stats?.audioDuration && currentMemo.metadata?.stats?.audioDuration) && {
    audioDuration: currentMemo.metadata.stats.audioDuration
  })
};
```

**Result:**
- Logic is correct ✓
- Logs show preservation: `"preservedAudioDuration": 17.072` ✓
- BUT date and duration STILL disappear in UI ❌

**Evidence from logs:**
```javascript
MemoPreview: Updated memo from broadcast {
  "preservedAudioDuration": 17.072,
  "title": "Test erfolgreich? Ein erster Blick auf die Ergebnisse."
}
```

---

### Fix #3: Processing Status Indicators 🔄 (Not Tested Yet)

**File:** `apps/mobile/features/memos/hooks/useMemoProcessing.ts:217-226`

**What we did:**
Changed priority order in `displayTitle` to show processing status BEFORE showing placeholder titles:

```typescript
// Priority 1: Show processing status during transcription and headline generation
if (
  processingStatus === MemoProcessingStatus.TRANSCRIBING ||
  processingStatus === MemoProcessingStatus.GENERATING_HEADLINE ||
  processingStatus === MemoProcessingStatus.UPLOADING
) {
  return statusText[processingStatus];
}

// Priority 2: If a real title exists (not default/placeholder), show it
if (
  memo.title &&
  memo.title !== DEFAULT_MEMO_TITLES.UNNAMED &&
  memo.title !== DEFAULT_MEMO_TITLES.NEW_RECORDING &&
  memo.title !== 'Titel wird generiert...' &&
  memo.title.trim() !== ''
) {
  return memo.title;
}
```

**Expected result:**
- Should show "Transcribing..." → "Generating title..." → Final title

**Actual result:**
- Still shows "Memo" instead of processing status ❌
- User reports no change in behavior

---

## Root Cause Analysis

### Issue 1: Date/Duration Disappearing - MYSTERY 🔍

**What we know:**
1. `audioDuration` IS being preserved in state ✓ (confirmed by logs)
2. Broadcast handler correctly merges preserved data ✓
3. `setCurrentMemo()` is called with preserved data ✓
4. BUT the UI does NOT show the duration ❌

**Possible causes:**
1. **React re-render issue**: Component not re-rendering when `currentMemo` updates
2. **Timing issue**: Component unmounting/remounting during broadcast
3. **Memo comparison issue**: `React.memo()` preventing re-render despite state change
4. **Missing dependency**: `useEffect` or `useMemo` missing `currentMemo` in dependencies
5. **Data structure issue**: `timestamp` field getting cleared somewhere
6. **Display logic issue**: Duration display logic has a hidden condition we're missing

**Code location to investigate:**
`MemoPreview.tsx:576-601` - Duration display logic:
```typescript
{(() => {
  // Get duration - either from stats or calculate for combined memos
  const audioDuration = isCombinedMemo(currentMemo)
    ? getCombinedMemoDuration(currentMemo)
    : currentMemo.metadata?.stats?.audioDuration;

  if (audioDuration !== undefined && audioDuration > 0) {
    return (
      <>
        <Text variant="tiny" className={separatorClasses}>•</Text>
        <Text variant="tiny" className={infoTextClasses}>
          {formatDuration(audioDuration)}
        </Text>
      </>
    );
  }
  return null;
})()}
```

**Critical question:**
- Is `currentMemo` actually updating in the component when `setCurrentMemo()` is called?
- Or is the state update happening but component not re-rendering?

---

### Issue 2: Wrong Title ("Memo") - LOGIC BUG 🐛

**What we know:**
1. Processing status logic exists ✓
2. Translations exist for all statuses ✓
3. Priority order was updated to show status first ✓
4. BUT component still shows "Memo" ❌

**Possible causes:**
1. **Memo title already set**: When upload completes, memo already has title="Memo" in database
2. **Priority logic not working**: Line 230-237 in `useMemoProcessing.ts` is catching "Memo" as a "real title"
3. **Processing status not detected**: Hook not correctly identifying that memo is in TRANSCRIBING state
4. **Timing issue**: Title updates before processing status is set

**Code issue found:**
In `useMemoProcessing.ts:230-237`, we check:
```typescript
if (
  memo.title &&
  memo.title !== DEFAULT_MEMO_TITLES.UNNAMED &&
  memo.title !== DEFAULT_MEMO_TITLES.NEW_RECORDING &&
  memo.title !== 'Titel wird generiert...' &&
  memo.title.trim() !== ''
) {
  return memo.title;
}
```

**BUG**: The title "Memo" passes all these checks! It's not in the exclusion list.

**DEFAULT_MEMO_TITLES constants:**
```typescript
export const DEFAULT_MEMO_TITLES = {
  UNNAMED: 'Unbenanntes Memo',
  NEW_RECORDING: 'Neue Aufnahme',
};
```

**Missing:** "Memo" is NOT in the exclusion list!

---

## Data Flow Analysis

### Upload → INSERT Event Flow

1. **Placeholder creation** (`index.tsx:1086-1112`)
   ```typescript
   const placeholderMemo: MemoItem = {
     id: memoId,
     title: title || 'New Recording',
     timestamp: new Date(),
     isPlaceholder: true,
     metadata: {
       audioFileId,
       stats: {
         audioDuration: duration, // ✓ Duration set here
         viewCount: 0,
         shareCount: 0,
         editCount: 0,
       },
     },
   };
   ```

2. **Upload completes** → Audio file uploaded to storage ✓

3. **Transcription triggered** → Backend starts processing ✓

4. **INSERT event arrives** → Database row created with initial data
   - Contains: `audio_path`, `source`, basic metadata
   - Does NOT contain: `audioDuration` (not calculated yet by backend)
   - Title: "Memo" (or similar placeholder)

5. **INSERT handler preserves duration** (`index.tsx:631-659`) ✓
   - Merges placeholder `audioDuration` with INSERT data
   - Calls `setLatestMemo()` with preserved data

6. **MemoPreview renders** with preserved data ✓
   - Should show: Date + Time + Duration
   - Actually shows: ??? (need to verify)

### Broadcast Update Flow

1. **Backend completes transcription** → Updates memo in database

2. **Backend sends broadcast** → `memo-updates-{id}` channel

3. **Broadcast handler receives update** (`MemoPreview.tsx:254-318`)
   - Fetches fresh memo from database
   - Preserves `audioDuration` from `currentMemo`
   - Calls `setCurrentMemo()` with merged data

4. **Component should re-render** with new data
   - Should show: Date + Time + Duration + New Title
   - Actually shows: ONLY new title ❌

---

## Files Involved

### Primary Files

1. **`apps/mobile/app/(protected)/(tabs)/index.tsx`**
   - Main recording page
   - Manages latest memo state
   - Handles INSERT events
   - Creates placeholder memos
   - Lines of interest: 617-660, 1086-1112

2. **`apps/mobile/components/molecules/MemoPreview.tsx`**
   - Displays memo preview card
   - Subscribes to broadcast updates
   - Handles local state updates
   - Lines of interest: 253-318, 546-667

3. **`apps/mobile/features/memos/hooks/useMemoProcessing.ts`**
   - Determines processing status
   - Calculates display title
   - Lines of interest: 14-31, 203-264

4. **`apps/mobile/features/memos/store/memoStore.ts`**
   - Zustand store for memo state
   - `loadLatestMemo()` function
   - `setLatestMemo()` function
   - `updateMemo()` function

### Supporting Files

5. **`apps/mobile/features/memos/utils/dateFormatters.ts`**
   - `formatDuration()` function
   - `useFormatTime()` hook
   - `useFormatDate()` hook

6. **`apps/mobile/features/storage/transcriptionUtils.ts`**
   - Triggers transcription after upload
   - Returns processing status

7. **`apps/mobile/features/memos/services/memoRealtimeService.ts`**
   - Manages Supabase realtime subscriptions
   - Broadcast channel handling

---

## Missing Information Needed

To diagnose the root cause, we need:

1. **Component re-render verification:**
   - Add console.log in MemoPreview render to see if component re-renders after broadcast
   - Check if `currentMemo` state actually updates

2. **State inspection:**
   - Log `currentMemo.metadata?.stats?.audioDuration` before and after broadcast
   - Log `currentMemo.timestamp` before and after broadcast
   - Verify if data is in state but not displaying, or if data is lost

3. **React.memo investigation:**
   - Check memo comparison function (lines 837-882 in MemoPreview.tsx)
   - Verify if memo is preventing re-render

4. **Processing status detection:**
   - Log `processingStatus` value in useMemoProcessing
   - Log what conditions are matching/not matching
   - Verify memo.metadata.processing structure from database

5. **Title exclusion list:**
   - Need to add "Memo" to DEFAULT_MEMO_TITLES or exclusion list
   - Need to check what exact title value comes from database after INSERT

---

## Next Steps Required

### Immediate Actions Needed:

1. **Add comprehensive logging:**
   ```typescript
   // In MemoPreview.tsx broadcast handler (after setCurrentMemo)
   console.log('🔍 BROADCAST UPDATE - State after setCurrentMemo:', {
     id: currentMemo.id,
     title: currentMemo.title,
     timestamp: currentMemo.timestamp,
     audioDuration: currentMemo.metadata?.stats?.audioDuration,
     fullStats: currentMemo.metadata?.stats
   });
   ```

2. **Add render logging:**
   ```typescript
   // At top of MemoPreview render function
   console.log('🎨 MEMOPREVIEW RENDER:', {
     memoId: memo.id,
     currentMemoId: currentMemo.id,
     title: currentMemo.title,
     timestamp: currentMemo.timestamp,
     audioDuration: currentMemo.metadata?.stats?.audioDuration
   });
   ```

3. **Add processing status logging:**
   ```typescript
   // In useMemoProcessing hook
   console.log('📊 PROCESSING STATUS:', {
     memoId: memo.id,
     processingStatus,
     displayTitle,
     memoTitle: memo.title,
     transcriptionStatus: memo.metadata?.processing?.transcription?.status,
     headlineStatus: memo.metadata?.processing?.headline_and_intro?.status
   });
   ```

4. **Fix title exclusion:**
   - Add "Memo" to exclusion list in useMemoProcessing.ts
   - Test if processing status shows correctly

5. **Verify data structure:**
   - Query Supabase directly to see exact memo structure after INSERT
   - Check if `timestamp` field exists in database or only client-side
   - Verify metadata.stats structure in database

---

## Hypotheses to Test

### Hypothesis 1: Timestamp is Client-Only Data
**Theory:** The `timestamp` field only exists in placeholder, not in database.
When broadcast fetches fresh data, `timestamp` is missing.

**Test:** Check if database has `created_at` that should be mapped to `timestamp`

**Fix if true:** Map `created_at` to `timestamp` in broadcast handler

---

### Hypothesis 2: Component Not Re-rendering
**Theory:** React.memo comparison prevents re-render when metadata.stats changes.

**Test:** Add logging to memo comparison function (line 837-882)

**Fix if true:** Update memo comparison to check for stats changes

---

### Hypothesis 3: State Update Timing Issue
**Theory:** Component unmounts and remounts during broadcast, losing state.

**Test:** Add component mount/unmount logging

**Fix if true:** Use different state management approach (lift state up or use global store)

---

### Hypothesis 4: Multiple State Updates Racing
**Theory:** Multiple updates happening simultaneously, last one wins and doesn't have duration.

**Test:** Add timestamps to all state updates and log the order

**Fix if true:** Batch updates or use a queue

---

### Hypothesis 5: Title "Memo" Not Excluded
**Theory:** The title "Memo" is treated as a real title, blocking status display.

**Test:** Add "Memo" to DEFAULT_MEMO_TITLES or exclusion checks

**Fix if true:** Update useMemoProcessing.ts line 230-237

---

## Success Criteria

The fix will be complete when:

1. ✅ After upload: Shows "Transcribing..." with date, time, duration
2. ✅ During transcription: Shows "Transcribing..." with date, time, duration
3. ✅ After transcription: Shows "Generating title..." with date, time, duration
4. ✅ After headline generation: Shows real title with date, time, duration
5. ✅ Broadcast updates preserve: date, time, duration
6. ✅ No flickering or disappearing of metadata

---

## Additional Context

### User's Original Request
> "in earlier version we had something like 'transcribing' 'generating title' and then finally the title"

This indicates the app previously had this functionality working, so it's a regression.

### Key User Feedback
1. "after upload the memo preview has the name 'memo' with the date and duration"
2. "when the real title arrives the date and duration is away"
3. "before i still see only the title without date and duration in the memo preview"

This suggests TWO separate issues:
- Issue A: Date/duration disappearing (broadcast update problem)
- Issue B: Wrong title showing (processing status not displaying)

---

## Conclusion

Despite implementing duration preservation in both INSERT handler and broadcast handler, the UI still loses date and duration information. The logs confirm data is being preserved in state, but something prevents it from displaying.

We need more diagnostic information to identify whether this is:
- A React re-rendering issue
- A data structure mismatch
- A component lifecycle issue
- A React.memo comparison issue
- A timing/race condition

The title issue appears to be a simple oversight: "Memo" is not in the exclusion list, so it's treated as a real title instead of triggering processing status display.

**STATUS: BLOCKED - Need additional logging and testing to proceed**
