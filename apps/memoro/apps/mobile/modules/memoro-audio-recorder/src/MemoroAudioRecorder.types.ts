/**
 * MemoroAudioRecorder Type Definitions
 *
 * Native iOS audio recorder with robust interruption handling
 */

// ============= Recording Options =============

export interface RecordingOptions {
	/** Sample rate in Hz (default: 44100) */
	sampleRate?: number;
	/** Bit rate in bps (default: 64000 for voice) */
	bitRate?: number;
	/** Number of channels (default: 1 for MONO - prevents iOS spatial audio issues) */
	channels?: number;
}

// ============= Status Types =============

export interface RecordingStatus {
	/** Whether actively recording */
	isRecording: boolean;
	/** Whether recording is paused */
	isPaused: boolean;
	/** Current duration in seconds */
	duration: number;
	/** Current duration in milliseconds */
	durationMillis: number;
	/** Audio level metering in dB (typically -160 to 0) */
	metering: number;
	/** Peak audio level metering in dB */
	peakMetering?: number;
	/** File URI of the recording */
	uri: string | null;
	/** Whether the device can record (permissions granted) */
	canRecord: boolean;
	/** Whether recording was interrupted by system */
	wasInterrupted?: boolean;
}

export interface RecordingInfo {
	/** File URI */
	uri: string;
	/** Filename */
	filename: string;
	/** Whether currently recording */
	isRecording: boolean;
	/** Whether recording is paused */
	isPaused: boolean;
	/** Whether recording was interrupted */
	wasInterrupted: boolean;
	/** Start timestamp in milliseconds */
	startTime?: number;
	/** Elapsed time in milliseconds */
	elapsedTime?: number;
	/** Duration in seconds (from recorder if available) */
	duration?: number;
	/** Duration in milliseconds */
	durationMillis?: number;
	/** File size in bytes */
	fileSize?: number;
}

export interface FileInfo {
	/** File URI */
	uri: string;
	/** Filename */
	filename: string;
	/** File size in bytes */
	size?: number;
	/** Duration in seconds */
	duration?: number;
	/** Duration in milliseconds */
	durationMillis?: number;
	/** Creation timestamp in milliseconds */
	createdAt?: number;
}

// ============= Permission Types =============

export interface PermissionStatus {
	/** Whether permission is granted */
	granted: boolean;
	/** Whether we can ask for permission again */
	canAskAgain: boolean;
	/** Permission status string */
	status: 'granted' | 'denied' | 'undetermined' | 'unknown';
}

// ============= Event Types =============

export interface StatusUpdateEvent {
	/** Whether actively recording */
	isRecording: boolean;
	/** Whether recording is paused */
	isPaused: boolean;
	/** Current duration in seconds */
	duration: number;
	/** Current duration in milliseconds */
	durationMillis: number;
	/** Audio level metering in dB */
	metering: number;
	/** Peak audio level metering in dB */
	peakMetering?: number;
	/** File URI */
	uri: string;
	/** Whether device can record */
	canRecord: boolean;
	/** Whether recording was interrupted */
	wasInterrupted?: boolean;
}

export interface InterruptionEvent {
	/** Interruption type ('began') */
	type: 'began';
	/** Reason for interruption */
	reason: 'system_interruption' | 'phone_call' | 'other';
	/** Duration at interruption in seconds */
	duration: number;
	/** Duration at interruption in milliseconds */
	durationMillis: number;
	/** File URI */
	uri: string;
	/** Timestamp when interruption occurred */
	timestamp: number;
	/** Full status at interruption time */
	status: RecordingStatus;
	/**
	 * Whether the recording was stopped (not just paused) to preserve data.
	 * This is done for VoIP calls (WhatsApp, FaceTime) where the recorder
	 * may be invalidated and pausing is not sufficient.
	 */
	wasStoppedToPreserve?: boolean;
	/**
	 * Complete file info for the saved recording (only present if wasStoppedToPreserve is true)
	 */
	fileInfo?: FileInfo;
}

export interface InterruptionEndedEvent {
	/** Interruption type ('ended') */
	type: 'ended';
	/** Whether system recommends resuming (always false now since we stop instead of pause) */
	shouldResume: boolean;
	/** Whether recording was interrupted */
	wasInterrupted: boolean;
	/** Whether recording was automatically resumed (always false now) */
	didAutoResume: boolean;
	/** How long the interruption lasted in seconds */
	interruptionDuration: number;
	/** How long the interruption lasted in milliseconds */
	interruptionDurationMillis: number;
	/** Timestamp when interruption ended */
	timestamp: number;
	/** Current status after interruption */
	status: RecordingStatus;
	/**
	 * Whether the recording file was saved during interruption.
	 * When true, the recording can be recovered using savedRecordingUri.
	 */
	recordingWasSaved?: boolean;
	/**
	 * URI of the saved recording file (present if recordingWasSaved is true)
	 */
	savedRecordingUri?: string;
	/**
	 * File info of the saved recording (present if recordingWasSaved is true)
	 */
	savedFileInfo?: FileInfo;
}

export interface RecordingFinishedEvent {
	/** Whether recording finished successfully */
	success?: boolean;
	/** File URI */
	uri: string;
	/** Duration in seconds */
	duration?: number;
	/** Duration in milliseconds */
	durationMillis?: number;
	/** Whether recording was interrupted before finishing */
	wasInterrupted: boolean;
	/** File size in bytes */
	fileSize?: number;
	/** Complete file info */
	fileInfo?: FileInfo;
}

export interface ErrorEvent {
	/** Error code */
	code: string;
	/** Error message */
	message: string;
	/** Whether error is recoverable */
	recoverable: boolean;
	/** File URI if available */
	uri?: string;
	/** Recovery info for media services reset */
	recoveryInfo?: RecordingInfo | null;
}

// ============= Initialization Result =============

export interface InitializeResult {
	/** Whether initialization succeeded */
	success: boolean;
	/** Audio session category */
	category?: string;
	/** Audio session mode */
	mode?: string;
	/** Sample rate */
	sampleRate?: number;
	/** Whether microphone input is available */
	inputAvailable?: boolean;
}

// ============= Start Recording Result =============

export interface StartRecordingResult {
	/** Whether recording started successfully */
	success: boolean;
	/** File URI */
	uri: string;
	/** Filename */
	filename: string;
	/** Start timestamp in milliseconds */
	startTime: number;
}

// ============= Module Interface =============

export interface MemoroAudioRecorderModule {
	/**
	 * Initialize the audio session for recording.
	 * Must be called before starting recording.
	 */
	initialize(): Promise<InitializeResult>;

	/**
	 * Start recording to a new file.
	 * @param options Optional recording configuration
	 */
	startRecording(options?: RecordingOptions): Promise<StartRecordingResult>;

	/**
	 * Stop recording and get the file info.
	 * Audio data is preserved even if called after interruption.
	 */
	stopRecording(): Promise<FileInfo>;

	/**
	 * Pause the current recording.
	 * @returns Whether pause was successful
	 */
	pauseRecording(): boolean;

	/**
	 * Resume a paused recording.
	 * @returns Whether resume was successful
	 */
	resumeRecording(): boolean;

	/**
	 * Get the current recording status.
	 * Includes duration, metering, and state info.
	 */
	getStatus(): RecordingStatus;

	/**
	 * Request microphone permission from the user.
	 */
	requestPermissions(): Promise<PermissionStatus>;

	/**
	 * Check current microphone permission status.
	 */
	checkPermissions(): Promise<PermissionStatus>;

	/**
	 * Cleanup resources and stop any active recording.
	 * @returns Whether cleanup was successful
	 */
	cleanup(): boolean;

	/**
	 * Get current recording info for recovery purposes.
	 * Returns null if no recording is active.
	 */
	getCurrentRecordingInfo(): RecordingInfo | null;

	/**
	 * Cancel and delete the current recording.
	 * @returns Whether cancellation was successful
	 */
	cancelRecording(): boolean;

	// Event subscription methods (provided by Expo modules)
	addListener(
		eventName: 'onStatusUpdate',
		listener: (event: StatusUpdateEvent) => void
	): { remove: () => void };
	addListener(
		eventName: 'onInterruption',
		listener: (event: InterruptionEvent) => void
	): { remove: () => void };
	addListener(
		eventName: 'onInterruptionEnded',
		listener: (event: InterruptionEndedEvent) => void
	): { remove: () => void };
	addListener(
		eventName: 'onRecordingFinished',
		listener: (event: RecordingFinishedEvent) => void
	): { remove: () => void };
	addListener(eventName: 'onError', listener: (event: ErrorEvent) => void): { remove: () => void };
}

// ============= Event Names =============

export type MemoroAudioRecorderEventName =
	| 'onStatusUpdate'
	| 'onInterruption'
	| 'onInterruptionEnded'
	| 'onRecordingFinished'
	| 'onError';
