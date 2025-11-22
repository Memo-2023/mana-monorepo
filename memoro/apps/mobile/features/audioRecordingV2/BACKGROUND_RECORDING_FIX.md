# iOS Background Recording Fix - Summary

**Date Fixed:** October 28, 2025
**Issue:** Recording stopped when app was backgrounded on iOS
**Status:** ✅ RESOLVED

## Quick Summary

iOS background recording now works correctly. Users can:
- Press home button while recording → Recording continues ✅
- Switch to other apps → Recording continues ✅
- Lock the device → Recording continues ✅
- Full duration captured (foreground + background time) ✅

## What Was Broken

Two bugs prevented background recording:

1. **Wrong audio mode:** `interruptionMode: 'doNotMix'`
   - iOS revoked exclusive audio access when app backgrounded
   - Recording stopped immediately

2. **Manual pause logic:** App state handler paused on `inactive` state
   - Treated normal state transition as audio interruption
   - Manually paused recording when backgrounding

## The Fix

### Change 1: Audio Configuration
**File:** `AudioEngineService.ts:114`

```typescript
// BEFORE (WRONG):
interruptionMode: 'doNotMix',

// AFTER (CORRECT):
interruptionMode: 'mixWithOthers',
```

**Why:** iOS allows background apps to share audio hardware (`mixWithOthers`) but not have exclusive access (`doNotMix`).

### Change 2: Remove Manual Pause
**File:** `IOSRecordingService.ts:161-174`

```typescript
// REMOVED the code that paused on 'inactive' state
// Let iOS handle audio naturally
```

**Why:** The `inactive` state is just a transient transition during backgrounding, not an interruption signal.

## How It Works Now

```
User backgrounds app
  ↓
iOS: "This app is mixing with others"
  ↓
iOS: "OK, continue recording"
  ↓
Native recording continues ✅
JavaScript timers suspended (normal)
  ↓
[User returns to foreground]
  ↓
Status polling restarts
Duration syncs with native recorder
UI updates with full duration
```

## Testing

**Verified Scenarios:**
- ✅ Home button → Recording continues
- ✅ App switching → Recording continues
- ✅ Lock screen → Recording continues
- ✅ 30+ second background time captured
- ✅ Full duration shown after stopping

## Technical Details

### Audio Interruption Modes

| Mode | Background Recording | Use Case |
|------|---------------------|----------|
| `doNotMix` | ❌ NO | Professional audio apps (exclusive access) |
| `mixWithOthers` | ✅ YES | Voice memos, podcasts (shared access) |
| `duckOthers` | ✅ YES | Navigation (lowers other audio) |

### iOS App States

```
active → inactive → background
  ↑         ↑          ↑
Foreground Transition Background
```

**Key Insight:** `inactive` is a transition, not an interruption.

## Documentation Updated

1. ✅ `README.md` - Added background recording section
2. ✅ `TROUBLESHOOTING.md` - Added Bug #1 with full analysis
3. ✅ `KNOWLEDGE.md` - Added iOS background recording technical details
4. ✅ `CLAUDE.md` - Updated audio recording system section
5. ✅ This summary document

## Files Modified

1. **AudioEngineService.ts:114** - Changed to `mixWithOthers`
2. **IOSRecordingService.ts:29** - Updated config to match
3. **IOSRecordingService.ts:161-174** - Removed manual pause logic

## Trade-offs

✅ **Benefits:**
- Background recording works
- Standard voice memo behavior
- Multi-app compatibility

⚠️ **Considerations:**
- User's music won't auto-pause
- Background audio might be faintly captured if music is loud
- **Impact:** Minimal - same as Apple Voice Memos

## References

- [iOS Audio Session Programming Guide](https://developer.apple.com/documentation/avfoundation/audio_track_engineering)
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- `TROUBLESHOOTING.md` - Full technical analysis
- `KNOWLEDGE.md` - iOS background recording best practices

## Need Help?

See the comprehensive documentation:
- **Quick start:** `README.md`
- **Bug fixes:** `TROUBLESHOOTING.md`
- **Technical details:** `KNOWLEDGE.md`
- **Main docs:** `CLAUDE.md`
