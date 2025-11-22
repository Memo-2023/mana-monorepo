# Recording Preview Implementation

## Overview
This document describes the temporary recording preview feature implemented on 2025-06-26 to improve UX during audio recording.

## Problem Statement
Previously, during recording, the memo preview would show old memo data with incorrect timestamps and metadata. This was confusing for users as they would see:
- Wrong date/time (from a previous memo)
- Old memo title instead of recording status
- Stale metadata that didn't reflect the current recording

## Solution

### Temporary Recording Preview
During active recording, the app now shows a dedicated temporary preview that displays:

1. **Current Recording Status**
   - "Aufnahme läuft..." (Recording in progress) during recording
   - "Aufnahme wird hochgeladen..." (Uploading recording) during upload

2. **Accurate Timestamp**
   - Shows the actual recording start time
   - Updates duration counter every second

3. **Recording Metadata**
   - Displays recording-specific metadata
   - No confusion with old memo data

### Implementation Details

#### Frontend Changes (`/app/(protected)/(tabs)/index.tsx`)

**State Management:**
```typescript
const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
const [recordingDuration, setRecordingDuration] = useState<number>(0);
```

**Recording Start Handler:**
```typescript
const handleRecordingStart = useCallback(() => {
  setRecordingStatus(RecordingStatus.RECORDING);
  setRecordingStartTime(new Date());
  setRecordingDuration(0);
}, []);
```

**Duration Update Effect:**
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout;
  
  if (recordingStatus === RecordingStatus.RECORDING && recordingStartTime) {
    interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - recordingStartTime.getTime()) / 1000);
      setRecordingDuration(elapsed);
    }, 1000);
  }
  
  return () => {
    if (interval) clearInterval(interval);
  };
}, [recordingStatus, recordingStartTime]);
```

**Conditional Rendering:**
```typescript
{((recordingStatus === RecordingStatus.RECORDING || recordingStatus === RecordingStatus.UPLOADING) && recordingStartTime) ? (
  // Show temporary recording preview
  <MemoPreview
    memo={{
      id: 'recording-temp',
      title: recordingStatus === RecordingStatus.UPLOADING 
        ? t('memo.status.uploading_recording') 
        : t('memo.status.recording_in_progress'),
      timestamp: recordingStartTime,
      source: { duration: recordingDuration },
      metadata: { 
        recordingStatus: recordingStatus === RecordingStatus.UPLOADING ? 'uploading' : 'recording' 
      }
    }}
    // ... other props
  />
) : latestMemo && isMemoPreviewVisible && (
  // Show normal memo preview
)}
```

### Recording Time Preservation

#### Backend Changes (`memoro.service.ts`)
The backend now stores `recordingStartedAt` in memo metadata:

```typescript
metadata: {
  processing: { /* ... */ },
  ...(recordingStartedAt && { recordingStartedAt }),
  ...(location && { location })
}
```

#### Frontend Time Handling
Multiple layers ensure the recording time is preserved:

1. **Recording Store** (`recordingStore.ts`):
   ```typescript
   let memoTimestamp: Date;
   if (transcriptionResult.memo.metadata?.recordingStartedAt) {
     memoTimestamp = new Date(transcriptionResult.memo.metadata.recordingStartedAt);
   } else if (recordingStartTime) {
     memoTimestamp = recordingStartTime;
   } else {
     memoTimestamp = new Date(transcriptionResult.memo.created_at);
   }
   ```

2. **Real-time Updates** (`index.tsx`):
   ```typescript
   let timestamp: Date;
   if (payload.new.metadata?.recordingStartedAt) {
     timestamp = new Date(payload.new.metadata.recordingStartedAt);
   } else if (payload.new.created_at) {
     timestamp = new Date(payload.new.created_at);
   } else if (existingMemo && existingMemo.id === payload.new.id) {
     timestamp = existingMemo.timestamp;
   } else {
     timestamp = new Date();
   }
   ```

3. **Memo Store** (`memoStore.ts`):
   ```typescript
   const timestamp = bestMemo.metadata?.recordingStartedAt 
     ? new Date(bestMemo.metadata.recordingStartedAt)
     : new Date(bestMemo.created_at);
   ```

### Processing State Display

#### DirectMemoTitle Component Updates
The title component now properly shows processing states:

1. **Priority Order:**
   - Recording/Uploading status (highest priority)
   - Processing states (pending/processing)
   - Actual title (when available)
   - Fallback states

2. **No Premature "Ready" State:**
   ```typescript
   // Only show "memo ready" if we truly have no processing information
   if (memo.metadata?.processing) {
     return t('memo.status.memo_transcribing');
   }
   ```

## Benefits

1. **Clear Visual Feedback**: Users see exactly what's happening during recording
2. **Accurate Timestamps**: Shows when recording actually started, not when database entry was created
3. **No Confusion**: Old memo data doesn't appear during new recordings
4. **Consistent Experience**: Same preview style, just with recording-specific content

## Testing

To verify the implementation:

1. Start a new recording
2. Observe the preview shows current time and "Aufnahme läuft..."
3. Watch the duration counter increment
4. Stop recording and see "Aufnahme wird hochgeladen..."
5. After upload, see the new memo with correct recording timestamp
6. Verify processing states show correctly ("Memo transkribiert...", etc.)

## Future Enhancements

Potential improvements:
- Audio level visualization in recording preview
- Pause indicator when recording is paused
- Estimated upload time based on file size
- Recording quality indicators