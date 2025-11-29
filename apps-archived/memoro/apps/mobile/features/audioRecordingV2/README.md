# AudioRecordingV2

A modern, production-ready audio recording solution for React Native using Expo SDK 54.

## Features

✅ **Correct Expo SDK 54 API Usage**

- Uses `AudioModule.AudioRecorder` from internal API
- Proper synchronous/asynchronous method handling
- Status polling for real-time updates

✅ **Platform-Specific Optimizations**

- Android: Foreground service, wake locks, Android 16 support
- iOS: Audio session management, background recording
- Web: Fallback support (basic implementation)

✅ **Robust Error Handling**

- Comprehensive error classification
- Automatic retry strategies
- User-friendly error messages

✅ **State Management**

- Zustand store integration
- Separate timer management
- Real-time status updates

## Quick Start

### Basic Usage

```tsx
import { useAudioRecordingV2 } from '@/features/audioRecordingV2';

function RecordingComponent() {
	const recording = useAudioRecordingV2();

	const handleRecord = async () => {
		if (!recording.permissions.microphone.granted) {
			await recording.requestPermissions();
		}

		if (recording.status === 'idle') {
			await recording.startRecording();
		} else if (recording.status === 'recording') {
			await recording.stopRecording();
		}
	};

	return (
		<View>
			<Text>Status: {recording.status}</Text>
			<Text>Duration: {recording.session?.duration || 0}s</Text>
			<Button title={recording.status === 'recording' ? 'Stop' : 'Record'} onPress={handleRecord} />
		</View>
	);
}
```

### Advanced Usage with Error Handling

```tsx
import {
	useAudioRecordingV2,
	handleRecordingError,
	RecordingPreset,
} from '@/features/audioRecordingV2';

function AdvancedRecording() {
	const recording = useAudioRecordingV2();

	const startRecording = async () => {
		try {
			await recording.startRecording({
				preset: RecordingPreset.HIGH_QUALITY,
				maxDuration: 300, // 5 minutes
			});
		} catch (error) {
			handleRecordingError(error, {
				showAlert: true,
				onRetry: startRecording,
			});
		}
	};

	// Rest of component...
}
```

### Direct Service Usage (Without Store)

```tsx
import { createPlatformRecordingService } from '@/features/audioRecordingV2';

// Create service instance
const recordingService = createPlatformRecordingService();

// Initialize
await recordingService.initialize();

// Start recording
await recordingService.startRecording();

// Stop and get URI
const uri = await recordingService.stopRecording();

// Cleanup when done
recordingService.cleanup();
```

## API Reference

### Store State

```typescript
interface RecordingStoreState {
	// State
	status: RecordingStatus;
	session: RecordingSession | null;
	error: RecordingError | null;
	permissions: PermissionState;
	isInitialized: boolean;

	// Actions
	initialize(): Promise<void>;
	startRecording(options?: RecordingOptions): Promise<void>;
	stopRecording(): Promise<void>;
	pauseRecording(): void;
	resumeRecording(): void;
	requestPermissions(): Promise<PermissionState>;
	checkPermissions(): Promise<PermissionState>;
	reset(): void;
	setError(error: RecordingError | null): void;
}
```

### Recording Options

```typescript
interface RecordingOptions {
	preset?: RecordingPreset;
	format?: Partial<AudioFormat>;
	maxDuration?: number; // seconds
	sizeLimit?: number; // bytes
}

enum RecordingPreset {
	HIGH_QUALITY = 'high_quality',
	MEDIUM_QUALITY = 'medium_quality',
	LOW_QUALITY = 'low_quality',
	VOICE_MEMO = 'voice_memo',
}
```

### Recording Status

```typescript
enum RecordingStatus {
	IDLE = 'idle',
	PREPARING = 'preparing',
	RECORDING = 'recording',
	PAUSED = 'paused',
	STOPPING = 'stopping',
	STOPPED = 'stopped',
	ERROR = 'error',
}
```

## Platform-Specific Notes

### Android

- Requires foreground service for background recording
- Android 16+ requires app to be in foreground to start recording
- Wake lock prevents device sleep during recording
- Notification shown during recording

### iOS

- Background audio capability required in Info.plist (`UIBackgroundModes: ["audio"]`)
- Audio session configured with `mixWithOthers` mode for background recording
- Recording continues when app is backgrounded or user switches apps
- Handles real interruptions (phone calls, Siri) automatically
- Audio session verification on cold start prevents first-recording failures

### Web

- Basic support using Web Audio API
- Limited functionality compared to mobile

## Error Handling

The system includes comprehensive error handling:

```typescript
enum RecordingErrorType {
	PERMISSION_DENIED,
	HARDWARE_UNAVAILABLE,
	PLATFORM_RESTRICTION,
	STORAGE_ERROR,
	NETWORK_ERROR,
	AUDIO_ENGINE_ERROR,
	INITIALIZATION_ERROR,
	UNKNOWN_ERROR,
}
```

Each error includes:

- Type classification
- Error code
- User-friendly message
- Recoverable flag
- Retry strategy (if applicable)
- Platform-specific details

## Troubleshooting

### Android: Microphone not working

1. Check permissions in app settings
2. Ensure app is in foreground (Android 16+)
3. Check if another app is using microphone
4. Restart the app

### iOS: Recording stops in background

**Fixed in latest version!** Background recording now works correctly.

**Root Cause:** Two bugs prevented background recording:

1. `interruptionMode: 'doNotMix'` - iOS revoked exclusive audio access when backgrounded
2. App state handler manually paused recording on `inactive` state transition

**Solution:**

1. Changed to `interruptionMode: 'mixWithOthers'` - allows background recording
2. Removed manual pause logic - let iOS handle audio naturally

**Verification:**

- Recording continues when pressing home button
- Recording continues when switching to other apps
- Recording continues when device is locked
- Full duration captured (foreground + background time)

See `TROUBLESHOOTING.md` for detailed technical explanation.

### Zero-byte recordings

This is a known issue with Expo SDK 54 on some Android devices. The implementation includes:

- File validation after recording
- Automatic retry mechanism
- Error reporting for debugging

## Migration from V1

If migrating from the old recording system:

```typescript
// Old
import audioRecordingService from '@/features/audioRecording/audioRecording.service';
await audioRecordingService.startRecording();

// New
import { useAudioRecordingV2 } from '@/features/audioRecordingV2';
const recording = useAudioRecordingV2();
await recording.startRecording();
```

## Development

### Testing

```bash
# Run tests
npm test features/audioRecordingV2

# Test on Android
npx expo run:android

# Test on iOS
npx expo run:ios
```

### Debugging

Enable debug logs:

```typescript
// In AudioEngineService.ts
console.log('Debug:', status);
```

## Contributing

When making changes:

1. Test on both Android and iOS
2. Verify Android 16 compatibility
3. Check memory leaks with profiler
4. Update types if API changes

## License

Internal use only
