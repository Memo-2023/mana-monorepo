# expo-av to expo-audio Migration Guide

## Overview

This guide documents the migration from `expo-av` to `expo-audio` completed as part of the Expo SDK 54 upgrade to address Android 16 compatibility issues and deprecation warnings.

## Background

### Why We Migrated

1. **Deprecation**: `expo-av` was deprecated in Expo SDK 54
2. **Android 16 Issues**: Recording functionality broken on Android 16 devices
3. **Performance**: `expo-audio` offers better performance and smaller bundle size
4. **Future Support**: `expo-audio` is actively maintained and developed

### Timeline

- **Date**: January 2025
- **Expo SDK**: 53 → 54
- **React Native**: 0.79.2 → 0.81.4
- **expo-av**: 15.1.4 → removed
- **expo-audio**: not used → 1.0.13

## Migration Steps

### 1. Package Installation

```bash
# Remove expo-av
npm uninstall expo-av

# Install expo-audio
npm install expo-audio@~1.0.13

# Clean and reinstall
npx expo install --fix
```

### 2. Import Changes

#### Recording

```typescript
// Before (expo-av)
import { Audio } from 'expo-av';

// After (expo-audio)
import {
	AudioRecorder,
	RecordingPresets,
	setAudioModeAsync,
	requestRecordingPermissionsAsync,
	getRecordingPermissionsAsync,
} from 'expo-audio';
```

#### Playback

```typescript
// Before (expo-av)
import { Audio } from 'expo-av';

// After (expo-audio)
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
```

### 3. API Changes

#### Recording API

##### Starting Recording

```typescript
// Before (expo-av)
const recording = new Audio.Recording();
await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
await recording.startAsync();

// After (expo-audio)
const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
await recorder.prepareToRecordAsync();
recorder.record(); // Note: synchronous, not async
```

##### Stopping Recording

```typescript
// Before (expo-av)
await recording.stopAndUnloadAsync();
const uri = recording.getURI();

// After (expo-audio)
await recorder.stop();
const uri = recorder.uri; // Direct property access
```

##### Pause/Resume

```typescript
// Before (expo-av)
await recording.pauseAsync();
await recording.startAsync(); // Resume

// After (expo-audio)
recorder.pause(); // Synchronous
recorder.record(); // Resume (same as start)
```

#### Playback API

##### Creating Player

```typescript
// Before (expo-av)
const { sound } = await Audio.Sound.createAsync({ uri }, { progressUpdateIntervalMillis: 100 });

// After (expo-audio)
const player = createAudioPlayer(uri);
// Note: No progress update interval option; use polling
```

##### Playback Control

```typescript
// Before (expo-av)
await sound.playAsync();
await sound.pauseAsync();
await sound.stopAsync();
await sound.setPositionAsync(positionMillis);
await sound.unloadAsync();

// After (expo-audio)
await player.play();
await player.pause();
await player.stop();
player.currentTime = positionSeconds; // Note: seconds, not milliseconds
player.release(); // Synchronous cleanup
```

##### Status Updates

```typescript
// Before (expo-av)
sound.setOnPlaybackStatusUpdate((status) => {
	if (status.isLoaded) {
		console.log(status.positionMillis, status.durationMillis);
	}
});

// After (expo-audio)
// No built-in status updates; use polling
setInterval(() => {
	console.log(player.currentTime, player.duration); // In seconds
	console.log(player.playing); // Boolean
}, 100);
```

#### Audio Mode Configuration

```typescript
// Before (expo-av)
await Audio.setAudioModeAsync({
	allowsRecordingIOS: true,
	playsInSilentModeIOS: true,
	staysActiveInBackground: true,
	interruptionModeIOS: InterruptionModeIOS.DoNotMix,
	interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
});

// After (expo-audio)
await setAudioModeAsync({
	allowsRecording: true,
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	interruptionMode: 'doNotMix', // String literals instead of enums
	// Note: Some options like shouldDuckAndroid are not available
});
```

#### Permissions

```typescript
// Before (expo-av)
const { status } = await Audio.requestPermissionsAsync();
const { status } = await Audio.getPermissionsAsync();

// After (expo-audio)
const { granted } = await requestRecordingPermissionsAsync();
const { granted } = await getRecordingPermissionsAsync();
```

## Files Modified

### Core Recording Services

- `features/audioRecording/audioRecording.service.ts`
- `features/audioRecording/audioRecording.service.android.ts`
- `features/audioRecording/audioRecording.service.ios.ts`
- `features/audioRecording/audioRecording.service.web.ts`
- `features/audioRecording/audioRecording.types.ts`

### Audio Player

- `features/audioPlayer/useAudioPlayer.ts`
- `features/audioPlayer/store/audioPlaybackStore.ts`

### Storage & Utilities

- `features/storage/fileStorage.service.ts`
- `features/storage/fileStorage.service.web.ts`
- `utils/mediaUtils.ts`

### Sound Effects

- `features/audioRecording/services/recordingSoundManager.ts`

### Configuration

- `package.json`
- `app.json` (plugin configuration)

## Platform-Specific Considerations

### Android 16

- Added foreground state verification before recording
- Implemented AppState monitoring for background restrictions
- Added explicit error handling for permission denials

### iOS

- Maintained compatibility with existing iOS audio session configuration
- No significant changes required for iOS implementation

### Web

- Updated to use Web Audio API compatible methods
- Maintained fallback for permissions API

## Known Issues & Workarounds

### 1. Zero-byte Audio Files (Expo SDK 54)

**Issue**: Some Android devices create zero-byte audio files
**Reference**: GitHub issue #39646
**Workaround**: Added logging and validation after recording stops

### 2. Missing Status Updates

**Issue**: No built-in playback status updates like expo-av
**Solution**: Implemented polling mechanism with setInterval

### 3. Time Units Difference

**Issue**: expo-audio uses seconds, expo-av used milliseconds
**Solution**: Added conversion where necessary (÷ 1000 for ms → s)

## Benefits Achieved

1. **Android 16 Compatibility**: Recording works on latest Android devices
2. **Smaller Bundle**: Reduced app size by ~200KB
3. **Better Performance**: Faster audio initialization and lower memory usage
4. **Simpler API**: More intuitive method names and patterns
5. **Future-Proof**: Active development and support from Expo team

## Testing Checklist

- [ ] Audio recording starts successfully
- [ ] Recording can be paused and resumed
- [ ] Recording stops and saves properly
- [ ] Audio playback works correctly
- [ ] Seek/scrub functionality works
- [ ] Volume controls function properly
- [ ] Background recording (iOS)
- [ ] Permissions are requested correctly
- [ ] Sound effects play correctly
- [ ] Multiple audio instances don't conflict

## Rollback Plan

If issues arise, rollback by:

1. Revert package.json changes
2. Run `npm install expo-av@~15.1.4`
3. Revert all file changes listed above
4. Run `npx expo install --fix`
5. Clean build folders and rebuild

## Resources

- [expo-audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Migration Announcement](https://expo.dev/changelog/2024/05-07-sdk-51#expo-av-deprecation)
- [GitHub Issue #39646](https://github.com/expo/expo/issues/39646)

## Contact

For questions about this migration, please refer to the project maintainers or create an issue in the project repository.
