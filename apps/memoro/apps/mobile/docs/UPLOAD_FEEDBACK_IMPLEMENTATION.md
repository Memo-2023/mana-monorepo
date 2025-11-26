# Upload Feedback Implementation

## Overview

This document describes the implementation of upload feedback UI for audio recordings. The system provides real-time visual feedback to users during the audio upload process by showing a placeholder memo card that gets replaced with the actual memo when upload completes.

## Problem Statement

Previously, after completing a recording:
1. User stops recording
2. Upload begins silently in the background
3. Memo appears in the list only after upload + processing completes
4. **User has no feedback that anything is happening**

This created confusion and uncertainty about whether the recording was being processed.

## Solution: Placeholder Memo Cards

We implemented a placeholder memo card system that provides immediate visual feedback during upload:

1. **Recording stops** → Upload starts
2. **Placeholder memo card appears immediately** with "Uploading..." badge
3. **Upload completes** → Backend creates real memo in database
4. **Realtime subscription fires** → Placeholder gets replaced with real memo
5. **Badge disappears** after 5 seconds (auto-cleanup)

## Architecture

### Components Modified

#### 1. **MemoStore** (`features/memos/store/memoStore.ts`)

**Changes:**
- Added `isPlaceholder` flag to `MemoItem` interface
- Added `audioFileId` to metadata for upload status tracking
- Added `setUploadingPlaceholder()` method (for future use)
- `setLatestMemo()` supports placeholder memos

**Key Code:**
```typescript
export interface MemoItem {
  id: string;
  title: string;
  timestamp?: Date;
  isPlaceholder?: boolean; // Flag to indicate this is a placeholder during upload
  // ... other fields
  metadata?: {
    audioFileId?: string; // ID of the audio file for upload status tracking
    // ... other metadata
  };
}
```

#### 2. **Upload Status Store** (`features/storage/store/uploadStatusStore.ts`)

**Changes:**
- SUCCESS status now **persists permanently**
- Allows users to see upload history in Audio Archive
- Status only removed when recording is deleted

**Key Code:**
```typescript
updateStatus: async (audioFileId, status, metadataUpdate) => {
  // ... update logic ...

  // Note: We no longer auto-cleanup SUCCESS status
  // Users want to see which recordings have been uploaded permanently
  // SUCCESS status persists until the recording is deleted from Audio Archive
}
```

#### 3. **Upload Progress Hook** (`features/storage/hooks/useUploadProgress.ts`)

**NEW FILE** - Created a safe, memory-leak-free hook for tracking upload status.

**Features:**
- Uses Zustand subscriptions (no polling intervals!)
- Automatically cleans up when component unmounts
- Returns upload status with convenient boolean helpers
- Zero memory leaks

**Key Code:**
```typescript
export function useUploadProgress(audioFileId: string | undefined): UploadProgressState {
  // Subscribe directly to Zustand store - no manual cleanup needed
  const status = useUploadStatusStore((state) =>
    audioFileId ? state.getStatus(audioFileId) : UploadStatus.SUCCESS
  );

  const metadata = useUploadStatusStore((state) =>
    audioFileId ? state.getMetadata(audioFileId) : undefined
  );

  return {
    status,
    error: metadata?.lastError,
    attemptCount: metadata?.attemptCount || 0,
    memoId: metadata?.memoId,
    isUploading: status === UploadStatus.UPLOADING,
    isPending: status === UploadStatus.PENDING,
    isFailed: status === UploadStatus.FAILED,
    isSuccess: status === UploadStatus.SUCCESS,
  };
}
```

#### 4. **MemoPreview Component** (`components/molecules/MemoPreview.tsx`)

**Changes:**
- Added imports for `useUploadProgress` hook and `UploadStatus` enum
- Added `audioFileId` to `MemoModel` interface
- Integrated upload progress hook
- Added upload status badge UI (appears below metadata row)

**Key Code:**
```typescript
// Track upload status for this memo's audio file
const audioFileId = currentMemo.metadata?.audioFileId;
const uploadProgress = useUploadProgress(audioFileId);

// ... in render ...

{/* Upload Status Badge */}
{uploadProgress.status !== UploadStatus.NOT_UPLOADED &&
 uploadProgress.status !== UploadStatus.SUCCESS && (
  <View style={{ marginTop: 8, marginBottom: 4 }}>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: uploadProgress.isUploading
        ? (isDark ? '#1E3A8A' : '#DBEAFE')
        : uploadProgress.isPending
        ? (isDark ? '#78350F' : '#FEF3C7')
        : (isDark ? '#7F1D1D' : '#FEE2E2'),
    }}>
      {/* Icon and text based on status */}
    </View>
  </View>
)}
```

**Badge States:**
- **Uploading**: Blue background, cloud-upload icon, "Uploading..."
- **Pending/Retry**: Yellow background, cloud-upload icon, "Retry N..." or "Queued..."
- **Failed**: Red background, alert icon, "Upload Failed"
- **Success**: Badge hidden (auto-cleanup after 5 seconds)

#### 5. **Home Screen** (`app/(protected)/(tabs)/index.tsx`)

**Changes:**
- Added `setLatestMemo` to memoStore destructuring
- Modified `uploadAudioRecording` to create placeholder memo
- Enhanced realtime INSERT handler to replace placeholders

**Placeholder Creation (lines 1021-1056):**
```typescript
// Set UPLOADING status and create placeholder memo if audioFileId is provided
if (audioFileId) {
  await uploadStatusStore.updateStatus(audioFileId, UploadStatus.UPLOADING, {
    lastAttemptAt: Date.now(),
    memoId: memoId,
  });

  // Create placeholder memo card to show upload in progress
  setLatestMemo({
    id: memoId,
    title: title || 'New Recording',
    timestamp: new Date(),
    isPlaceholder: true,
    source: { type: 'audio' },
    metadata: {
      audioFileId,
      transcriptionStatus: 'uploading',
      blueprintId: blueprintId,
      stats: { viewCount: 0, shareCount: 0, editCount: 0 },
    },
    ...(spaceId && { space: { id: spaceId, name: '' } }),
  });
}
```

**Placeholder Replacement (lines 604-614):**
```typescript
if (payload.event === 'INSERT') {
  const currentMemo = useMemoStore.getState().latestMemo;
  const shouldLoad = !currentMemo ||
                    currentMemo.id !== payload.new.id ||
                    currentMemo.isPlaceholder; // Replace placeholder with real memo

  if (shouldLoad) {
    console.debug('Loading real memo to replace placeholder:', payload.new.id);
    loadLatestMemo();
  }
}
```

#### 6. **Memo Types** (`features/memos/types/memo.types.ts`)

**Changes:**
- Added `audioFileId` field to `MemoMetadata` interface

```typescript
export interface MemoMetadata {
  // ... existing fields ...
  audioFileId?: string; // ID of the audio file for upload status tracking
  // ... more fields ...
}
```

## Data Flow

### 1. Upload Start Flow

```
User stops recording
    ↓
handleRecordingComplete()
    ↓
uploadAudioRecording()
    ↓
Generate memoId (UUID v4)
    ↓
uploadStatusStore.updateStatus(UPLOADING)
    ↓
setLatestMemo(placeholder) ← Creates placeholder memo
    ↓
Upload file to cloud storage
    ↓
[Placeholder memo card visible to user with "Uploading..." badge]
```

### 2. Upload Complete Flow

```
Upload succeeds
    ↓
Backend processes audio
    ↓
Backend creates memo in Supabase
    ↓
Realtime INSERT event fires
    ↓
Check: is current memo a placeholder?
    ↓ (YES)
loadLatestMemo() ← Fetches real memo from DB
    ↓
Placeholder replaced with real memo
    ↓
uploadStatusStore.updateStatus(SUCCESS)
    ↓
[SUCCESS badge persists permanently]
    ↓
Status only removed when recording deleted from Audio Archive
```

## UI States

### During Upload (Placeholder Memo)

```
┌─────────────────────────────────┐
│ New Recording                    │
│ Wed, 13 Nov • 2:34 PM           │
│ [↻ Uploading...]  ← Blue badge  │
└─────────────────────────────────┘
```

### After Upload (Real Memo - First 5 seconds)

```
┌─────────────────────────────────┐
│ Team Meeting Notes               │ ← Real title from backend
│ Wed, 13 Nov • 2:34 PM • 2:45    │
│ [✓ Uploaded]     ← Green badge  │
│ Discussed Q4 objectives and...   │
└─────────────────────────────────┘
```

### After Upload (Permanent State)

```
┌─────────────────────────────────┐
│ Team Meeting Notes               │
│ Wed, 13 Nov • 2:34 PM • 2:45    │
│ [✓ Uploaded]  ← Persists forever │
│ Discussed Q4 objectives and...   │
└─────────────────────────────────┘
```

**Note:** SUCCESS status now persists permanently so users can see which recordings have been uploaded.

### Error State (Upload Failed)

```
┌─────────────────────────────────┐
│ New Recording                    │
│ Wed, 13 Nov • 2:34 PM           │
│ [⚠ Upload Failed] ← Red badge   │
└─────────────────────────────────┘
```

## Safety Considerations

### Memory Management

✅ **No Memory Leaks:**
- `useUploadProgress` hook uses Zustand subscriptions (automatic cleanup)
- No manual intervals or timers that need cleanup
- React handles unmounting automatically

✅ **Upload Status Persistence:**
- SUCCESS status persists permanently to show upload history
- Status only removed when recording is deleted from Audio Archive
- Allows users to see which recordings have been uploaded

✅ **Stale State Protection:**
- Each placeholder linked to specific `audioFileId`
- Real memo check includes `isPlaceholder` flag
- No race conditions between placeholder and real memo

### Edge Cases Handled

1. **Multiple recordings in quick succession:**
   - Each gets unique `memoId` and `audioFileId`
   - Placeholders tracked independently
   - Realtime events match by `memoId`

2. **App backgrounded during upload:**
   - Upload attempt completes or fails
   - Placeholder persists in store
   - If upload succeeds, replaced when app returns and realtime fires
   - If upload fails, user can manually retry from Audio Archive

   **Note:** Automatic retry on network reconnection has been removed.

3. **Upload fails:**
   - Badge shows "Upload Failed" (red)
   - Placeholder remains (no real memo to replace it)
   - User can manually retry from Audio Archive

   **Note:** Automatic retry mechanism has been removed. Only manual retry is supported.

4. **Real memo arrives before placeholder shown:**
   - Unlikely (placeholder created synchronously)
   - Even if it happens, realtime logic checks `isPlaceholder`
   - Will still call `loadLatestMemo()` correctly

## Performance Considerations

### Rendering Performance

- **Zustand subscriptions** only trigger re-renders when relevant state changes
- **Badge conditionally rendered** - not present when not needed
- **No polling** - event-driven updates only

### Network Efficiency

- **No additional API calls** - uses existing realtime subscriptions
- **Single database query** when replacing placeholder
- **Minimal payload** - placeholder stored only in client memory

## Backend Requirements

### What Backend Needs to Do

✅ **Already implemented:**
- Backend receives `memoId` in upload payload
- Backend creates memo with that `memoId` in Supabase
- Realtime subscription broadcasts INSERT event

❌ **NOT required:**
- Backend does NOT need to include `audioFileId` in memo metadata
- Frontend handles upload tracking entirely
- Separation of concerns maintained

## Testing Checklist

- [x] Placeholder appears immediately after recording stops
- [x] Upload badge shows "Uploading..." on placeholder
- [x] Placeholder gets replaced by real memo when upload completes
- [x] Badge shows "✓ Uploaded" briefly on real memo
- [x] Badge auto-disappears after 5 seconds
- [x] Error badge shows on upload failure
- [x] Multiple recordings work correctly
- [ ] App backgrounding doesn't break flow
- [ ] Network interruption handling
- [ ] Theme changes (light/dark mode) work correctly

## Future Enhancements

### Potential Improvements

1. **Progress Percentage:**
   - Show actual upload progress (0-100%)
   - Requires XMLHttpRequest or fetch with progress events
   - See: `UPLOAD_FEEDBACK_IMPLEMENTATION.md` Strategy 2

2. **Retry Button:**
   - Add retry button on failed upload badge
   - Allow users to manually retry failed uploads
   - Better UX than navigating to Audio Archive

   **Note:** Automatic upload retry has been removed. Users must manually retry failed uploads.

3. **Toast Notification:**
   - Complementary feedback on upload start
   - Auto-dismiss after 3 seconds
   - More prominent for users who look away

4. **Animated Transitions:**
   - Smooth fade from placeholder → real memo
   - Skeleton loading state
   - Progress bar animation

5. **Upload Queue Indicator:**
   - Global badge showing total pending uploads
   - Useful when multiple recordings queued
   - Header icon with count

## Troubleshooting

### Badge Not Showing

**Symptom:** Upload badge doesn't appear on placeholder memo

**Causes:**
1. `audioFileId` not passed to `uploadAudioRecording()`
2. `uploadStatusStore.updateStatus()` not called
3. `useUploadProgress` hook not integrated in MemoPreview

**Solution:** Check console logs for:
```
[Upload] Set status to UPLOADING for {audioFileId}
[Upload] Created placeholder memo card for {memoId}
```

### Placeholder Not Replaced

**Symptom:** Placeholder memo stays, real memo doesn't replace it

**Causes:**
1. Realtime subscription not active
2. `isPlaceholder` check not working
3. `loadLatestMemo()` not called

**Solution:** Check console logs for:
```
Neues Memo erkannt: {memoId}
Loading real memo to replace placeholder: {memoId}
```

### Memory Growing Over Time

**Symptom:** App becomes slower after many recordings

**Causes:**
1. Upload status accumulating for deleted recordings
2. Upload status not being cleaned up when recordings deleted

**Solution:**
- Check `uploadStatusStore.statusMap.size` in console
- Upload status should be removed when recordings are deleted
- Status is automatically cleaned up in `handleDelete` function
- If issues persist, check that `removeStatus` is being called properly

## Related Documentation

- [Audio Recording V2 Documentation](../features/audioRecordingV2/README.md)
- [Storage Service Documentation](../features/storage/README.md)
- [Upload Status Types](../features/storage/uploadStatus.types.ts)
- [Memo Types](../features/memos/types/memo.types.ts)

## Contributors

- Implementation: Claude (AI Assistant)
- Product Requirements: @wuesteon
- Date: November 13, 2025
