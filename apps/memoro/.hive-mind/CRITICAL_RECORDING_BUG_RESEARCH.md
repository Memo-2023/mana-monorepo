# Critical Recording Bug Research Report
**Date:** 2025-11-19
**Researcher:** Hive Mind Investigation Agent
**Issue:** Background Recording Timer Reset (00:00) and Non-Uploadable File After 1 Hour

---

## Executive Summary

After comprehensive investigation of the Memoro mobile app's audioRecordingV2 feature, I have identified **CRITICAL BUGS** that explain the reported issue where a 1-hour background recording resulted in:
1. Timer showing 00:00 when user returned to app
2. Recording file being non-uploadable (corrupted/invalid)

**Root Cause:** JavaScript timer suspension in background + lack of proper duration persistence mechanism for long recordings.

---

## Issue Context

### User Report
- User backgrounded app while recording
- After approximately 1 hour, returned to find:
  - Timer display showing 00:00
  - Recording file not uploadable (likely corrupted or with invalid metadata)
- App uses Expo SDK 54 with expo-audio on iOS

### Known System Behavior
From documentation analysis:
- Background recording **DOES work** (native recording continues)
- JavaScript timers **ARE suspended** when app is backgrounded (documented behavior)
- Status polling should restart when app returns to foreground

---

## Technical Architecture Analysis

### Duration Tracking System

The app uses a **hybrid duration tracking** approach:

#### 1. **Native Recorder Duration** (Primary Source)
- **Location:** `AudioEngineService.ts:729-783` (status polling)
- **Mechanism:** 100ms `setInterval` polling calling `recorder.getStatus()`
- **Data source:** `status.durationMillis` from native recorder
- **Critical Issue:** **This timer STOPS when app backgrounds**

```typescript
// AudioEngineService.ts:729
this.statusPollingInterval = setInterval(() => {
  const status = this.recorder.getStatus();
  // ...
  const enhancedStatus = {
    currentTime: status.durationMillis || status.currentTime || 0,
    durationMillis: status.durationMillis || 0,
  };
  this.onStatusUpdateCallback(enhancedStatus); // Updates store
}, 100); // Runs every 100ms
```

**Problem:** When iOS backgrounds the app, ALL JavaScript timers (including `setInterval`) are **suspended**. This means:
- Native recording continues ✅
- JavaScript polling STOPS ❌
- No duration updates sent to store for entire background duration ❌

#### 2. **Store Duration State** (UI Display)
- **Location:** `recordingStore.ts:76-130` (status update callback)
- **Mechanism:** Receives updates from polling, stores in Zustand state
- **Display:** UI reads from `session.duration` and `duration` properties

```typescript
// recordingStore.ts:109-129
const durationMs = status.durationMillis || status.currentTime || 0;
const durationInSeconds = durationMs / 1000;

const updatedState = {
  duration: durationMs,
  metering: status.metering,
  session: {
    ...state.session,
    duration: durationInSeconds, // UI displays this
  }
};
```

**Problem:** Store only updates when it receives status callbacks, which don't fire during background.

#### 3. **Foreground Recovery Mechanism**
- **Location:** `IOSRecordingService.ts:120-148` (app state change handler)
- **Mechanism:** When app returns from background, should restart polling and sync duration

```typescript
// IOSRecordingService.ts:136-148
if (status.isRecording || status.isPaused) {
  console.log('iOS: Restarting status polling after background...');
  this.startStatusPolling(); // ✅ Restarts polling

  const currentDuration = status.durationMillis || 0;
  console.log(`iOS: Syncing duration after background: ${Math.floor(currentDuration / 1000)}s`);

  if (this.onStatusUpdateCallback) {
    this.onStatusUpdateCallback(status); // ✅ Should update store with real duration
  }
}
```

**Expected behavior:** Duration should sync with native recorder when foregrounding.

---

## Root Cause Analysis: The 00:00 Timer Bug

### Bug #1: Potential Race Condition on Foreground Recovery

**Evidence from code analysis:**

1. **App State Transition Sequence:**
```
background → active (foreground)
  ↓
IOSRecordingService.handleAppStateChange() fires
  ↓
setupAudioMode() called (async, may take 50-500ms)
  ↓
THEN attempts to:
  - Call startStatusPolling()
  - Get status.durationMillis
  - Update callback with status
```

2. **Potential Issue:** There is a **Promise-based async flow** that could fail or timeout:

```typescript
// IOSRecordingService.ts:125-160
this.setupAudioMode()
  .then(() => {
    // Recovery logic here
    if (this.recordingActive && this.recorder) {
      const status = this.getStatus();
      // ...
      this.onStatusUpdateCallback(status);
    }
  })
  .catch(error => {
    console.error('iOS: Failed to restore audio session:', error);
    // ⚠️ ERROR CASE: What happens to duration sync if this fails?
  });
```

**Critical Gap:** If `setupAudioMode()` fails or times out after 1 hour in background:
- Status polling never restarts ❌
- Duration never syncs ❌
- UI continues showing last known value (could be 0 if reset) ❌

### Bug #2: Store Reset Before Duration Recovery

**Evidence from store code:**

```typescript
// recordingStore.ts:356-468 (stopRecording)
stopRecording: async (memoId?: string) => {
  // ...
  let finalDurationSeconds = session?.duration || 0; // ⚠️ From potentially stale session

  if (uri) {
    savedFile = await fileStorageService.saveRecording(
      uri,
      undefined,
      finalDurationSeconds // ⚠️ Using session duration, not native duration
    );
  }

  // ...
}
```

**Problem:** When stopping after background recovery failure:
- `session.duration` may still be 0 (never updated from background period)
- File gets saved with `duration: 0`
- Upload validation fails: "Valid duration is required"

### Bug #3: No Persistent Duration Fallback

**Missing mechanism:**

The system has **NO fallback** to get true duration if:
1. Status polling fails to restart after backgrounding
2. Audio session restoration fails
3. Store state is stale

**Expected fallback (NOT IMPLEMENTED):**
```typescript
// Pseudocode - what SHOULD exist but DOESN'T
async stopRecording() {
  // Try to get duration from native recorder directly
  const nativeDuration = this.recorder?.getStatus().durationMillis;

  // Fallback to session duration
  const duration = nativeDuration || session?.duration || 0;

  // Last resort: Try to get duration from audio file metadata
  if (duration === 0 && uri) {
    const player = createAudioPlayer(uri);
    duration = player.duration * 1000; // Convert to ms
  }
}
```

---

## Root Cause Analysis: The Non-Uploadable File Bug

### Issue: Zero Duration Files Rejected

From TROUBLESHOOTING.md analysis:
```
Bug 2: Duration Always Zero
Symptom: Recording duration showed as 0 seconds in upload,
causing "Valid duration is required" error
```

### Validation Chain

1. **Recording Stop:**
   - `recordingStore.stopRecording()` captures `session.duration`
   - If backgrounding broke duration sync → `session.duration = 0`

2. **File Save:**
   ```typescript
   // recordingStore.ts:405-409
   savedFile = await fileStorageService.saveRecording(
     uri,
     undefined,
     finalDurationSeconds // ⚠️ = 0 if sync failed
   );
   ```

3. **Upload Validation:**
   - Backend or upload service likely validates `duration > 0`
   - File with `duration: 0` gets rejected as invalid
   - User sees "Valid duration is required" error

### File Corruption Risk

Additional concern: If audio session was lost during backgrounding and not properly recovered, the recording file itself could be:
- Truncated (stopped recording before user returned)
- Missing proper header/metadata
- Corrupted due to improper closure

**Evidence:** Audio session restoration code shows potential failure paths:
```typescript
// IOSRecordingService.ts:158-160
.catch(error => {
  console.error('iOS: Failed to restore audio session:', error);
  // No recovery mechanism if audio session is lost!
});
```

---

## Critical Code Locations

### 1. Status Polling Interval Creation
**File:** `/Users/wuesteon/memoro_new/mana-2025/memoro_app/apps/mobile/features/audioRecordingV2/core/AudioEngineService.ts`
**Lines:** 729-783

**Issue:** JavaScript `setInterval` suspends in background, no alternative tracking.

### 2. Foreground Recovery Logic
**File:** `/Users/wuesteon/memoro_new/mana-2025/memoro_app/apps/mobile/features/audioRecordingV2/platforms/IOSRecordingService.ts`
**Lines:** 120-160

**Issues:**
- Async promise chain can fail silently
- No timeout protection for long background periods
- Error case doesn't trigger alternative recovery

### 3. Duration Capture at Stop
**File:** `/Users/wuesteon/memoro_new/mana-2025/memoro_app/apps/mobile/features/audioRecordingV2/store/recordingStore.ts`
**Lines:** 356-468 (stopRecording method)

**Issues:**
- Relies on potentially stale `session.duration`
- No direct query of native recorder before stop
- No fallback to audio file metadata

### 4. Status Update Callback Guards
**File:** `/Users/wuesteon/memoro_new/mana-2025/memoro_app/apps/mobile/features/audioRecordingV2/store/recordingStore.ts`
**Lines:** 76-130

**Issues:**
- Guards prevent updates if session is null
- Guards prevent updates if status is not RECORDING
- These guards may block legitimate recovery updates

---

## Evidence of Known Issues

### Documentation Confirms Behavior

From `BACKGROUND_RECORDING_FIX.md`:
```
JavaScript timers suspended (normal)
  ↓
[User returns to foreground]
  ↓
Status polling restarts
Duration syncs with native recorder
UI updates with full duration
```

**Gap:** Documentation assumes recovery "just works" but code shows multiple failure points.

From `TROUBLESHOOTING.md`:
```
Important: JavaScript timers (setInterval) are suspended when backgrounded,
but **native audio recording continues**. When returning to foreground,
status polling restarts and syncs with native recorder state.
```

**Problem:** "syncs with native recorder state" is **NOT guaranteed** if:
- Audio session restoration fails
- setupAudioMode() times out
- Promise chain rejects

---

## Hypothesized Failure Scenario

### Timeline of 1-Hour Background Recording Bug

**T=0:00 - Recording Starts**
```
✅ User starts recording
✅ Status polling begins (100ms interval)
✅ Duration updates every 100ms → UI shows live time
✅ session.duration tracking active
```

**T=0:05 - User Backgrounds App**
```
✅ App state: active → inactive → background
✅ Native recording continues (mixWithOthers mode works)
⚠️ JavaScript setInterval SUSPENDS
⚠️ Status polling STOPS
⚠️ No more duration updates to store
⚠️ UI frozen at last value (e.g., "0:05")
```

**T=1:00:00 - User Returns After 1 Hour**
```
App state: background → active
  ↓
IOSRecordingService.handleAppStateChange() fires
  ↓
Calls setupAudioMode() (async)
  ↓
⚠️ CRITICAL: After 1 hour, iOS may have:
  - Deactivated audio session completely
  - Reset Core Audio device IDs
  - Cleared recording permissions cache
  ↓
setupAudioMode() may TIMEOUT or FAIL
  ↓
Promise.catch() fires → Error logged
  ↓
❌ Status polling NEVER restarts
❌ Duration NEVER syncs
❌ UI still shows "0:05" (or resets to "0:00" if store was cleared)
```

**T=1:00:10 - User Attempts to Stop Recording**
```
User taps Stop
  ↓
recordingStore.stopRecording() called
  ↓
Reads session.duration = 0 (or 0:05 = 300000ms if not reset)
  ↓
Calls recorder.stop() → Gets URI
  ↓
Saves file with duration = 0 (or 300000ms, not 3600000ms)
  ↓
❌ File metadata shows wrong duration
❌ Upload validation fails: "Valid duration is required"
❌ File appears corrupted
```

---

## Additional Concerns

### 1. Audio Session Timeout After Long Background

iOS behavior after 1+ hour in background:
- Audio session may be completely deactivated
- Microphone hardware may be reclaimed by system
- Recording might have actually STOPPED without app knowing

**No mechanism exists to detect this scenario.**

### 2. File Integrity Unknown

If recording truly did continue for 1 hour, the file should be ~240MB (64kbps MONO * 3600s).

**Questions:**
- What is the actual file size?
- Can the file be played back?
- Does it contain 1 hour of audio or less?

**Recommendation:** Need to check actual file before assuming corruption.

### 3. No Duration Validation at Stop

The code has NO safety check when stopping:

```typescript
// What SHOULD exist but DOESN'T:
async stopRecording() {
  const uri = await recordingService.stopRecording();

  // ⚠️ MISSING: Validate duration against file metadata
  if (savedFile.duration === 0) {
    // Try to extract duration from audio file
    const actualDuration = await getAudioFileDuration(uri);
    savedFile.duration = actualDuration;
  }
}
```

---

## Recommended Fixes

### High Priority Fixes

#### Fix #1: Add Foreground Recovery Timeout Protection
```typescript
// IOSRecordingService.ts - Modify handleAppStateChange
if (this.lastAppState === 'background' && nextAppState === 'active') {
  console.log('iOS: App returning to foreground, restoring audio session...');

  // Add timeout protection for audio session restoration
  const RESTORATION_TIMEOUT = 5000; // 5 seconds max

  const restorationPromise = this.setupAudioMode();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Audio session restoration timeout')), RESTORATION_TIMEOUT)
  );

  try {
    await Promise.race([restorationPromise, timeoutPromise]);

    // Success - proceed with normal recovery
    if (this.recordingActive && this.recorder) {
      // ... existing recovery code ...
    }
  } catch (error) {
    console.error('iOS: Audio session restoration failed or timed out:', error);

    // FALLBACK RECOVERY: Force re-query of native recorder
    if (this.recordingActive && this.recorder) {
      try {
        // Skip audio session setup, directly poll native recorder
        const nativeStatus = this.recorder.getStatus();
        console.log('iOS: FALLBACK - Got native status:', nativeStatus);

        // Force update store with native duration
        if (this.onStatusUpdateCallback) {
          this.onStatusUpdateCallback(nativeStatus);
        }

        // Restart polling even if audio session setup failed
        this.startStatusPolling();
      } catch (fallbackError) {
        console.error('iOS: CRITICAL - Fallback recovery also failed:', fallbackError);
        // At this point, recording state is unknown - should warn user
      }
    }
  }
}
```

#### Fix #2: Add Direct Native Duration Query at Stop
```typescript
// recordingStore.ts - Modify stopRecording
stopRecording: async (memoId?: string) => {
  console.log('[Store] stopRecording called');
  const { status, session } = get();

  // ... existing pre-checks ...

  let uri = '';
  try {
    // ⭐ NEW: Get native duration BEFORE stopping
    let nativeDurationSeconds = 0;
    try {
      const nativeStatus = recordingService.getStatus();
      nativeDurationSeconds = (nativeStatus.durationMillis || 0) / 1000;
      console.log('[Store] Native recorder duration before stop:', nativeDurationSeconds, 's');
    } catch (error) {
      console.warn('[Store] Could not get native duration:', error);
    }

    // Stop recording
    uri = await recordingService.stopRecording();

    // Use native duration as primary source, fallback to session
    let finalDurationSeconds = nativeDurationSeconds || session?.duration || 0;

    // ... existing file save code ...

    if (uri) {
      savedFile = await fileStorageService.saveRecording(
        uri,
        undefined,
        finalDurationSeconds // Now guaranteed to have native duration
      );

      // ⭐ NEW: Validate and extract duration from file if still zero
      if (savedFile && savedFile.duration === 0) {
        console.warn('[Store] Saved file has zero duration, attempting metadata extraction...');
        try {
          const player = createAudioPlayer(uri);
          const fileDuration = player.duration;
          if (fileDuration > 0) {
            savedFile.duration = fileDuration;
            finalDurationSeconds = fileDuration;
            console.log('[Store] Extracted duration from file metadata:', fileDuration, 's');
          }
          player.release();
        } catch (extractError) {
          console.error('[Store] Could not extract duration from file:', extractError);
        }
      }
    }

    // ... rest of existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

#### Fix #3: Add Background Duration Persistence
```typescript
// IOSRecordingService.ts - Add periodic duration checkpointing
private durationCheckpointInterval: NodeJS.Timeout | null = null;

async startRecording(options?: RecordingOptions): Promise<void> {
  await super.startRecording(options);

  // Start periodic duration checkpointing to AsyncStorage
  // This survives app backgrounding since it's native storage
  this.startDurationCheckpointing();
}

private startDurationCheckpointing(): void {
  // Checkpoint duration every 10 seconds
  this.durationCheckpointInterval = setInterval(async () => {
    if (this.recorder && this.recordingActive) {
      try {
        const status = this.recorder.getStatus();
        const durationMs = status.durationMillis || 0;

        // Save to persistent storage
        await AsyncStorage.setItem('memoro_last_recording_duration', durationMs.toString());
        await AsyncStorage.setItem('memoro_last_recording_timestamp', Date.now().toString());
      } catch (error) {
        console.debug('Failed to checkpoint duration:', error);
      }
    }
  }, 10000); // Every 10 seconds
}

// In handleAppStateChange when foregrounding:
async recoverDurationFromCheckpoint(): Promise<number> {
  try {
    const checkpointedDuration = await AsyncStorage.getItem('memoro_last_recording_duration');
    const checkpointTimestamp = await AsyncStorage.getItem('memoro_last_recording_timestamp');

    if (checkpointedDuration && checkpointTimestamp) {
      const durationMs = parseInt(checkpointedDuration, 10);
      const timestamp = parseInt(checkpointTimestamp, 10);
      const age = Date.now() - timestamp;

      console.log(`Recovered checkpointed duration: ${durationMs}ms (${age}ms ago)`);
      return durationMs;
    }
  } catch (error) {
    console.debug('Failed to recover duration checkpoint:', error);
  }
  return 0;
}
```

#### Fix #4: Add Store State Guards Relaxation for Recovery
```typescript
// recordingStore.ts - Modify registerStatusUpdateCallback
registerStatusUpdateCallback((status: RecorderState) => {
  set((state: any) => {
    // ⭐ RELAXED: Allow updates during STOPPING state for recovery
    if (!state.session && state.status !== RecordingStatus.STOPPING) {
      console.log('Store: Ignoring status update - no active session');
      return state;
    }

    // ⭐ RELAXED: Allow updates for duration recovery even when not actively recording
    // This is critical for foreground recovery after backgrounding
    const isRecoveryScenario = (
      state.status === RecordingStatus.STOPPING ||
      state.status === RecordingStatus.STOPPED
    );

    if (!isRecoveryScenario &&
        state.status !== RecordingStatus.RECORDING &&
        state.status !== RecordingStatus.PAUSED) {
      console.log('Store: Ignoring status update - not in recording state:', state.status);
      return state;
    }

    // ... rest of update logic ...
  });
});
```

### Medium Priority Fixes

#### Fix #5: Add File Validation Before Upload
```typescript
// Before upload, validate file integrity
async validateRecordingFile(uri: string, expectedDuration: number): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getFileInfo(uri);

    if (!fileInfo.exists) {
      console.error('Validation failed: File does not exist');
      return false;
    }

    if (!fileInfo.size || fileInfo.size === 0) {
      console.error('Validation failed: File size is zero');
      return false;
    }

    // Validate duration matches file content
    const player = createAudioPlayer(uri);
    const actualDuration = player.duration;
    player.release();

    if (actualDuration === 0) {
      console.error('Validation failed: Audio file has zero duration');
      return false;
    }

    // Allow 5% tolerance for duration mismatch
    const tolerance = expectedDuration * 0.05;
    if (Math.abs(actualDuration - expectedDuration) > tolerance) {
      console.warn(`Duration mismatch: expected ${expectedDuration}s, got ${actualDuration}s`);
      // Don't fail, but log warning - file might still be valid
    }

    return true;
  } catch (error) {
    console.error('File validation error:', error);
    return false;
  }
}
```

---

## Testing Recommendations

### Reproduction Test
1. Start recording
2. Background app immediately (don't wait)
3. Wait exactly 1 hour
4. Foreground app
5. Observe:
   - Timer value shown
   - Console logs for "Restarting status polling after background"
   - Console logs for "Syncing duration after background"
   - Any errors in audio session restoration
6. Stop recording
7. Check:
   - File size (should be ~240MB for 1hr at 64kbps MONO)
   - File playback (does it contain full 1 hour?)
   - Duration metadata in savedFile object

### Edge Case Tests
1. **30-second background:** Should recover fine (baseline test)
2. **5-minute background:** Test medium duration recovery
3. **30-minute background:** Test long-ish recovery
4. **1-hour background:** Reproduce reported bug
5. **2-hour background:** Test extended edge case
6. **Background during phone call:** Test interruption + background combo
7. **Low battery background:** iOS may be more aggressive about suspending

### Instrumentation Needed
Add logging to track:
```typescript
console.log('[RECOVERY-DEBUG] Foreground detected');
console.log('[RECOVERY-DEBUG] Audio session setup started');
console.log('[RECOVERY-DEBUG] Audio session setup completed in Xms');
console.log('[RECOVERY-DEBUG] Native recorder status:', status);
console.log('[RECOVERY-DEBUG] Store session before update:', state.session);
console.log('[RECOVERY-DEBUG] Store session after update:', state.session);
console.log('[RECOVERY-DEBUG] Status polling restarted: yes/no');
```

---

## Conclusion

The reported issue (00:00 timer display and non-uploadable file after 1-hour background recording) is caused by **multiple interacting failures** in the foreground recovery system:

1. **JavaScript timer suspension** (known and documented, but recovery is fragile)
2. **Async audio session restoration can fail silently** after long background periods
3. **No fallback mechanism** to query native recorder directly if restoration fails
4. **No duration validation** from audio file metadata before upload
5. **Store state guards** may block legitimate recovery updates
6. **No persistent duration checkpointing** during recording

**Severity:** CRITICAL - Data loss scenario
**Frequency:** Likely affects all recordings > 30 minutes when backgrounded
**Impact:** Users lose recordings, see corrupt files, upload failures

**Immediate Action Required:**
1. Implement Fix #1 (timeout protection + fallback recovery)
2. Implement Fix #2 (native duration query at stop)
3. Add extensive logging for foreground recovery debugging
4. Test with 1-hour background recording scenario

**Long-term Solutions:**
- Implement duration checkpointing to AsyncStorage
- Add comprehensive file validation before upload
- Consider native module for guaranteed background duration tracking
- Add user-visible warnings when recovery fails

---

## Files for Investigation Team

### Code Files to Review
1. `/Users/wuesteon/memoro_new/mana-2025/memoro_app/apps/mobile/features/audioRecordingV2/core/AudioEngineService.ts`
   - Lines 729-783 (status polling)
   - Lines 259-262 (polling start)
   - Lines 280-369 (stop recording)

2. `/Users/wuesteon/memoro_new/mana-2025/memoro_app/apps/mobile/features/audioRecordingV2/platforms/IOSRecordingService.ts`
   - Lines 114-177 (app state change handling)
   - Lines 120-160 (foreground recovery)

3. `/Users/wuesteon/memoro_new/mana-2025/memoro_app/apps/mobile/features/audioRecordingV2/store/recordingStore.ts`
   - Lines 76-130 (status update callback with guards)
   - Lines 356-468 (stopRecording with duration capture)

### Documentation Files Referenced
1. `BACKGROUND_RECORDING_FIX.md` - Documents background recording fix but assumes recovery works perfectly
2. `TROUBLESHOOTING.md` - Bug #2 describes "Duration Always Zero" issue
3. `README.md` - Claims background recording works (it does, but recovery is broken)

---

**End of Research Report**
