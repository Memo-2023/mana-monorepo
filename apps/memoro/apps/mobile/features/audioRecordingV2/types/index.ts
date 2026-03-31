/**
 * AudioRecordingV2 Type Definitions
 * Complete TypeScript interfaces and types for the recording system
 */

// Import types from persistence service
import type { OrphanedRecording } from '../services/recordingPersistence';

// Re-export for convenience
export type { OrphanedRecording };

// ============= Core Types =============

export interface RecordingState {
	status: RecordingStatus;
	session: RecordingSession | null;
	error: RecordingError | null;
	permissions: PermissionState;
	isInitialized: boolean;
}

export enum RecordingStatus {
	IDLE = 'idle',
	PREPARING = 'preparing',
	RECORDING = 'recording',
	PAUSED = 'paused',
	STOPPING = 'stopping',
	STOPPED = 'stopped',
	ERROR = 'error',
}

export interface RecordingSession {
	id: string;
	startTime: number;
	endTime?: number;
	duration: number;
	uri?: string | null;
	size?: number;
	format?: AudioFormat;
}

export interface PermissionState {
	microphone: PermissionStatus;
	notifications?: PermissionStatus; // Android only
	canAskAgain: boolean;
	lastChecked: number;
}

export interface PermissionStatus {
	granted: boolean;
	canAskAgain?: boolean;
}

// ============= Audio Configuration =============

export interface AudioFormat {
	encoding: AudioEncoding;
	sampleRate: number;
	bitRate: number;
	channels: number;
	extension: string;
}

export enum AudioEncoding {
	AAC = 'aac',
	AMR_NB = 'amr_nb',
	AMR_WB = 'amr_wb',
	HE_AAC = 'he_aac',
	AAC_ELD = 'aac_eld',
}

export interface RecordingOptions {
	preset?: RecordingPreset;
	format?: Partial<AudioFormat>;
	maxDuration?: number; // in seconds
	sizeLimit?: number; // in bytes
	preferredInputUid?: string; // UID of preferred recording input (microphone)
}

/**
 * Represents an available audio input device for recording.
 * Re-exported from expo-audio for convenience.
 */
export type RecordingInput = {
	name: string;
	type: string;
	uid: string;
};

export enum RecordingPreset {
	HIGH_QUALITY = 'high_quality',
	MEDIUM_QUALITY = 'medium_quality',
	LOW_QUALITY = 'low_quality',
	VOICE_MEMO = 'voice_memo',
}

// ============= Error Types =============

export enum RecordingErrorType {
	PERMISSION_DENIED = 'permission_denied',
	HARDWARE_UNAVAILABLE = 'hardware_unavailable',
	PLATFORM_RESTRICTION = 'platform_restriction',
	STORAGE_ERROR = 'storage_error',
	NETWORK_ERROR = 'network_error',
	AUDIO_ENGINE_ERROR = 'audio_engine_error',
	INITIALIZATION_ERROR = 'initialization_error',
	INSUFFICIENT_CREDITS = 'insufficient_credits',
	RECORDING_INTERRUPTED = 'recording_interrupted',
	UNKNOWN_ERROR = 'unknown_error',
}

// ============= Interruption Types =============

/**
 * Reasons why a recording was interrupted
 */
export enum RecordingInterruptionReason {
	/** Phone call (incoming or outgoing) interrupted recording */
	PHONE_CALL = 'phone_call',
	/** System audio interruption (Siri, notifications, etc.) */
	SYSTEM_INTERRUPTION = 'system_interruption',
	/** Recording stopped unexpectedly (isRecording became false) */
	UNEXPECTED_STOP = 'unexpected_stop',
	/** getStatus() threw an error (recorder instance invalid) */
	STATUS_FAILURE = 'status_failure',
	/** Duration stopped advancing for 3+ polls */
	STUCK_DURATION = 'stuck_duration',
	/** App was terminated/killed during recording */
	APP_TERMINATED = 'app_terminated',
}

/**
 * Metadata about an interruption event
 */
export interface InterruptionMetadata {
	reason: RecordingInterruptionReason;
	detectedAt: number;
	lastKnownDurationMs: number;
	uri: string | null;
	error?: string;
	/**
	 * Whether the recording was stopped (not just paused) to preserve data.
	 * This happens during VoIP calls (WhatsApp, FaceTime) to ensure audio is saved.
	 */
	wasStoppedToPreserve?: boolean;
	/**
	 * Complete file info for the saved recording (if wasStoppedToPreserve is true)
	 */
	fileInfo?: {
		uri: string;
		filename: string;
		size?: number;
		duration?: number;
		durationMillis?: number;
	};
}

/**
 * Callback for interruption events
 */
export type InterruptionCallback = (
	reason: RecordingInterruptionReason,
	metadata: InterruptionMetadata
) => void;

export interface RecordingError {
	type: RecordingErrorType;
	code: string;
	message: string;
	details?: any;
	timestamp: number;
	recoverable: boolean;
	retryStrategy?: RetryStrategy;
	platformSpecific?: PlatformErrorDetails;
}

export interface RetryStrategy {
	maxAttempts: number;
	delayMs: number;
	backoffMultiplier?: number;
	shouldRetry: (attempt: number, error: RecordingError) => boolean;
}

export interface PlatformErrorDetails {
	platform: 'android' | 'ios' | 'web';
	osVersion?: string;
	deviceModel?: string;
	additionalInfo?: Record<string, any>;
}

// ============= Platform-Specific Types =============

export interface AndroidSpecificConfig {
	foregroundServiceEnabled: boolean;
	notificationTitle?: string;
	notificationBody?: string;
	notificationChannelId?: string;
	wakeLockEnabled: boolean;
}

export interface IOSSpecificConfig {
	audioSessionCategory?: string;
	audioSessionMode?: string;
	allowBluetooth: boolean;
	mixWithOthers: boolean;
	defaultToSpeaker: boolean;
}

export interface WebSpecificConfig {
	mimeType?: string;
	audioBitsPerSecond?: number;
	videoBitsPerSecond?: number;
}

// ============= Service Interfaces =============

export interface IAudioEngineService {
	initialize(): Promise<void>;
	startRecording(options?: RecordingOptions): Promise<void>;
	stopRecording(): Promise<string>; // Returns URI
	pauseRecording(): void;
	resumeRecording(): void;
	getStatus(): RecorderState;
	cleanup(): void;
	isInitialized(): boolean;

	// Recording input (microphone) selection
	getAvailableInputs(): RecordingInput[];
	queryAvailableInputs(): Promise<RecordingInput[]>;
	getCurrentInput(): Promise<RecordingInput | null>;
	setInput(uid: string): void;

	// Recording recovery support
	getCurrentRecordingInfo(): {
		uri: string | null;
		durationMs: number;
		startTime: number | null;
		sessionId: string | null;
	};
	registerInterruptionCallback(callback: InterruptionCallback): void;
}

export interface IPlatformRecordingService extends IAudioEngineService {
	requestPermissions(): Promise<PermissionState>;
	checkPermissions(): Promise<PermissionState>;
	setupPlatformSpecific(): Promise<void>;
	handleAppStateChange(state: AppStateStatus): void;
}

// ============= Internal Types (from expo-audio) =============

export interface RecorderState {
	canRecord: boolean;
	isRecording: boolean;
	isPaused?: boolean;
	currentTime: number; // in seconds
	uri?: string | null;
	metering?: number;
	durationMillis: number;
	mediaServicesDidReset?: boolean;
}

export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';

// ============= Store Types =============

export interface RecordingStoreState extends RecordingState {
	// Convenience properties for backward compatibility
	isRecording: boolean;
	isPaused: boolean;
	isUploading: boolean;
	uploadProgress: number;
	duration: number;
	uri: string | null;
	savedFile: AudioFile | null;
	metering: number | undefined;

	// Metadata for recordings
	title?: string;
	spaceId: string | null;
	blueprintId: string | null;
	memoId: string | null;
	memo: any | null; // Added for backward compatibility

	// Recording input (microphone) selection
	availableInputs: RecordingInput[];
	currentInput: RecordingInput | null;

	// Recovery state for interrupted recordings
	orphanedRecording: OrphanedRecording | null;
	showRecoveryPrompt: boolean;
	isRecoveringRecording: boolean;

	// Computed properties for backward compatibility
	permissionDeniedError: boolean;
	canAskAgainForPermission: boolean;
	insufficientCreditsError: boolean;

	// Actions
	initialize: () => Promise<void>;
	reinitialize: () => Promise<void>;
	startRecording: (options?: RecordingOptions) => Promise<void>;
	stopRecording: (memoId?: string) => Promise<void>;
	pauseRecording: () => void;
	resumeRecording: () => void;
	requestPermissions: () => Promise<PermissionState>;
	checkPermissions: () => Promise<PermissionState>;
	reset: () => void;
	resetRecording: () => void;
	setError: (error: RecordingError | null) => void;
	setRecordingInfo: (info: {
		title?: string;
		spaceId?: string | null;
		blueprintId?: string | null;
		memoId?: string | null;
	}) => void;
	clearPermissionDeniedError: () => void;
	clearInsufficientCreditsError: () => void;

	// Recording input actions
	refreshAvailableInputs: () => Promise<void>;
	setRecordingInput: (uid: string) => void;

	// Recovery actions
	checkForOrphanedRecording: () => Promise<void>;
	recoverOrphanedRecording: () => Promise<void>;
	discardOrphanedRecording: () => Promise<void>;
	dismissRecoveryPrompt: () => void;
}

export interface TimerState {
	duration: number; // in milliseconds
	isActive: boolean;
	startTime: number | null;
	pausedTime: number;
	// Actions
	start: () => void;
	stop: () => void;
	pause: () => void;
	resume: () => void;
	reset: () => void;
	getDuration: () => number;
}

// ============= Callback Types =============

export type StatusUpdateCallback = (status: RecorderState) => void;
export type ErrorCallback = (error: RecordingError) => void;
export type StateChangeCallback = (state: Partial<RecordingState>) => void;

// ============= Utility Types =============

export interface AudioFile {
	uri: string;
	size: number;
	duration: number;
	format: AudioFormat;
	createdAt: number;
	metadata?: Record<string, any>;
}

export interface UploadProgress {
	bytesUploaded: number;
	totalBytes: number;
	percentage: number;
	timeRemaining?: number;
}

export interface RecordingMetrics {
	averageLevel: number;
	peakLevel: number;
	noiseLevel: number;
	silencePercentage: number;
}

// ============= Factory Types =============

export type PlatformType = 'android' | 'ios' | 'web';

export interface PlatformConfig {
	android?: AndroidSpecificConfig;
	ios?: IOSSpecificConfig;
	web?: WebSpecificConfig;
}

// ============= Export helper for better imports =============

export type {
	RecordingState as RS,
	RecordingSession as Session,
	RecordingError as RError,
	PermissionState as Permissions,
};
