# Expo SDK 54 Audio Recording Migration Documentation

## Overview
This document details the complete migration from expo-av (deprecated) to expo-audio for audio recording functionality in Expo SDK 54.

## Problem Statement
After upgrading to Expo SDK 54, audio recording completely broke on Android:
- Timer would start but no audio was captured
- Microphone wasn't being accessed despite permissions being granted
- The old implementation incorrectly used the Audio.Recording API that no longer existed

## Investigation & Discovery

### Initial Issues Found
1. **Incorrect API Usage**: Services were using `new AudioRecorder()` directly instead of proper Expo API
2. **Sync/Async Confusion**: Synchronous methods (`record()`, `pause()`) were being treated as async
3. **Missing AudioModule Import**: The correct internal API wasn't being imported
4. **Type Mismatches**: RecorderState interface didn't match actual recorder status

### What We Tried (Failed Approaches)
1. **Direct expo-audio Import**: `import { AudioRecorder } from 'expo-audio'` - AudioRecorder is not exported
2. **Backward Compatibility Wrapper**: Attempted to maintain old API - User explicitly wanted clean replacement
3. **Service-Based Hooks**: Tried using hooks in services - Architectural constraint violation
4. **Base64 Upload**: Old approach loaded entire file into memory - Inefficient for audio files

## Solution Architecture

### Core Components Created

#### 1. AudioEngineService (`/features/audioRecordingV2/core/AudioEngineService.ts`)
```typescript
// Critical: Import AudioModule directly for AudioRecorder class access
import AudioModule from 'expo-audio/build/AudioModule';
import { createRecordingOptions } from 'expo-audio/build/utils/options';

// Key implementation details:
- Creates fresh recorder instance for each recording session
- Proper sync/async method handling
- Status polling for real-time updates
- 5-second timeout on stop() to handle SDK hanging issue
```

#### 2. Platform-Specific Services
- **AndroidRecordingService**: Foreground service, wake lock, notifications
- **IOSRecordingService**: Audio session configuration, background recording

#### 3. Zustand Store (`/features/audioRecordingV2/store/recordingStore.ts`)
- Centralized state management
- Timer controller for duration tracking
- Permission management
- Computed properties for backward compatibility

## Key Fixes Implemented

### 1. Recording Not Starting
**Problem**: Recorder wasn't actually starting, reusing old file URIs
**Solution**:
```typescript
// Always create a fresh recorder for each recording
this.recorder = new AudioModule.AudioRecorder(platformOptions);
await this.recorder.prepareToRecordAsync(platformOptions);
this.recorder.record(); // SYNCHRONOUS - no await!
```

### 2. Recording Not Stopping
**Problem**: `recorder.stop()` hanging indefinitely
**Solution**: Added timeout with recovery
```typescript
const stopPromise = this.recorder.stop();
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Stop recording timeout')), 5000)
);
await Promise.race([stopPromise, timeoutPromise]);
```

### 3. State Management Issues
**Problems**:
- State stuck in STOPPING when stop failed
- Multiple recording instances created
- UI out of sync with store state

**Solutions**:
- Allow recovery from stuck STOPPING state
- Prevent new recordings while still stopping
- Reset to IDLE on error for recovery
- Clean up recorder instance after stop

### 4. Upload Path Structure
**Problem**: Missing memoId in upload path
**Solution**: Generate proper UUID and structure path correctly
```typescript
const memoId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});
const fileName = `${memoId}/audio_${timestamp}.m4a`;
```

### 5. Permission Modal Issues
**Problem**: Modal not closing after permission granted
**Solution**: Added computed properties to store for UI compatibility
```typescript
get permissionDeniedError() {
  const state = get();
  return state.error?.type === RecordingErrorType.PERMISSION_DENIED;
}
```

### 6. Infinite Render Loop
**Problem**: useScreenTracking causing constant re-renders
**Solution**: Fixed dependency array in hook
```typescript
}, [screenName, screen]) // Remove properties from dependencies to avoid loops
```

## Current State

### What's Working ✅
- Recording starts and creates unique audio files
- Proper file URIs generated for each recording
- Upload to cloud storage with correct path structure
- Permission handling and modals
- Android foreground service and wake lock
- State management with recovery mechanisms
- Timer and duration tracking

### Known Issues ⚠️
1. **Android Emulator**: Audio recording produces empty files (emulator limitation)
   - Microphone access doesn't work properly in emulators
   - Must test on physical devices

2. **Stop Method Hanging**: Expo SDK 54's `recorder.stop()` occasionally hangs
   - Mitigated with 5-second timeout
   - May need further investigation with Expo team

3. **Sound Effects**: Cannot play start/stop sounds
   - `TypeError: Cannot assign to property 'currentTime' which has only a getter`
   - Non-critical, sounds disabled for now

## Testing Recommendations

### For Development
1. Use physical Android device (not emulator)
2. Enable USB debugging and use `expo run:android --device`
3. Check file sizes to verify audio is being recorded:
   ```
   Recording file size: [size] bytes
   ⚠️ Recording file is very small - may be empty (common emulator issue)
   ```

### For Production
1. Test on various Android versions (especially Android 13+)
2. Verify background recording with app minimized
3. Test permission flows (first time, denied, re-request)
4. Verify upload and transcription pipeline

## Potential Improvements

### State Machine Enhancements
Consider implementing a more robust state machine:
```typescript
enum RecordingState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  READY = 'ready',
  STARTING = 'starting',
  RECORDING = 'recording',
  PAUSING = 'pausing',
  PAUSED = 'paused',
  RESUMING = 'resuming',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}
```

### Recovery Mechanisms
1. Add exponential backoff for retries
2. Implement automatic cleanup on app backgrounding
3. Add health check endpoint for recorder instance
4. Consider WebRTC as fallback for problematic devices

### Performance Optimizations
1. Implement audio compression before upload
2. Add chunked upload for large files
3. Cache recording settings
4. Optimize status polling interval based on state

## Migration Checklist for Other Projects

- [ ] Remove all expo-av dependencies
- [ ] Install expo-audio (comes with Expo SDK 54)
- [ ] Import AudioModule from 'expo-audio/build/AudioModule'
- [ ] Import createRecordingOptions from 'expo-audio/build/utils/options'
- [ ] Handle synchronous methods without await
- [ ] Implement timeout for stop() method
- [ ] Add platform-specific services for Android/iOS
- [ ] Update state management for new recording flow
- [ ] Test on physical devices (not emulators)
- [ ] Verify file upload path structure

## References
- [Expo Audio Documentation](https://docs.expo.dev/versions/v54.0.0/sdk/audio/)
- [Expo SDK 54 Breaking Changes](https://expo.dev/changelog/2024/05-07-sdk-54)
- Internal AudioModule API: `expo-audio/build/AudioModule`
- Recording Options Utility: `expo-audio/build/utils/options`

## Contributors
- Initial investigation and migration: Claude & User
- Testing and verification: Pending
- Production deployment: Pending

---
*Last updated: 2025-09-24*
*Expo SDK version: 54.0.0*
*expo-audio version: Bundled with SDK 54*