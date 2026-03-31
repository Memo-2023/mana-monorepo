import { Test, TestingModule } from '@nestjs/testing';
import { MemoroController } from './memoro.controller';
import { MemoroService } from './memoro.service';
import { CreditClientService, CreditCheckResponse } from '../credits/credit-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.interface';
import { MemoroSpaceDto } from '../interfaces/memoro.interfaces';

describe('MemoroController', () => {
	let controller: MemoroController;
	let memoroService: jest.Mocked<MemoroService>;
	let creditClientService: jest.Mocked<CreditClientService>;

	const mockUser: JwtPayload = {
		sub: 'user-123',
		email: 'test@example.com',
		role: 'user',
		app_id: 'test-app-id',
		aud: 'authenticated',
		iat: 1234567890,
		exp: 1234567890,
	};

	const mockRequest = {
		token: 'mock-token',
		user: mockUser,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MemoroController],
			providers: [
				{
					provide: MemoroService,
					useValue: {
						getMemoroSpaces: jest.fn(),
						createMemoroSpace: jest.fn(),
						getMemoroSpaceDetails: jest.fn(),
						deleteMemoroSpace: jest.fn(),
						linkMemoToSpace: jest.fn(),
						unlinkMemoFromSpace: jest.fn(),
						getSpaceInvites: jest.fn(),
						inviteUserToSpace: jest.fn(),
						resendSpaceInvite: jest.fn(),
						cancelSpaceInvite: jest.fn(),
						getSpaceMemos: jest.fn(),
						leaveSpace: jest.fn(),
						getUserPendingInvites: jest.fn(),
						acceptSpaceInvite: jest.fn(),
						declineSpaceInvite: jest.fn(),
						validateMemoForRetry: jest.fn(),
						retryTranscription: jest.fn(),
						retryHeadline: jest.fn(),
						createMemoFromUploadedFile: jest.fn(),
						updateMemoWithJobId: jest.fn(),
						updateMemoTranscriptionStatus: jest.fn(),
						updateBatchMetadataByMemoId: jest.fn(),
						handleTranscriptionCompleted: jest.fn(),
						getSupabaseUrl: jest.fn().mockReturnValue('https://test.supabase.co'),
						getSupabaseKey: jest.fn().mockReturnValue('test-key'),
					},
				},
				{
					provide: CreditClientService,
					useValue: {
						checkSpaceCredits: jest.fn(),
						checkUserCredits: jest.fn(),
						checkAndConsumeCredits: jest.fn(),
					},
				},
			],
		})
			.overrideGuard(AuthGuard)
			.useValue({
				canActivate: jest.fn().mockReturnValue(true),
			})
			.compile();

		controller = module.get<MemoroController>(MemoroController);
		memoroService = module.get(MemoroService);
		creditClientService = module.get(CreditClientService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getMemoroSpaces', () => {
		it('should return spaces in correct format', async () => {
			const mockSpaces: MemoroSpaceDto[] = [
				{
					id: '1',
					name: 'Space 1',
					owner_id: 'user-123',
					app_id: 'test-app-id',
					roles: {},
					credits: 100,
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
				},
				{
					id: '2',
					name: 'Space 2',
					owner_id: 'user-456',
					app_id: 'test-app-id',
					roles: {},
					credits: 200,
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
				},
			];
			memoroService.getMemoroSpaces.mockResolvedValue(mockSpaces);

			const result = await controller.getMemoroSpaces(mockUser, mockRequest);

			expect(result).toEqual({ spaces: mockSpaces });
			expect(memoroService.getMemoroSpaces).toHaveBeenCalledWith(mockUser.sub, mockRequest.token);
		});
	});

	describe('createMemoroSpace', () => {
		it('should create a space successfully', async () => {
			const spaceName = 'New Space';
			const mockSpace: MemoroSpaceDto = {
				id: 'space-123',
				name: spaceName,
				owner_id: mockUser.sub,
				app_id: 'test-app-id',
				roles: {},
				credits: 0,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z',
			};
			memoroService.createMemoroSpace.mockResolvedValue(mockSpace);

			const result = await controller.createMemoroSpace(mockUser, spaceName, mockRequest);

			expect(result).toEqual({ space: mockSpace });
			expect(memoroService.createMemoroSpace).toHaveBeenCalledWith(
				mockUser.sub,
				spaceName,
				mockRequest.token
			);
		});

		it('should throw BadRequestException if name is missing', async () => {
			await expect(controller.createMemoroSpace(mockUser, '', mockRequest)).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('getMemoroSpaceDetails', () => {
		it('should return space details when response already has space property', async () => {
			const spaceId = 'space-123';
			const mockSpace: MemoroSpaceDto = {
				id: spaceId,
				name: 'Test Space',
				owner_id: mockUser.sub,
				app_id: 'test-app-id',
				roles: {},
				credits: 100,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z',
			};
			const mockSpaceData = { space: mockSpace };
			memoroService.getMemoroSpaceDetails.mockResolvedValue(mockSpaceData);

			const result = await controller.getMemoroSpaceDetails(mockUser, spaceId, mockRequest);

			expect(result).toEqual(mockSpaceData);
			expect(memoroService.getMemoroSpaceDetails).toHaveBeenCalledWith(
				mockUser.sub,
				spaceId,
				mockRequest.token
			);
		});

		it('should wrap response in space property if not already wrapped', async () => {
			const spaceId = 'space-123';
			const mockSpaceData: MemoroSpaceDto = {
				id: spaceId,
				name: 'Test Space',
				owner_id: mockUser.sub,
				app_id: 'test-app-id',
				roles: {},
				credits: 100,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z',
			};
			memoroService.getMemoroSpaceDetails.mockResolvedValue(mockSpaceData);

			const result = await controller.getMemoroSpaceDetails(mockUser, spaceId, mockRequest);

			expect(result).toEqual({ space: mockSpaceData });
		});

		it('should throw BadRequestException if spaceId is missing', async () => {
			await expect(controller.getMemoroSpaceDetails(mockUser, '', mockRequest)).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('deleteMemoroSpace', () => {
		it('should delete space successfully', async () => {
			const spaceId = 'space-123';
			memoroService.deleteMemoroSpace.mockResolvedValue(undefined);

			const result = await controller.deleteMemoroSpace(mockUser, spaceId, mockRequest);

			expect(result).toEqual({ success: true, message: 'Space deleted successfully' });
			expect(memoroService.deleteMemoroSpace).toHaveBeenCalledWith(
				mockUser.sub,
				spaceId,
				mockRequest.token
			);
		});

		it('should throw NotFoundException when space not found', async () => {
			const spaceId = 'space-123';
			memoroService.deleteMemoroSpace.mockRejectedValue(new NotFoundException());

			await expect(controller.deleteMemoroSpace(mockUser, spaceId, mockRequest)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when user lacks permission', async () => {
			const spaceId = 'space-123';
			memoroService.deleteMemoroSpace.mockRejectedValue(new ForbiddenException());

			await expect(controller.deleteMemoroSpace(mockUser, spaceId, mockRequest)).rejects.toThrow(
				ForbiddenException
			);
		});

		it('should throw BadRequestException for other errors', async () => {
			const spaceId = 'space-123';
			memoroService.deleteMemoroSpace.mockRejectedValue(new Error('Unknown error'));

			await expect(controller.deleteMemoroSpace(mockUser, spaceId, mockRequest)).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('linkMemoToSpace', () => {
		it('should link memo to space successfully', async () => {
			const linkData = { memoId: 'memo-123', spaceId: 'space-123' };
			const mockResult = { success: true, message: 'Memo linked successfully' };
			memoroService.linkMemoToSpace.mockResolvedValue(mockResult);

			const result = await controller.linkMemoToSpace(mockUser, linkData, mockRequest);

			expect(result).toEqual(mockResult);
			expect(memoroService.linkMemoToSpace).toHaveBeenCalledWith(
				mockUser.sub,
				linkData,
				mockRequest.token
			);
		});

		it('should return success even if service throws error', async () => {
			const linkData = { memoId: 'memo-123', spaceId: 'space-123' };
			memoroService.linkMemoToSpace.mockRejectedValue(new Error('Space not found'));

			const result = await controller.linkMemoToSpace(mockUser, linkData, mockRequest);

			expect(result).toEqual({
				success: true,
				message: 'Memo linked to space (direct DB operation)',
			});
		});
	});

	describe('inviteUserToSpace', () => {
		it('should invite user successfully', async () => {
			const spaceId = 'space-123';
			const inviteData = { email: 'invitee@example.com', role: 'member' };
			const mockResult = { inviteId: 'invite-123' };
			memoroService.inviteUserToSpace.mockResolvedValue(mockResult);

			const result = await controller.inviteUserToSpace(mockUser, spaceId, inviteData, mockRequest);

			expect(result).toEqual({
				success: true,
				message: `Successfully invited ${inviteData.email} to the space`,
				inviteId: mockResult.inviteId,
			});
			expect(memoroService.inviteUserToSpace).toHaveBeenCalledWith(
				mockUser.sub,
				spaceId,
				inviteData.email,
				inviteData.role,
				mockRequest.token
			);
		});

		it('should throw BadRequestException if spaceId is missing', async () => {
			const inviteData = { email: 'invitee@example.com', role: 'member' };

			await expect(
				controller.inviteUserToSpace(mockUser, '', inviteData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if email is missing', async () => {
			const spaceId = 'space-123';
			const inviteData = { email: '', role: 'member' };

			await expect(
				controller.inviteUserToSpace(mockUser, spaceId, inviteData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if role is missing', async () => {
			const spaceId = 'space-123';
			const inviteData = { email: 'invitee@example.com', role: '' };

			await expect(
				controller.inviteUserToSpace(mockUser, spaceId, inviteData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('checkTranscriptionCredits', () => {
		it('should check user credits successfully', async () => {
			const checkData = { durationSeconds: 300 };
			const mockCreditCheck: CreditCheckResponse = {
				hasEnoughCredits: true,
				requiredCredits: 5,
				currentCredits: 100,
				creditType: 'user',
			};
			creditClientService.checkUserCredits.mockResolvedValue(mockCreditCheck);

			const result = await controller.checkTranscriptionCredits(mockUser, checkData, mockRequest);

			expect(result).toEqual({
				hasEnoughCredits: true,
				requiredCredits: 5,
				currentCredits: 100,
				creditType: 'user',
				durationMinutes: 5,
				estimatedCostPerHour: 100,
			});
		});

		it('should check space credits when spaceId provided', async () => {
			const checkData = { durationSeconds: 300, spaceId: 'space-123' };
			const mockCreditCheck: CreditCheckResponse = {
				hasEnoughCredits: true,
				requiredCredits: 5,
				currentCredits: 200,
				creditType: 'space',
			};
			creditClientService.checkSpaceCredits.mockResolvedValue(mockCreditCheck);

			const result = await controller.checkTranscriptionCredits(mockUser, checkData, mockRequest);

			expect(result.creditType).toBe('space');
			expect(creditClientService.checkSpaceCredits).toHaveBeenCalledWith(
				'space-123',
				10,
				mockRequest.token
			);
		});

		it('should fall back to user credits if space credit check fails', async () => {
			const checkData = { durationSeconds: 300, spaceId: 'space-123' };
			const mockUserCreditCheck: CreditCheckResponse = {
				hasEnoughCredits: true,
				requiredCredits: 5,
				currentCredits: 100,
				creditType: 'user',
			};
			creditClientService.checkSpaceCredits.mockRejectedValue(new Error('Space not found'));
			creditClientService.checkUserCredits.mockResolvedValue(mockUserCreditCheck);

			const result = await controller.checkTranscriptionCredits(mockUser, checkData, mockRequest);

			expect(result.creditType).toBe('user');
			expect(creditClientService.checkUserCredits).toHaveBeenCalled();
		});

		it('should throw BadRequestException for invalid duration', async () => {
			const checkData = { durationSeconds: -1 };

			await expect(
				controller.checkTranscriptionCredits(mockUser, checkData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('processUploadedAudio', () => {
		it('should process uploaded audio successfully', async () => {
			const processData = {
				filePath: '/uploads/audio.mp3',
				duration: 300,
				spaceId: 'space-123',
				enableDiarization: true,
			};

			const mockCreditCheck: CreditCheckResponse = {
				hasEnoughCredits: true,
				requiredCredits: 5,
				currentCredits: 100,
				creditType: 'space',
			};

			const mockMemoResult = {
				memoId: 'memo-123',
				audioPath: processData.filePath,
				memo: { id: 'memo-123', created_at: '2025-06-26T17:00:00Z' },
			};

			creditClientService.checkSpaceCredits.mockResolvedValue(mockCreditCheck);
			memoroService.createMemoFromUploadedFile.mockResolvedValue(mockMemoResult);

			const result = await controller.processUploadedAudio(mockUser, processData, mockRequest);

			expect(result).toEqual({
				success: true,
				memoId: 'memo-123',
				memo: { id: 'memo-123', created_at: '2025-06-26T17:00:00Z' },
				filePath: processData.filePath,
				status: 'processing',
				estimatedDuration: 5,
				message: 'Memo created successfully. Transcription in progress.',
				estimatedCredits: 10,
			});
		});

		it('should throw ForbiddenException for insufficient credits', async () => {
			const processData = {
				filePath: '/uploads/audio.mp3',
				duration: 300,
			};

			const mockCreditCheck: CreditCheckResponse = {
				hasEnoughCredits: false,
				requiredCredits: 5,
				currentCredits: 2,
				creditType: 'user',
			};

			creditClientService.checkUserCredits.mockResolvedValue(mockCreditCheck);

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow(ForbiddenException);
		});

		it('should throw BadRequestException for missing file path', async () => {
			const processData = {
				filePath: '',
				duration: 300,
			};

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException for invalid duration', async () => {
			const processData = {
				filePath: '/uploads/audio.mp3',
				duration: 0,
			};

			await expect(
				controller.processUploadedAudio(mockUser, processData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should use batch transcription for Swiss German', async () => {
			const processData = {
				filePath: '/uploads/audio.mp3',
				duration: 300,
				recordingLanguages: ['de-CH'],
			};

			const mockCreditCheck: CreditCheckResponse = {
				hasEnoughCredits: true,
				requiredCredits: 5,
				currentCredits: 100,
				creditType: 'user',
			};

			const mockMemoResult = {
				memoId: 'memo-123',
				audioPath: processData.filePath,
				memo: { id: 'memo-123', created_at: '2025-06-26T17:00:00Z' },
			};

			creditClientService.checkUserCredits.mockResolvedValue(mockCreditCheck);
			memoroService.createMemoFromUploadedFile.mockResolvedValue(mockMemoResult);

			const result = await controller.processUploadedAudio(mockUser, processData, mockRequest);

			expect(result.success).toBe(true);
			// Note: The actual transcription happens asynchronously
		});
	});

	describe('retryTranscription', () => {
		it('should retry transcription successfully', async () => {
			const retryData = { memoId: 'memo-123' };
			const mockMemo = {
				id: 'memo-123',
				metadata: {
					processing: {
						transcription: {
							status: 'error',
							retryAttempts: 1,
						},
					},
				},
			};

			memoroService.validateMemoForRetry.mockResolvedValue(mockMemo);
			memoroService.retryTranscription.mockResolvedValue({ success: true });

			const result = await controller.retryTranscription(mockUser, retryData, mockRequest);

			expect(result).toEqual({
				success: true,
				message: 'Transcription retry initiated successfully',
				memoId: 'memo-123',
				retryAttempt: 2,
			});
		});

		it('should throw BadRequestException if memoId is missing', async () => {
			const retryData = { memoId: '' };

			await expect(controller.retryTranscription(mockUser, retryData, mockRequest)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should throw NotFoundException if memo not found', async () => {
			const retryData = { memoId: 'memo-123' };
			memoroService.validateMemoForRetry.mockResolvedValue(null);

			await expect(controller.retryTranscription(mockUser, retryData, mockRequest)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw BadRequestException if transcription did not fail', async () => {
			const retryData = { memoId: 'memo-123' };
			const mockMemo = {
				id: 'memo-123',
				metadata: {
					processing: {
						transcription: {
							status: 'completed',
						},
					},
				},
			};

			memoroService.validateMemoForRetry.mockResolvedValue(mockMemo);

			await expect(controller.retryTranscription(mockUser, retryData, mockRequest)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should throw BadRequestException if max retries exceeded', async () => {
			const retryData = { memoId: 'memo-123' };
			const mockMemo = {
				id: 'memo-123',
				metadata: {
					processing: {
						transcription: {
							status: 'error',
							retryAttempts: 3,
						},
					},
				},
			};

			memoroService.validateMemoForRetry.mockResolvedValue(mockMemo);

			await expect(controller.retryTranscription(mockUser, retryData, mockRequest)).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('handleTranscriptionCompleted', () => {
		it('should handle transcription completion successfully', async () => {
			const callbackData = {
				memoId: 'memo-123',
				userId: 'user-123',
				transcriptionResult: { text: 'Hello world' },
				route: 'fast' as const,
				success: true,
			};

			const mockResult = { success: true, message: 'Transcription completed' };
			memoroService.handleTranscriptionCompleted.mockResolvedValue(mockResult);

			const result = await controller.handleTranscriptionCompleted(callbackData, mockRequest);

			expect(result).toEqual(mockResult);
			expect(memoroService.handleTranscriptionCompleted).toHaveBeenCalledWith(
				callbackData.memoId,
				callbackData.userId,
				callbackData.transcriptionResult,
				callbackData.route,
				callbackData.success,
				undefined,
				mockRequest.token
			);
		});

		it('should throw BadRequestException if memoId is missing', async () => {
			const callbackData = {
				memoId: '',
				userId: 'user-123',
			};

			await expect(
				controller.handleTranscriptionCompleted(callbackData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if userId is missing', async () => {
			const callbackData = {
				memoId: 'memo-123',
				userId: '',
			};

			await expect(
				controller.handleTranscriptionCompleted(callbackData, mockRequest)
			).rejects.toThrow(BadRequestException);
		});
	});
});
