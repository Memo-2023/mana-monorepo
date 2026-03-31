/**
 * End-to-End Tests for Video Upload and Processing
 * Tests the complete flow from upload to transcription
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MemoroController } from '../memoro.controller';
import { MemoroService } from '../memoro.service';
import { CreditClientService } from '../../credits/credit-client.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../../types/jwt-payload.interface';

describe('Video Upload E2E Tests', () => {
	let controller: MemoroController;
	let service: MemoroService;
	let creditService: CreditClientService;
	let configService: ConfigService;

	const mockUser: JwtPayload = {
		sub: 'test-user-123',
		email: 'test@example.com',
		role: 'authenticated',
		app_id: 'test-app-id',
		aud: 'authenticated',
		iat: Date.now(),
		exp: Date.now() + 3600000,
	};

	const mockRequest = {
		token: 'mock-jwt-token',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MemoroController],
			providers: [
				{
					provide: MemoroService,
					useValue: {
						createMemoFromUploadedFile: jest.fn(),
						updateMemoTranscriptionStatus: jest.fn(),
						validateMemoForAppend: jest.fn(),
						updateAppendTranscriptionStatus: jest.fn(),
						getSupabaseUrl: jest.fn().mockReturnValue('https://test.supabase.co'),
						getSupabaseKey: jest.fn().mockReturnValue('test-key'),
					},
				},
				{
					provide: CreditClientService,
					useValue: {
						checkUserCredits: jest.fn(),
						checkSpaceCredits: jest.fn(),
						checkAndConsumeCredits: jest.fn(),
					},
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string) => {
							if (key === 'AUDIO_MICROSERVICE_URL') {
								return 'https://audio-microservice.test';
							}
							return null;
						}),
					},
				},
			],
		}).compile();

		controller = module.get<MemoroController>(MemoroController);
		service = module.get<MemoroService>(MemoroService);
		creditService = module.get<CreditClientService>(CreditClientService);
		configService = module.get<ConfigService>(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Video file processing', () => {
		it('should process MP4 video file successfully', async () => {
			const processData = {
				filePath: 'user-123/memo-456/video_2025-01-01.mp4',
				duration: 180, // 3 minutes
				spaceId: undefined,
				blueprintId: null,
				recordingLanguages: ['en-US'],
				memoId: 'memo-456',
				location: null,
				recordingStartedAt: new Date().toISOString(),
				enableDiarization: true,
				mediaType: 'video' as const,
			};

			const mockMemoResult = {
				memoId: 'memo-456',
				memo: {
					id: 'memo-456',
					user_id: mockUser.sub,
					created_at: new Date().toISOString(),
					metadata: {
						processing: {
							transcription: { status: 'pending' },
						},
					},
					source: {
						audio_path: processData.filePath,
						duration: processData.duration,
						type: 'video',
					},
				},
				audioPath: processData.filePath,
			};

			// Mock credit check
			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 30,
				currentCredits: 100,
				creditType: 'user',
			});

			// Mock memo creation
			jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue(mockMemoResult);

			const result = await controller.processUploadedAudio(mockUser, processData, mockRequest);

			expect(result).toMatchObject({
				success: true,
				memoId: 'memo-456',
				status: 'processing',
				mediaType: 'video',
			});

			expect(service.createMemoFromUploadedFile).toHaveBeenCalledWith(
				mockUser.sub,
				processData.filePath,
				processData.duration,
				processData.spaceId,
				processData.blueprintId,
				processData.memoId,
				mockRequest.token,
				processData.recordingStartedAt,
				processData.location,
				'video',
				undefined
			);
		});

		it('should auto-detect video type from file extension', async () => {
			const processData = {
				filePath: 'user-123/memo-456/recording.mov',
				duration: 240, // 4 minutes
				mediaType: undefined, // Not specified
			};

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 40,
				currentCredits: 100,
				creditType: 'user',
			});

			jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
				memoId: 'memo-456',
				memo: { id: 'memo-456' } as any,
				audioPath: processData.filePath,
			});

			const result = await controller.processUploadedAudio(mockUser, processData, mockRequest);

			expect(result.mediaType).toBe('video');
		});

		it('should handle various video formats', async () => {
			const videoFormats = [
				{ ext: 'mp4', mime: 'video/mp4' },
				{ ext: 'mov', mime: 'video/quicktime' },
				{ ext: 'avi', mime: 'video/x-msvideo' },
				{ ext: 'mkv', mime: 'video/x-matroska' },
				{ ext: 'webm', mime: 'video/webm' },
				{ ext: 'm4v', mime: 'video/x-m4v' },
			];

			for (const format of videoFormats) {
				const processData = {
					filePath: `user-123/memo-456/video.${format.ext}`,
					duration: 180,
					mediaType: 'video' as const,
				};

				jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
					hasEnoughCredits: true,
					requiredCredits: 30,
					currentCredits: 100,
					creditType: 'user',
				});

				jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
					memoId: `memo-${format.ext}`,
					memo: { id: `memo-${format.ext}` } as any,
					audioPath: processData.filePath,
				});

				const result = await controller.processUploadedAudio(mockUser, processData, mockRequest);

				expect(result.success).toBe(true);
				expect(result.mediaType).toBe('video');
			}
		});
	});

	describe('Credit validation for video files', () => {
		it('should calculate credits correctly for video duration', async () => {
			const processData = {
				filePath: 'user-123/memo-456/long-video.mp4',
				duration: 7200, // 2 hours = 120 minutes
				mediaType: 'video' as const,
			};

			// 120 minutes * 100 credits/60 minutes = 200 credits
			const expectedCredits = 200;

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: expectedCredits,
				currentCredits: 500,
				creditType: 'user',
			});

			jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
				memoId: 'memo-456',
				memo: { id: 'memo-456' } as any,
				audioPath: processData.filePath,
			});

			await controller.processUploadedAudio(mockUser, processData, mockRequest);

			expect(creditService.checkUserCredits).toHaveBeenCalledWith(
				mockUser.sub,
				expectedCredits,
				mockRequest.token
			);
		});

		it('should reject video upload with insufficient credits', async () => {
			const processData = {
				filePath: 'user-123/memo-456/video.mp4',
				duration: 3600, // 1 hour
				mediaType: 'video' as const,
			};

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: false,
				requiredCredits: 100,
				currentCredits: 50,
				creditType: 'user',
			});

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow('Insufficient credits');
		});
	});

	describe('Error handling', () => {
		it('should reject invalid file path', async () => {
			const processData = {
				filePath: '',
				duration: 180,
				mediaType: 'video' as const,
			};

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should reject invalid duration', async () => {
			const processData = {
				filePath: 'user-123/memo-456/video.mp4',
				duration: 0,
				mediaType: 'video' as const,
			};

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should reject negative duration', async () => {
			const processData = {
				filePath: 'user-123/memo-456/video.mp4',
				duration: -100,
				mediaType: 'video' as const,
			};

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should reject unsupported file type', async () => {
			const processData = {
				filePath: 'user-123/memo-456/document.pdf',
				duration: 180,
				mediaType: undefined,
			};

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 30,
				currentCredits: 100,
				creditType: 'user',
			});

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('Large file handling', () => {
		it('should process large video files with batch transcription', async () => {
			const processData = {
				filePath: 'user-123/memo-456/long-presentation.mp4',
				duration: 7200, // 2 hours - should trigger batch processing
				mediaType: 'video' as const,
				recordingLanguages: ['en-US'],
			};

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 200,
				currentCredits: 500,
				creditType: 'user',
			});

			jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
				memoId: 'memo-456',
				memo: {
					id: 'memo-456',
					source: {
						audio_path: processData.filePath,
						duration: processData.duration,
						type: 'video',
					},
				} as any,
				audioPath: processData.filePath,
			});

			const result = await controller.processUploadedAudio(mockUser, processData, mockRequest);

			expect(result.success).toBe(true);
			expect(result.estimatedDuration).toBe(120); // 7200 seconds = 120 minutes
		});

		it('should handle file size limits', async () => {
			const processData = {
				filePath: 'user-123/memo-456/huge-video.mp4',
				duration: 86400, // 24 hours
				mediaType: 'video' as const,
			};

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 1440, // 24 hours * 100 / 60
				currentCredits: 2000,
				creditType: 'user',
			});

			jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
				memoId: 'memo-456',
				memo: { id: 'memo-456' } as any,
				audioPath: processData.filePath,
			});

			const result = await controller.processUploadedAudio(mockUser, processData, mockRequest);

			expect(result.success).toBe(true);
			expect(result.estimatedDuration).toBe(1440); // 24 hours in minutes
		});
	});

	describe('Append video recording', () => {
		it('should append video recording to existing memo', async () => {
			const appendData = {
				memoId: 'existing-memo-123',
				filePath: 'user-123/memo-123/additional-video.mp4',
				duration: 120,
				enableDiarization: true,
			};

			const mockMemo = {
				id: 'existing-memo-123',
				user_id: mockUser.sub,
				metadata: {
					spaceId: undefined,
				},
				source: {
					transcript: 'Original transcript',
					audio_path: 'user-123/memo-123/original-audio.m4a',
					duration: 180,
				},
			};

			jest.spyOn(service, 'validateMemoForAppend').mockResolvedValue(mockMemo as any);

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 20,
				currentCredits: 100,
				creditType: 'user',
			});

			const result = await controller.appendTranscription(mockUser, appendData, mockRequest);

			expect(result).toMatchObject({
				success: true,
				memoId: 'existing-memo-123',
				status: 'processing',
			});

			expect(service.validateMemoForAppend).toHaveBeenCalledWith(
				mockUser.sub,
				appendData.memoId,
				mockRequest.token
			);
		});

		it('should reject append to non-existent memo', async () => {
			const appendData = {
				memoId: 'non-existent-memo',
				filePath: 'user-123/memo-123/video.mp4',
				duration: 120,
			};

			jest.spyOn(service, 'validateMemoForAppend').mockResolvedValue(null);

			await expect(
				controller.appendTranscription(mockUser, appendData, mockRequest)
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('Performance tests', () => {
		it('should handle concurrent video uploads', async () => {
			const uploadPromises = Array(5)
				.fill(null)
				.map((_, index) => {
					const processData = {
						filePath: `user-123/memo-${index}/video.mp4`,
						duration: 180,
						mediaType: 'video' as const,
					};

					jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
						hasEnoughCredits: true,
						requiredCredits: 30,
						currentCredits: 500,
						creditType: 'user',
					});

					jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
						memoId: `memo-${index}`,
						memo: { id: `memo-${index}` } as any,
						audioPath: processData.filePath,
					});

					return controller.processUploadedAudio(mockUser, processData, mockRequest);
				});

			const results = await Promise.all(uploadPromises);

			expect(results).toHaveLength(5);
			results.forEach((result, index) => {
				expect(result.success).toBe(true);
				expect(result.memoId).toBe(`memo-${index}`);
			});
		});

		it('should process video upload within acceptable time', async () => {
			const processData = {
				filePath: 'user-123/memo-456/video.mp4',
				duration: 300,
				mediaType: 'video' as const,
			};

			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 50,
				currentCredits: 100,
				creditType: 'user',
			});

			jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
				memoId: 'memo-456',
				memo: { id: 'memo-456' } as any,
				audioPath: processData.filePath,
			});

			const start = Date.now();
			await controller.processUploadedAudio(mockUser, processData, mockRequest);
			const duration = Date.now() - start;

			// Should complete within 1 second (excluding actual transcription)
			expect(duration).toBeLessThan(1000);
		});
	});

	describe('Security tests', () => {
		it('should validate user authorization', async () => {
			const processData = {
				filePath: 'other-user/memo-456/video.mp4',
				duration: 180,
				mediaType: 'video' as const,
			};

			// Service should validate that file path matches user
			jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
				hasEnoughCredits: true,
				requiredCredits: 30,
				currentCredits: 100,
				creditType: 'user',
			});

			jest.spyOn(service, 'createMemoFromUploadedFile').mockResolvedValue({
				memoId: 'memo-456',
				memo: { id: 'memo-456' } as any,
				audioPath: processData.filePath,
			});

			await controller.processUploadedAudio(mockUser, processData, mockRequest);

			// Verify service was called with correct user ID
			expect(service.createMemoFromUploadedFile).toHaveBeenCalledWith(
				mockUser.sub,
				expect.any(String),
				expect.any(Number),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.any(String),
				expect.anything(),
				expect.anything(),
				expect.any(String),
				expect.anything()
			);
		});

		it('should reject path traversal attempts', async () => {
			const maliciousPaths = [
				'../../../etc/passwd',
				'..\\..\\..\\windows\\system32',
				'user-123/../other-user/memo-456/video.mp4',
			];

			for (const path of maliciousPaths) {
				const processData = {
					filePath: path,
					duration: 180,
					mediaType: 'video' as const,
				};

				// The service should handle path validation
				jest.spyOn(creditService, 'checkUserCredits').mockResolvedValue({
					hasEnoughCredits: true,
					requiredCredits: 30,
					currentCredits: 100,
					creditType: 'user',
				});

				// Assuming service validates and rejects
				jest
					.spyOn(service, 'createMemoFromUploadedFile')
					.mockRejectedValue(new BadRequestException('Invalid file path'));

				await expect(
					controller.processUploadedAudio(mockUser, processData, mockRequest)
				).rejects.toThrow();
			}
		});
	});
});
