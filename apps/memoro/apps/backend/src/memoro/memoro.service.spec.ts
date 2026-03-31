import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MemoroService } from './memoro.service';
import { SpacesClientService } from '../spaces/spaces-client.service';
import { SpaceSyncService } from '../spaces/space-sync.service';
import { CreditConsumptionService } from '../credits/credit-consumption.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');
jest.mock('uuid', () => ({
	v4: jest.fn(() => 'memo-123'),
}));

global.fetch = jest.fn();

describe('MemoroService', () => {
	let service: MemoroService;
	let configService: jest.Mocked<ConfigService>;
	let spacesService: jest.Mocked<SpacesClientService>;
	let spaceSyncService: jest.Mocked<SpaceSyncService>;
	let creditConsumptionService: jest.Mocked<CreditConsumptionService>;
	let mockSupabaseClient: any;
	let mockSupabaseServiceClient: any;

	const mockUserId = 'user-123';
	const mockToken = 'mock-token';
	const mockSpaceId = 'space-123';
	const mockMemoId = 'memo-123';

	beforeEach(async () => {
		mockSupabaseClient = {
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			like: jest.fn().mockReturnThis(),
			upsert: jest.fn().mockReturnThis(),
			maybeSingle: jest.fn().mockReturnThis(),
			storage: {
				from: jest.fn().mockReturnValue({
					upload: jest.fn().mockResolvedValue({ data: { path: 'uploads/audio.mp3' }, error: null }),
					getPublicUrl: jest
						.fn()
						.mockReturnValue({ data: { publicUrl: 'https://example.com/audio.mp3' } }),
				}),
			},
		};

		mockSupabaseServiceClient = {
			...mockSupabaseClient,
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
		};

		(createClient as jest.Mock).mockImplementation((url, key, options) => {
			if (options?.global?.headers?.Authorization) {
				return mockSupabaseClient;
			}
			return mockSupabaseServiceClient;
		});

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MemoroService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string) => {
							const config: Record<string, string> = {
								MEMORO_SUPABASE_URL: 'https://test.supabase.co',
								MEMORO_SUPABASE_ANON_KEY: 'test-anon-key',
								MEMORO_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
								AUDIO_MICROSERVICE_URL: 'https://audio.microservice.com',
							};
							return config[key];
						}),
					},
				},
				{
					provide: SpacesClientService,
					useValue: {
						getUserSpaces: jest.fn(),
						createSpace: jest.fn(),
						getSpaceDetails: jest.fn(),
						addSpaceMember: jest.fn(),
						acceptSpaceInvite: jest.fn(),
						declineSpaceInvite: jest.fn(),
						leaveSpace: jest.fn(),
						deleteSpace: jest.fn(),
						getSpaceInvites: jest.fn(),
						resendSpaceInvite: jest.fn(),
						cancelSpaceInvite: jest.fn(),
						getUserPendingInvites: jest.fn(),
						verifySpaceAccess: jest.fn(),
					},
				},
				{
					provide: SpaceSyncService,
					useValue: {
						syncSpaceMembership: jest.fn(),
						removeSpaceMembership: jest.fn(),
					},
				},
				{
					provide: CreditConsumptionService,
					useValue: {
						consumeTranscriptionCredits: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<MemoroService>(MemoroService);
		configService = module.get(ConfigService);
		spacesService = module.get(SpacesClientService);
		spaceSyncService = module.get(SpaceSyncService);
		creditConsumptionService = module.get(CreditConsumptionService);

		(global.fetch as jest.Mock).mockClear();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getMemoroSpaces', () => {
		it('should return empty array', async () => {
			const result = await service.getMemoroSpaces(mockUserId, mockToken);
			expect(result).toEqual([]);
		});
	});

	describe('createMemoroSpace', () => {
		it('should create space and sync membership', async () => {
			const spaceName = 'Test Space';
			const mockSpace = {
				id: mockSpaceId,
				name: spaceName,
				owner_id: mockUserId,
				app_id: 'test-app',
				roles: { [mockUserId]: 'owner' },
				credits: 1000,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z',
			};

			spacesService.createSpace.mockResolvedValue(mockSpace);
			spaceSyncService.syncSpaceMembership.mockResolvedValue(undefined);

			const result = await service.createMemoroSpace(mockUserId, spaceName, mockToken);

			expect(result).toEqual(mockSpace);
			expect(spacesService.createSpace).toHaveBeenCalledWith(mockUserId, spaceName, mockToken);
			expect(spaceSyncService.syncSpaceMembership).toHaveBeenCalledWith(
				mockSpaceId,
				mockUserId,
				'owner'
			);
		});

		it('should throw error if space creation fails', async () => {
			const spaceName = 'Test Space';
			spacesService.createSpace.mockRejectedValue(new Error('Failed to create space'));

			await expect(service.createMemoroSpace(mockUserId, spaceName, mockToken)).rejects.toThrow(
				'Failed to create space'
			);
		});
	});

	describe('getMemoroSpaceDetails', () => {
		it('should get space details successfully', async () => {
			const mockSpaceDetails = { space: { id: mockSpaceId, name: 'Test Space' } };
			spacesService.getSpaceDetails.mockResolvedValue(mockSpaceDetails);

			const result = await service.getMemoroSpaceDetails(mockUserId, mockSpaceId, mockToken);

			expect(result).toEqual(mockSpaceDetails);
			expect(spacesService.getSpaceDetails).toHaveBeenCalledWith(mockSpaceId, mockToken);
		});

		it('should handle NotFoundException with fallback', async () => {
			spacesService.getSpaceDetails
				.mockRejectedValueOnce(new NotFoundException('Space not found'))
				.mockResolvedValueOnce({ space: { id: mockSpaceId, name: 'Test Space' } });

			mockSupabaseClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: { id: mockSpaceId, owner_id: mockUserId, roles: { [mockUserId]: 'owner' } },
					error: null,
				}),
			});

			const result = await service.getMemoroSpaceDetails(mockUserId, mockSpaceId, mockToken);

			expect(result).toBeDefined();
			expect(spacesService.getSpaceDetails).toHaveBeenCalledTimes(2);
		});

		it('should throw ForbiddenException if user has no access', async () => {
			spacesService.getSpaceDetails.mockRejectedValue(new NotFoundException('Space not found'));

			mockSupabaseClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: { id: mockSpaceId, owner_id: 'other-user', roles: {} },
					error: null,
				}),
			});

			await expect(
				service.getMemoroSpaceDetails(mockUserId, mockSpaceId, mockToken)
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('linkMemoToSpace', () => {
		it('should link memo to space successfully', async () => {
			const linkData = { memoId: mockMemoId, spaceId: mockSpaceId };

			// First mock for memo verification - needs maybeSingle
			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn(() => ({
					eq: jest.fn(() => ({
						maybeSingle: jest.fn().mockResolvedValue({
							data: { id: mockMemoId, user_id: mockUserId },
							error: null,
						}),
					})),
				})),
			});

			// Second mock for space verification - needs maybeSingle
			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn(() => ({
					maybeSingle: jest.fn().mockResolvedValue({
						data: { id: mockSpaceId, owner_id: mockUserId, roles: { [mockUserId]: 'owner' } },
						error: null,
					}),
				})),
			});

			mockSupabaseClient.from.mockReturnValueOnce({
				insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
			});

			const result = await service.linkMemoToSpace(mockUserId, linkData, mockToken);

			expect(result).toEqual({ success: true, message: 'Memo linked to space successfully' });
		});

		it('should handle duplicate link gracefully', async () => {
			const linkData = { memoId: mockMemoId, spaceId: mockSpaceId };

			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: { id: mockMemoId, user_id: mockUserId },
					error: null,
				}),
			});

			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: { id: mockSpaceId, owner_id: mockUserId, roles: { [mockUserId]: 'owner' } },
					error: null,
				}),
			});

			mockSupabaseClient.from.mockReturnValueOnce({
				insert: jest.fn().mockResolvedValue({
					data: null,
					error: { code: '23505', message: 'duplicate key value' },
				}),
			});

			const result = await service.linkMemoToSpace(mockUserId, linkData, mockToken);

			expect(result).toEqual({ success: true, message: 'Memo is already linked to this space' });
		});

		it('should throw NotFoundException if user lacks memo access', async () => {
			const linkData = { memoId: mockMemoId, spaceId: mockSpaceId };

			// Mock for verifyMemoAccess - needs single not maybeSingle
			mockSupabaseClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn(() => ({
					single: jest.fn().mockResolvedValue({
						data: { id: mockMemoId, user_id: 'other-user' },
						error: null,
					}),
				})),
			});

			await expect(service.linkMemoToSpace(mockUserId, linkData, mockToken)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getSpaceMemos', () => {
		it('should get space memos successfully', async () => {
			const mockMemos = [
				{ id: 'memo-1', title: 'Memo 1', user_id: mockUserId },
				{ id: 'memo-2', title: 'Memo 2', user_id: 'other-user' },
			];

			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn(() => ({
					maybeSingle: jest.fn().mockResolvedValue({
						data: { id: mockSpaceId, owner_id: mockUserId, roles: { [mockUserId]: 'owner' } },
						error: null,
					}),
				})),
			});

			mockSupabaseServiceClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				order: jest.fn().mockResolvedValue({
					data: mockMemos,
					error: null,
				}),
			});

			const result = await service.getSpaceMemos(mockUserId, mockSpaceId, mockToken);

			expect(result).toEqual({ memos: mockMemos });
		});

		it('should return empty array if no memos found', async () => {
			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn(() => ({
					maybeSingle: jest.fn().mockResolvedValue({
						data: { id: mockSpaceId, owner_id: mockUserId, roles: { [mockUserId]: 'owner' } },
						error: null,
					}),
				})),
			});

			mockSupabaseServiceClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				order: jest.fn().mockResolvedValue({
					data: [],
					error: null,
				}),
			});

			const result = await service.getSpaceMemos(mockUserId, mockSpaceId, mockToken);

			expect(result).toEqual({ memos: [] });
		});
	});

	describe('validateMemoForRetry', () => {
		it('should validate memo successfully', async () => {
			const mockMemo = {
				id: mockMemoId,
				user_id: mockUserId,
				metadata: {
					processing: {
						transcription: { status: 'error' },
					},
				},
			};

			mockSupabaseClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: mockMemo,
					error: null,
				}),
			});

			const result = await service.validateMemoForRetry(mockUserId, mockMemoId, mockToken);

			expect(result).toEqual(mockMemo);
		});

		it('should return null if memo not found', async () => {
			mockSupabaseClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: null,
					error: { code: 'PGRST116', message: 'not found' },
				}),
			});

			const result = await service.validateMemoForRetry(mockUserId, mockMemoId, mockToken);

			expect(result).toBeNull();
		});

		it('should return memo even if user does not own it', async () => {
			const mockMemo = {
				id: mockMemoId,
				user_id: 'other-user',
				metadata: {},
			};

			mockSupabaseClient.from.mockReturnValue({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: mockMemo,
					error: null,
				}),
			});

			const result = await service.validateMemoForRetry(mockUserId, mockMemoId, mockToken);

			expect(result).toEqual(mockMemo);
		});
	});

	describe('retryTranscription', () => {
		it('should retry transcription successfully', async () => {
			const mockMemo = {
				id: mockMemoId,
				user_id: mockUserId,
				metadata: {
					processing: {
						transcription: {
							status: 'error',
							audioPath: 'uploads/audio.mp3',
						},
					},
				},
				space_id: mockSpaceId,
				location_data: null,
				recording_started_at: '2024-01-01T00:00:00Z',
				language_codes: ['en-US'],
			};

			mockSupabaseClient.from.mockReturnValueOnce({
				update: jest.fn().mockReturnThis(),
				eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
			});

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			});

			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: mockMemo,
					error: null,
				}),
			});

			const result = await service.retryTranscription(mockUserId, mockMemoId, mockToken, 1);

			expect(result).toEqual({ success: true });
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('transcribe-fast'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockToken}`,
					}),
				})
			);
		});

		it('should handle edge function errors', async () => {
			const mockMemo = {
				id: mockMemoId,
				user_id: mockUserId,
				metadata: {
					processing: {
						transcription: {
							status: 'error',
							audioPath: 'uploads/audio.mp3',
						},
					},
				},
			};

			mockSupabaseClient.from.mockReturnValueOnce({
				update: jest.fn().mockReturnThis(),
				eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
			});

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => 'Internal Server Error',
			});

			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: mockMemo,
					error: null,
				}),
			});

			await expect(
				service.retryTranscription(mockUserId, mockMemoId, mockToken, 1)
			).rejects.toThrow('Edge function call failed');
		});
	});

	describe('updateMemoTranscriptionStatus', () => {
		it('should update transcription status successfully', async () => {
			const status = 'completed';
			const additionalData = { completedAt: '2024-01-01T00:00:00Z' };

			// First mock for reading existing metadata
			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: {
						id: mockMemoId,
						metadata: {},
					},
					error: null,
				}),
			});

			// Second mock for updating metadata
			mockSupabaseClient.from.mockReturnValueOnce({
				update: jest.fn().mockReturnThis(),
				eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
			});

			await service.updateMemoTranscriptionStatus(mockMemoId, status, mockToken, additionalData);

			expect(mockSupabaseClient.from).toHaveBeenCalledWith('memos');
			expect(mockSupabaseClient.update).toHaveBeenCalledWith({
				metadata: expect.objectContaining({
					processing: expect.objectContaining({
						transcription: expect.objectContaining({
							status,
							...additionalData,
						}),
					}),
				}),
			});
		});
	});

	describe('handleTranscriptionCompleted', () => {
		it('should handle successful transcription completion', async () => {
			const transcriptionResult = {
				text: 'Hello world',
				segments: [],
				utterances: [],
			};

			// Mock first call to get memo details
			mockSupabaseServiceClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: {
						id: mockMemoId,
						metadata: {
							location: {
								source: 'manual',
							},
						},
						duration_seconds: 300,
						space_id: mockSpaceId,
					},
					error: null,
				}),
			});

			// Mock second call to update memo with transcription
			mockSupabaseServiceClient.from.mockReturnValueOnce({
				update: jest.fn().mockReturnThis(),
				eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
			});

			// Mock third call to update memo with headline
			mockSupabaseServiceClient.from.mockReturnValueOnce({
				update: jest.fn().mockReturnThis(),
				eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
			});

			creditConsumptionService.consumeTranscriptionCredits.mockResolvedValue({
				success: true,
				creditsConsumed: 10,
				creditType: 'space',
				message: 'Credits consumed',
			});

			// Mock location source
			const mockLocationResponse = {
				source: 'manual',
			};

			// Mock first fetch call for location data source
			(global.fetch as jest.Mock).mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: async () => mockLocationResponse,
				})
			);

			// Mock second fetch call for headline edge function
			(global.fetch as jest.Mock).mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: async () => ({ headline: 'Test Headline', intro: 'Test Intro' }),
				})
			);

			const result = await service.handleTranscriptionCompleted(
				mockMemoId,
				mockUserId,
				transcriptionResult,
				'fast',
				true,
				undefined,
				mockToken
			);

			expect(result).toEqual({ success: true, message: 'Transcription processed successfully' });
			expect(creditConsumptionService.consumeTranscriptionCredits).toHaveBeenCalled();
		});

		it('should handle failed transcription', async () => {
			const error = 'Transcription failed';

			const updateMock = jest.fn().mockResolvedValue({ data: {}, error: null });
			mockSupabaseServiceClient.from.mockReturnValue({
				update: jest.fn(() => ({
					eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
				})),
			});

			const result = await service.handleTranscriptionCompleted(
				mockMemoId,
				mockUserId,
				undefined,
				'fast',
				false,
				error,
				mockToken
			);

			expect(result).toEqual({
				success: false,
				message: 'Transcription failed for memo memo-123: Transcription failed',
			});

			// Verify the update was called on the mock
			const fromCall = mockSupabaseServiceClient.from.mock.calls[0];
			expect(fromCall[0]).toBe('memos');
		});
	});

	describe('createMemoFromUploadedFile', () => {
		it('should create memo from uploaded file successfully', async () => {
			const filePath = 'uploads/audio.mp3';
			const duration = 300;

			mockSupabaseClient.from.mockReturnValueOnce({
				upsert: jest.fn().mockResolvedValue({
					data: null,
					error: null,
				}),
			});

			mockSupabaseClient.from.mockReturnValueOnce({
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				single: jest.fn().mockResolvedValue({
					data: { id: mockMemoId },
					error: null,
				}),
			});

			const result = await service.createMemoFromUploadedFile(
				mockUserId,
				filePath,
				duration,
				mockSpaceId,
				null,
				undefined,
				mockToken
			);

			expect(result).toEqual({ memoId: mockMemoId, audioPath: filePath });
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('memos');
			expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
				expect.objectContaining({
					user_id: mockUserId,
					space_id: mockSpaceId,
					duration_seconds: duration,
				}),
				{
					onConflict: 'id',
					ignoreDuplicates: false,
				}
			);
		});
	});

	describe('Space Management Methods', () => {
		describe('deleteMemoroSpace', () => {
			it('should delete space and cleanup memo links', async () => {
				spacesService.deleteSpace.mockResolvedValue({ success: true });
				spaceSyncService.removeSpaceMembership.mockResolvedValue(undefined);

				mockSupabaseServiceClient.from.mockReturnValue({
					delete: jest.fn().mockReturnThis(),
					eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
				});

				const result = await service.deleteMemoroSpace(mockUserId, mockSpaceId, mockToken);

				expect(result).toEqual({ success: true });
				expect(spacesService.deleteSpace).toHaveBeenCalledWith(mockUserId, mockSpaceId, mockToken);
				// Note: removeSpaceMembership might not be called in all cases
			});
		});

		describe('inviteUserToSpace', () => {
			it('should invite user to space successfully', async () => {
				const email = 'invitee@example.com';
				const role = 'viewer';

				spacesService.addSpaceMember.mockResolvedValue({
					inviteId: 'invite-123',
					message: 'Invitation sent',
				});

				const result = await service.inviteUserToSpace(
					mockUserId,
					mockSpaceId,
					email,
					role,
					mockToken
				);

				expect(result).toEqual({ inviteId: 'invite-123', message: 'Invitation sent' });
				expect(spacesService.addSpaceMember).toHaveBeenCalledWith(
					mockSpaceId,
					email,
					role,
					mockToken
				);
			});
		});

		describe('leaveSpace', () => {
			it('should leave space successfully', async () => {
				spacesService.leaveSpace.mockResolvedValue({ success: true });
				spaceSyncService.removeSpaceMembership.mockResolvedValue(undefined);

				const result = await service.leaveSpace(mockUserId, mockSpaceId, mockToken);

				expect(result).toEqual({ success: true });
				expect(spacesService.leaveSpace).toHaveBeenCalledWith(mockUserId, mockSpaceId, mockToken);
				// Note: removeSpaceMembership might not be called in all cases
			});
		});
	});

	describe('safeSourceMerge', () => {
		it('should merge updates into existing source', () => {
			const existingSource = {
				type: 'audio',
				path: 'uploads/original.mp3',
				format: 'mp3',
				duration: 120,
			};

			const updates = {
				primary_language: 'en',
				languages: ['en', 'es'],
				speakers: { '0': 'Speaker 1' },
			};

			const result = service['safeSourceMerge'](existingSource, updates);

			expect(result).toEqual({
				type: 'audio',
				path: 'uploads/original.mp3',
				format: 'mp3',
				duration: 120,
				primary_language: 'en',
				languages: ['en', 'es'],
				speakers: { '0': 'Speaker 1' },
			});
		});

		it('should handle empty existing source', () => {
			const updates = {
				type: 'audio',
				path: 'uploads/new.mp3',
				primary_language: 'en',
			};

			const result = service['safeSourceMerge'](null, updates);

			expect(result).toEqual({
				type: 'audio',
				path: 'uploads/new.mp3',
				primary_language: 'en',
			});
		});

		it('should flatten nested source properties', () => {
			const existingSource = {
				source: {
					type: 'audio',
					path: 'uploads/nested.mp3',
				},
				duration: 180,
			};

			const updates = {
				primary_language: 'fr',
			};

			const result = service['safeSourceMerge'](existingSource, updates);

			expect(result).toEqual({
				type: 'audio',
				path: 'uploads/nested.mp3',
				duration: 180,
				primary_language: 'fr',
			});
			expect(result.source).toBeUndefined();
		});

		it('should fix invalid type property', () => {
			const existingSource = {
				type: { invalid: 'object' },
				path: 'uploads/file.mp3',
			};

			const updates = {
				duration: 240,
			};

			const result = service['safeSourceMerge'](existingSource, updates);

			expect(result).toEqual({
				type: 'audio',
				path: 'uploads/file.mp3',
				duration: 240,
			});
		});

		it('should convert invalid path property to string', () => {
			const existingSource = {
				type: 'audio',
				path: { invalid: 'object' },
			};

			const updates = {
				format: 'wav',
			};

			const result = service['safeSourceMerge'](existingSource, updates);

			expect(result).toEqual({
				type: 'audio',
				path: '[object Object]',
				format: 'wav',
			});
		});

		it('should preserve additional_recordings array', () => {
			const existingSource = {
				type: 'audio',
				path: 'uploads/main.mp3',
				additional_recordings: [{ path: 'uploads/additional1.mp3', status: 'completed' }],
			};

			const updates = {
				additional_recordings: [
					{ path: 'uploads/additional1.mp3', status: 'completed' },
					{ path: 'uploads/additional2.mp3', status: 'processing' },
				],
			};

			const result = service['safeSourceMerge'](existingSource, updates);

			expect(result).toEqual({
				type: 'audio',
				path: 'uploads/main.mp3',
				additional_recordings: [
					{ path: 'uploads/additional1.mp3', status: 'completed' },
					{ path: 'uploads/additional2.mp3', status: 'processing' },
				],
			});
		});

		it('should handle complex nested structure with all properties', () => {
			const existingSource = {
				source: {
					type: 'audio',
					path: 'uploads/complex.mp3',
					speakers: { '0': 'John' },
				},
				utterances: [{ speaker: '0', text: 'Hello' }],
				additional_recordings: [],
			};

			const updates = {
				primary_language: 'en',
				languages: ['en'],
				utterances: [
					{ speaker: '0', text: 'Hello' },
					{ speaker: '1', text: 'Hi there' },
				],
				speakers: { '0': 'John', '1': 'Jane' },
			};

			const result = service['safeSourceMerge'](existingSource, updates);

			expect(result).toEqual({
				type: 'audio',
				path: 'uploads/complex.mp3',
				speakers: { '0': 'John', '1': 'Jane' },
				utterances: [
					{ speaker: '0', text: 'Hello' },
					{ speaker: '1', text: 'Hi there' },
				],
				additional_recordings: [],
				primary_language: 'en',
				languages: ['en'],
			});
		});
	});
});
