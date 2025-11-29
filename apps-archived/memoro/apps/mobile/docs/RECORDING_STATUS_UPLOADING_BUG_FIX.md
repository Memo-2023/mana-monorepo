# RecordingStatus.UPLOADING Bug Fix

## Issue Description

After recording an audio memo, the title displayed incorrectly across the application:
- ✅ **Memo list** (memo index page): Shows CORRECT AI-generated title
- ❌ **Recording screen preview**: Shows "Aufnahme wird hochgeladen..." (placeholder)
- ❌ **Detail page**: Shows placeholder/wrong title

### User Impact

Users would record a memo, and while the memo list showed the correct AI-generated title, the preview card on the recording screen and the detail page would show placeholder text like "Aufnahme wird hochgeladen..." or "Uploading recording..." instead of the actual title.

## Investigation Journey

### Step 1: Initial Hypothesis - Backend Title Issue

**What we tried first:**
- Analyzed logs and found that `triggerTranscription` was being called with `title: "Memo"` (hardcoded)
- Discovered that the `title` and `blueprintId` parameters were being passed but not in the function signature
- **Fixed:** Added `title` and `blueprintId` to the `transcriptionUtils.ts` function signature

**Result:** Backend was now receiving the correct title, but the display issue persisted.

### Step 2: Deep Log Analysis

User provided logs showing:
```typescript
🎯 Triggering transcription with: {
  "title": "Test 2",  // User's actual title
  "blueprintId": "11111111-2222-3333-4444-555555555555",
  ...
}
```

But also showing:
```typescript
DEBUG  Showing "Uploading recording..." for memo: b094ff63-690c-4f07-9a8f-99a3579c3719
```

**Key insight:** The title was being set correctly in the backend, but something in the frontend display logic was overriding it.

### Step 3: Root Cause Discovery

Examined the `RecordingStatus` enum definition:
```typescript
// features/audioRecordingV2/types/index.ts
export enum RecordingStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
  // ❌ NO UPLOADING STATUS EXISTS!
}
```

**Critical Finding:** Multiple files were checking for `RecordingStatus.UPLOADING` which doesn't exist in the enum!

### Files Referencing Non-Existent Status

1. **`useMemoProcessing.ts`** (lines 83, 96, 220)
   ```typescript
   if (effectiveRecordingStatus === RecordingStatus.UPLOADING) {
     return MemoProcessingStatus.UPLOADING;  // This never executed correctly
   }
   ```

2. **`index.tsx`** (line 1426)
   ```typescript
   {(recordingStatus === RecordingStatus.RECORDING ||
     recordingStatus === RecordingStatus.UPLOADING) &&  // Always undefined
   recordingStartTime ? (
   ```

3. **`RecordingButton.tsx`** (lines 170, 316, 408, etc.)
   ```typescript
   const isUploading = status === RecordingStatus.UPLOADING;  // Always false/undefined
   if (isUploading) return;  // Never worked
   ```

### The Core Problem

When the code checked `status === RecordingStatus.UPLOADING`, it was comparing to `undefined` (since UPLOADING doesn't exist in the enum). This caused:
- Conditional logic to fail
- Display logic to show placeholder text instead of actual titles
- Animation logic to never trigger
- The `isUploading` variable to always be falsy, but still be referenced elsewhere causing ReferenceErrors

## Solution Implemented

### Changes Made

Removed **ALL** references to the non-existent `RecordingStatus.UPLOADING`:

#### 1. `useMemoProcessing.ts`
```typescript
// BEFORE (Lines 81-92):
const processingStatus = useMemo((): MemoProcessingStatus => {
  if (effectiveRecordingStatus === RecordingStatus.UPLOADING) {
    return MemoProcessingStatus.UPLOADING;
  }
  if (
    effectiveRecordingStatus === RecordingStatus.RECORDING ||
    effectiveRecordingStatus === RecordingStatus.PAUSED
  ) {
    return MemoProcessingStatus.UPLOADING;
  }
  // ...
}

// AFTER:
const processingStatus = useMemo((): MemoProcessingStatus => {
  // Note: RecordingStatus.UPLOADING doesn't exist in the enum, removed invalid check
  if (
    effectiveRecordingStatus === RecordingStatus.RECORDING ||
    effectiveRecordingStatus === RecordingStatus.PAUSED
  ) {
    return MemoProcessingStatus.UPLOADING;
  }
  // ...
}
```

Also removed from displayTitle logic:
```typescript
// REMOVED:
if (effectiveRecordingStatus === RecordingStatus.UPLOADING) {
  return t('memo.status.uploading_recording');
}
```

#### 2. `index.tsx`
```typescript
// BEFORE (Line 1426):
{(recordingStatus === RecordingStatus.RECORDING ||
  recordingStatus === RecordingStatus.UPLOADING) &&
recordingStartTime ? (
  <MemoPreview
    memo={{
      title: recordingStatus === RecordingStatus.UPLOADING
        ? t('memo.status.uploading_recording')
        : t('memo.status.recording_in_progress'),
      // ...
    }}
  />
)}

// AFTER:
{recordingStatus === RecordingStatus.RECORDING && recordingStartTime ? (
  <MemoPreview
    memo={{
      title: t('memo.status.recording_in_progress'),
      // ...
    }}
  />
)}
```

#### 3. `RecordingButton.tsx`

**Removed isUploading variable (line 169-170):**
```typescript
// REMOVED:
const isUploading = status === RecordingStatus.UPLOADING;
```

**Removed from backgroundColor (line 182):**
```typescript
// BEFORE:
const backgroundColor = (isRecording || isUploading) ? themeColor : 'transparent';

// AFTER:
const backgroundColor = isRecording ? themeColor : 'transparent';
```

**Removed from handlePressIn (line 408):**
```typescript
// REMOVED:
if (isUploading) return;

// REMOVED from debug log:
console.debug('🔥 handlePressIn - Press started', { isRecording, isPaused, isUploading });
```

**Removed from animation logic (lines 316-327):**
```typescript
// REMOVED:
} else if (status === RecordingStatus.UPLOADING) {
  cancelAnimation(rotationAnim);
  uploadProgressAnim.value = withTiming(1, {
    duration: 6000,
    easing: Easing.out(Easing.ease)
  });
```

**Removed from disabled prop (line 956):**
```typescript
// BEFORE:
disabled={isPaused || isUploading}

// AFTER:
disabled={isPaused}
```

**Removed upload progress overlay JSX (lines 974-976):**
```typescript
// REMOVED:
{isUploading && (
  <Animated.View style={uploadProgressStyle} />
)}
```

**Removed from icon styling (lines 978-990):**
```typescript
// REMOVED conditional styling:
...(isUploading && {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 3,
})
```

## Why This Happened

The `RecordingStatus.UPLOADING` appears to be a **legacy value** that was removed from the enum in a previous refactor, but references weren't cleaned up throughout the codebase.

### Historical Context

The upload state was likely intended to show a distinct UI state between:
1. Recording audio
2. Uploading to storage
3. Backend processing (transcription/title generation)

However, the actual implementation removed the UPLOADING status from the enum and relied on the store's internal state management instead.

## Fix Verification

### Expected Behavior After Fix

1. **During recording:**
   - Preview shows "Recording in progress..."
   - Recording button shows filled state with animation

2. **After recording stops:**
   - Preview immediately switches to show the latest memo
   - Title displays actual memo title (or processing status)
   - Real-time subscriptions update the title when AI generation completes

3. **No ReferenceErrors:**
   - No crashes due to undefined `isUploading` variable
   - All conditional checks work correctly

### Testing Steps

1. Record a new memo
2. Verify preview shows "Recording in progress..." during recording
3. Stop recording
4. Verify preview immediately shows the memo (not placeholder)
5. Wait for AI title generation
6. Verify title updates via real-time subscription
7. Navigate to detail page - verify correct title
8. Check memo list - verify correct title

## Files Modified

- `/features/memos/hooks/useMemoProcessing.ts` - Removed UPLOADING checks from display logic
- `/app/(protected)/(tabs)/index.tsx` - Simplified preview conditional
- `/components/atoms/RecordingButton.tsx` - Removed all UPLOADING references and animations
- `/features/storage/transcriptionUtils.ts` - Added title/blueprintId parameters (separate fix)

## Related Issues

- **Broadcast Channel Implementation**: Added broadcast subscriptions to catch service_role updates (separate feature)
- **Title Parameter Fix**: Ensured title is passed to backend API (completed earlier in session)

## Commit

```
🐛 fix: remove non-existent RecordingStatus.UPLOADING references
Commit: de1383e
```

## Implementation Date

October 23, 2025

## Key Takeaways

1. **Enum validation matters**: When an enum value is removed, all references must be found and removed
2. **Silent failures**: Checking for undefined enum values doesn't throw errors, just silently fails
3. **Comprehensive search**: Must search across entire codebase, not just the obvious files
4. **Testing limitations**: The bug wasn't caught by type checking because the checks were valid TypeScript (comparing to undefined)

## Prevention Strategies

1. **Use TypeScript exhaustive checks** where possible
2. **Add ESLint rules** to detect references to undefined enum values
3. **Search codebase** before removing enum values
4. **Add integration tests** that verify UI states match enum values
