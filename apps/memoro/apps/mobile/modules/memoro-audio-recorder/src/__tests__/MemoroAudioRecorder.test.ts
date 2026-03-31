/**
 * MemoroAudioRecorder Type Tests
 *
 * Tests that type definitions are correctly structured and exported.
 * Note: Native module functions cannot be tested in Jest since they
 * require the native iOS runtime. These tests verify TypeScript types.
 */

import type {
	RecordingOptions,
	RecordingStatus,
	RecordingInfo,
	FileInfo,
	PermissionStatus,
	InitializeResult,
	StartRecordingResult,
	StatusUpdateEvent,
	InterruptionEvent,
	InterruptionEndedEvent,
	RecordingFinishedEvent,
	ErrorEvent,
	MemoroAudioRecorderEventName,
	MemoroAudioRecorderModule,
} from '../MemoroAudioRecorder.types';

describe('MemoroAudioRecorder Types', () => {
	describe('RecordingOptions', () => {
		it('should allow empty options (all fields optional)', () => {
			const options: RecordingOptions = {};
			expect(options).toEqual({});
		});

		it('should allow partial options', () => {
			const options: RecordingOptions = {
				sampleRate: 44100,
			};
			expect(options.sampleRate).toBe(44100);
			expect(options.bitRate).toBeUndefined();
			expect(options.channels).toBeUndefined();
		});

		it('should allow full options', () => {
			const options: RecordingOptions = {
				sampleRate: 44100,
				bitRate: 64000,
				channels: 1,
			};
			expect(options.sampleRate).toBe(44100);
			expect(options.bitRate).toBe(64000);
			expect(options.channels).toBe(1);
		});
	});

	describe('RecordingStatus', () => {
		it('should have all required fields', () => {
			const status: RecordingStatus = {
				isRecording: false,
				isPaused: false,
				duration: 0,
				durationMillis: 0,
				metering: -160,
				uri: null,
				canRecord: true,
			};

			expect(status.isRecording).toBe(false);
			expect(status.isPaused).toBe(false);
			expect(status.duration).toBe(0);
			expect(status.durationMillis).toBe(0);
			expect(status.metering).toBe(-160);
			expect(status.uri).toBeNull();
			expect(status.canRecord).toBe(true);
		});

		it('should allow optional fields', () => {
			const status: RecordingStatus = {
				isRecording: true,
				isPaused: false,
				duration: 5.5,
				durationMillis: 5500,
				metering: -25.5,
				peakMetering: -20.0,
				uri: 'file:///path/to/recording.m4a',
				canRecord: true,
				wasInterrupted: true,
			};

			expect(status.peakMetering).toBe(-20.0);
			expect(status.wasInterrupted).toBe(true);
		});
	});

	describe('RecordingInfo', () => {
		it('should have all required fields', () => {
			const info: RecordingInfo = {
				uri: 'file:///path/to/recording.m4a',
				filename: 'recording.m4a',
				isRecording: true,
				isPaused: false,
				wasInterrupted: false,
			};

			expect(info.uri).toBe('file:///path/to/recording.m4a');
			expect(info.filename).toBe('recording.m4a');
			expect(info.isRecording).toBe(true);
			expect(info.isPaused).toBe(false);
			expect(info.wasInterrupted).toBe(false);
		});

		it('should allow optional timing fields', () => {
			const info: RecordingInfo = {
				uri: 'file:///path/to/recording.m4a',
				filename: 'recording.m4a',
				isRecording: true,
				isPaused: false,
				wasInterrupted: false,
				startTime: 1702500000000,
				elapsedTime: 5000,
				duration: 5.0,
				durationMillis: 5000,
				fileSize: 80000,
			};

			expect(info.startTime).toBe(1702500000000);
			expect(info.fileSize).toBe(80000);
		});
	});

	describe('FileInfo', () => {
		it('should have required fields', () => {
			const info: FileInfo = {
				uri: 'file:///path/to/recording.m4a',
				filename: 'recording.m4a',
			};

			expect(info.uri).toBeDefined();
			expect(info.filename).toBeDefined();
		});

		it('should allow optional metadata', () => {
			const info: FileInfo = {
				uri: 'file:///path/to/recording.m4a',
				filename: 'recording.m4a',
				size: 128000,
				duration: 10.5,
				durationMillis: 10500,
				createdAt: 1702500000000,
			};

			expect(info.size).toBe(128000);
			expect(info.duration).toBe(10.5);
			expect(info.createdAt).toBe(1702500000000);
		});
	});

	describe('PermissionStatus', () => {
		it('should represent granted permission', () => {
			const status: PermissionStatus = {
				granted: true,
				canAskAgain: true,
				status: 'granted',
			};

			expect(status.granted).toBe(true);
			expect(status.status).toBe('granted');
		});

		it('should represent denied permission', () => {
			const status: PermissionStatus = {
				granted: false,
				canAskAgain: false,
				status: 'denied',
			};

			expect(status.granted).toBe(false);
			expect(status.status).toBe('denied');
		});

		it('should represent undetermined permission', () => {
			const status: PermissionStatus = {
				granted: false,
				canAskAgain: true,
				status: 'undetermined',
			};

			expect(status.canAskAgain).toBe(true);
			expect(status.status).toBe('undetermined');
		});
	});

	describe('InitializeResult', () => {
		it('should represent successful initialization', () => {
			const result: InitializeResult = {
				success: true,
				category: 'AVAudioSessionCategoryPlayAndRecord',
				mode: 'AVAudioSessionModeSpokenAudio',
				sampleRate: 44100,
				inputAvailable: true,
			};

			expect(result.success).toBe(true);
			expect(result.inputAvailable).toBe(true);
		});

		it('should represent failed initialization', () => {
			const result: InitializeResult = {
				success: false,
			};

			expect(result.success).toBe(false);
			expect(result.category).toBeUndefined();
		});
	});

	describe('StartRecordingResult', () => {
		it('should have all fields', () => {
			const result: StartRecordingResult = {
				success: true,
				uri: 'file:///path/to/memoro_recording_1702500000000.m4a',
				filename: 'memoro_recording_1702500000000.m4a',
				startTime: 1702500000000,
			};

			expect(result.success).toBe(true);
			expect(result.uri).toContain('memoro_recording_');
			expect(result.filename).toContain('.m4a');
			expect(result.startTime).toBeGreaterThan(0);
		});
	});

	describe('Event Types', () => {
		describe('StatusUpdateEvent', () => {
			it('should have all status fields', () => {
				const event: StatusUpdateEvent = {
					isRecording: true,
					isPaused: false,
					duration: 5.5,
					durationMillis: 5500,
					metering: -25.0,
					uri: 'file:///path/to/recording.m4a',
					canRecord: true,
				};

				expect(event.isRecording).toBe(true);
				expect(event.duration).toBe(5.5);
				expect(event.metering).toBe(-25.0);
			});
		});

		describe('InterruptionEvent', () => {
			it('should represent an interruption', () => {
				const event: InterruptionEvent = {
					type: 'began',
					reason: 'system_interruption',
					duration: 30.5,
					durationMillis: 30500,
					uri: 'file:///path/to/recording.m4a',
					timestamp: 1702500000000,
					status: {
						isRecording: true,
						isPaused: true,
						duration: 30.5,
						durationMillis: 30500,
						metering: -160,
						uri: 'file:///path/to/recording.m4a',
						canRecord: true,
					},
				};

				expect(event.type).toBe('began');
				expect(event.reason).toBe('system_interruption');
				expect(event.status.isPaused).toBe(true);
			});
		});

		describe('InterruptionEndedEvent', () => {
			it('should represent interruption end with auto-resume', () => {
				const event: InterruptionEndedEvent = {
					type: 'ended',
					shouldResume: true,
					wasInterrupted: true,
					didAutoResume: true,
					interruptionDuration: 15.0,
					interruptionDurationMillis: 15000,
					timestamp: 1702500015000,
					status: {
						isRecording: true,
						isPaused: false,
						duration: 45.5,
						durationMillis: 45500,
						metering: -25.0,
						uri: 'file:///path/to/recording.m4a',
						canRecord: true,
					},
				};

				expect(event.type).toBe('ended');
				expect(event.didAutoResume).toBe(true);
				expect(event.interruptionDuration).toBe(15.0);
			});
		});

		describe('RecordingFinishedEvent', () => {
			it('should represent successful completion', () => {
				const event: RecordingFinishedEvent = {
					success: true,
					uri: 'file:///path/to/recording.m4a',
					duration: 120.5,
					durationMillis: 120500,
					wasInterrupted: false,
					fileSize: 960000,
				};

				expect(event.success).toBe(true);
				expect(event.wasInterrupted).toBe(false);
				expect(event.fileSize).toBe(960000);
			});
		});

		describe('ErrorEvent', () => {
			it('should represent recoverable error', () => {
				const event: ErrorEvent = {
					code: 'media_services_reset',
					message: 'iOS media services were reset.',
					recoverable: true,
				};

				expect(event.code).toBe('media_services_reset');
				expect(event.recoverable).toBe(true);
			});

			it('should represent non-recoverable error', () => {
				const event: ErrorEvent = {
					code: 'encoding_error',
					message: 'Failed to encode audio',
					recoverable: false,
					uri: 'file:///path/to/recording.m4a',
				};

				expect(event.recoverable).toBe(false);
				expect(event.uri).toBeDefined();
			});
		});
	});

	describe('MemoroAudioRecorderEventName', () => {
		it('should include all event names', () => {
			const eventNames: MemoroAudioRecorderEventName[] = [
				'onStatusUpdate',
				'onInterruption',
				'onInterruptionEnded',
				'onRecordingFinished',
				'onError',
			];

			expect(eventNames).toContain('onStatusUpdate');
			expect(eventNames).toContain('onInterruption');
			expect(eventNames).toContain('onInterruptionEnded');
			expect(eventNames).toContain('onRecordingFinished');
			expect(eventNames).toContain('onError');
			expect(eventNames.length).toBe(5);
		});
	});

	describe('MemoroAudioRecorderModule Interface', () => {
		it('should define all required methods', () => {
			// Type-level test: ensure the interface has all expected methods
			// This won't run but validates TypeScript compilation
			const methodNames: (keyof MemoroAudioRecorderModule)[] = [
				'initialize',
				'startRecording',
				'stopRecording',
				'pauseRecording',
				'resumeRecording',
				'getStatus',
				'requestPermissions',
				'checkPermissions',
				'cleanup',
				'getCurrentRecordingInfo',
				'cancelRecording',
				'addListener',
			];

			expect(methodNames.length).toBe(12);
		});
	});
});

describe('MemoroAudioRecorder Module Export', () => {
	it('should export types', () => {
		// Verify all types are exported (compilation test)
		const typeCheck: {
			RecordingOptions: RecordingOptions;
			RecordingStatus: RecordingStatus;
			RecordingInfo: RecordingInfo;
			FileInfo: FileInfo;
			PermissionStatus: PermissionStatus;
			InitializeResult: InitializeResult;
			StartRecordingResult: StartRecordingResult;
			StatusUpdateEvent: StatusUpdateEvent;
			InterruptionEvent: InterruptionEvent;
			InterruptionEndedEvent: InterruptionEndedEvent;
			RecordingFinishedEvent: RecordingFinishedEvent;
			ErrorEvent: ErrorEvent;
		} = {
			RecordingOptions: {},
			RecordingStatus: {
				isRecording: false,
				isPaused: false,
				duration: 0,
				durationMillis: 0,
				metering: -160,
				uri: null,
				canRecord: true,
			},
			RecordingInfo: {
				uri: '',
				filename: '',
				isRecording: false,
				isPaused: false,
				wasInterrupted: false,
			},
			FileInfo: { uri: '', filename: '' },
			PermissionStatus: { granted: false, canAskAgain: false, status: 'undetermined' },
			InitializeResult: { success: false },
			StartRecordingResult: { success: false, uri: '', filename: '', startTime: 0 },
			StatusUpdateEvent: {
				isRecording: false,
				isPaused: false,
				duration: 0,
				durationMillis: 0,
				metering: -160,
				uri: '',
				canRecord: false,
			},
			InterruptionEvent: {
				type: 'began',
				reason: 'system_interruption',
				duration: 0,
				durationMillis: 0,
				uri: '',
				timestamp: 0,
				status: {
					isRecording: false,
					isPaused: false,
					duration: 0,
					durationMillis: 0,
					metering: -160,
					uri: null,
					canRecord: false,
				},
			},
			InterruptionEndedEvent: {
				type: 'ended',
				shouldResume: false,
				wasInterrupted: false,
				didAutoResume: false,
				interruptionDuration: 0,
				interruptionDurationMillis: 0,
				timestamp: 0,
				status: {
					isRecording: false,
					isPaused: false,
					duration: 0,
					durationMillis: 0,
					metering: -160,
					uri: null,
					canRecord: false,
				},
			},
			RecordingFinishedEvent: { uri: '', wasInterrupted: false },
			ErrorEvent: { code: '', message: '', recoverable: false },
		};

		expect(typeCheck).toBeDefined();
	});
});
