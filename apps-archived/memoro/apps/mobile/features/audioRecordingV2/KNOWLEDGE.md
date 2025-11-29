# Audio Recording V2 - Technical Knowledge

## iOS Background Recording

### Audio Session Modes

iOS provides three audio interruption modes for managing how your app's audio interacts with other apps:

#### Mode Comparison

| Mode | Background Recording | Other Apps' Audio | iOS Behavior | Use Case |
|------|---------------------|-------------------|--------------|----------|
| `doNotMix` | ❌ NO | Paused/Stopped | Requires exclusive access, revoked when backgrounded | Professional DAWs, music production |
| `mixWithOthers` | ✅ YES | Continues normally | Shares audio hardware, continues in background | ✅ **Voice memos, podcasts** |
| `duckOthers` | ✅ YES | Lowered (~30%) | Reduces other audio volume | Navigation, voice prompts |

#### Technical Details: mixWithOthers Mode

**Why It's Required for Background Recording:**

```typescript
// AudioEngineService.ts:114
await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'mixWithOthers',  // ✅ CRITICAL for background recording
});
```

**How iOS Enforces Background Audio Rules:**

1. **Foreground Apps:**
   - Can request exclusive audio access (`doNotMix`)
   - iOS grants exclusive microphone/speaker control
   - Other apps' audio is paused

2. **Background Apps:**
   - **Cannot** have exclusive audio access
   - Must use `mixWithOthers` or `duckOthers`
   - iOS deactivates non-mixing sessions when app backgrounds

3. **State Transitions:**
   ```
   User presses home button:
   active → inactive → background

   doNotMix:  iOS deactivates session → Recording stops ❌
   mixWithOthers: iOS keeps session active → Recording continues ✅
   ```

### App State Handling

**iOS App State Lifecycle:**

```
Foreground:  active
                ↓ (home button / app switch)
Transition:  inactive  ← Brief transitional state
                ↓
Background:  background
```

**Important:** The `inactive` state is a **transient transition**, NOT an audio interruption signal.

**Correct Handling:**

```typescript
// IOSRecordingService.ts
handleAppStateChange(nextAppState) {
  if (lastState === 'active' && nextAppState === 'background') {
    // ✅ Recording continues naturally with mixWithOthers
    console.log('Backgrounded, recording continues');
  }

  // ❌ WRONG: Don't treat 'inactive' as interruption
  // if (nextAppState === 'inactive') {
  //   this.pauseRecording(); // This breaks background recording!
  // }
}
```

**Real Audio Interruptions:**

These are handled automatically by iOS:
- **Phone calls** - iOS pauses recording
- **Siri** - iOS pauses recording
- **FaceTime calls** - iOS pauses recording
- **Alarm/Timer** - iOS may pause (depends on user action)

Your app receives interruption notifications from iOS, not from app state changes.

### Background Recording Requirements

**Required Configuration:**

1. **Info.plist** (via app.json):
   ```json
   {
     "ios": {
       "infoPlist": {
         "UIBackgroundModes": ["audio"]
       }
     }
   }
   ```

2. **Audio Mode** (AudioEngineService.ts):
   ```typescript
   interruptionMode: 'mixWithOthers'
   ```

3. **No Manual Pause Logic** (IOSRecordingService.ts):
   - Don't pause on `inactive` state
   - Let iOS handle real interruptions

### JavaScript Timer Behavior

**Important:** JavaScript timers (`setInterval`, `setTimeout`) are **suspended** when app is backgrounded.

**Impact:**
```typescript
// Status polling interval (AudioEngineService.ts:709)
this.statusPollingInterval = setInterval(() => {
  const status = this.recorder.getStatus();
  this.onStatusUpdateCallback(status);
}, 100);
```

- ⏸️ **Paused** when app backgrounds
- ▶️ **Resumed** when app foregrounds
- 🎤 **Native recording continues** regardless

**Solution:**

When app returns to foreground, restart polling:

```typescript
// IOSRecordingService.ts:136
if (lastState === 'background' && nextState === 'active') {
  this.startStatusPolling();  // Restart JavaScript polling
  // Native recording never stopped, just sync UI
}
```

### Performance Considerations

**Status Polling Overhead:**
- **Frequency:** 100ms (10 updates/second)
- **CPU Impact:** ~0.1% (negligible)
- **Memory Impact:** <1KB constant
- **Battery Impact:** Minimal

**Native Recording:**
- Handled by iOS Core Audio (separate process)
- Not affected by JavaScript suspension
- Continues in background independently
- More efficient than JavaScript-based solutions

### Best Practices

1. **Always use `mixWithOthers` for voice memos**
2. **Don't manually pause on app state transitions**
3. **Let iOS handle real audio interruptions**
4. **Restart status polling when foregrounding**
5. **Test on real devices, not just simulator**

## Audio Metering

### What is Audio Metering?
Audio metering provides real-time feedback about the audio input level during recording. The metering value represents the audio input level in decibels (dB).

### Metering Value Range
- **Range**: Typically -160 to 0 dB (negative values)
- **0 dB**: Maximum level (loudest)
- **-40 to -20 dB**: Normal speaking voice
- **-60 dB and below**: Very quiet/silence
- **undefined**: Recording not active or metering unavailable

### How Metering Works in Our Implementation

1. **Source**: Metering values come from Expo Audio's Recording API
   - Retrieved via `recorder.getStatus()` in `AudioEngineService.ts`
   - Native audio APIs provide these values based on microphone input

2. **Data Flow**:
   ```
   Microphone → Expo Audio API → recorder.getStatus() → AudioEngineService → RecordingStore → UI Components
   ```

3. **Update Frequency**:
   - Status polling occurs every 250ms during active recording
   - Metering values update in real-time with this frequency

4. **Usage in Components**:
   - Available in recording status for visual feedback
   - Can be used to create audio level indicators
   - Helps users verify microphone is working and picking up sound

### Implementation Details

The metering value is:
- Retrieved in `AudioEngineService.ts:351` via `this.recorder.getStatus()`
- Included in the enhanced status object returned to consumers
- Logged during recording for debugging (see line 513)
- Stored in the recording store state for UI access

### Platform Differences
- **iOS**: Reliable metering values
- **Android**: Reliable metering values
- **iOS Simulator**: May have issues with metering updates (known Expo limitation)
- **Web**: Metering availability depends on browser audio API support

### Troubleshooting
- If metering shows `undefined`: Check recording permissions and ensure recording is active
- If metering stuck at one value: May indicate audio subsystem issues or simulator limitations
- If metering always shows very low values: Check microphone permissions and device audio settings