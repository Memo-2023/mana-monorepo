import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreditConsumptionService, CreditConsumptionResult } from './credit-consumption.service';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
global.fetch = jest.fn();

describe('CreditConsumptionService', () => {
	let service: CreditConsumptionService;
	let configService: jest.Mocked<ConfigService>;

	const mockUserId = 'user-123';
	const mockSpaceId = 'space-123';
	const mockUserToken = 'user-jwt-token';
	const mockServiceToken = 'service-jwt-token';
	const mockJwtSecret = 'test-secret';
	const mockManaServiceUrl = 'https://mana-service.example.com';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CreditConsumptionService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string) => {
							const config: Record<string, string> = {
								MANA_SERVICE_URL: mockManaServiceUrl,
								MANA_JWT_SECRET: mockJwtSecret,
								MEMORO_APP_ID: 'test-app-id',
							};
							return config[key];
						}),
					},
				},
			],
		}).compile();

		service = module.get<CreditConsumptionService>(CreditConsumptionService);
		configService = module.get(ConfigService);

		// Clear mocks
		(global.fetch as jest.Mock).mockClear();
		(jwt.sign as jest.Mock).mockClear();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getServiceRoleToken', () => {
		it('should generate and cache a service role token', async () => {
			const mockToken = 'generated-service-token';
			(jwt.sign as jest.Mock).mockReturnValue(mockToken);

			// Access private method through any type casting
			const token = await (service as any).getServiceRoleToken();

			expect(token).toBe(mockToken);
			expect(jwt.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					sub: 'memoro-service',
					role: 'platform_admin',
					app_id: 'test-app-id',
					service: 'memoro-service',
				}),
				mockJwtSecret
			);
		});

		it('should reuse cached token if still valid', async () => {
			const mockToken = 'cached-service-token';
			(jwt.sign as jest.Mock).mockReturnValue(mockToken);

			// First call - generates new token
			const token1 = await (service as any).getServiceRoleToken();
			expect(jwt.sign).toHaveBeenCalledTimes(1);

			// Second call - should use cached token
			const token2 = await (service as any).getServiceRoleToken();
			expect(token1).toBe(token2);
			expect(jwt.sign).toHaveBeenCalledTimes(1); // Still only called once
		});

		it('should throw error if JWT secret is not configured', async () => {
			configService.get.mockImplementation((key: string) => {
				if (key === 'MANA_JWT_SECRET') return undefined;
				return 'value';
			});

			await expect((service as any).getServiceRoleToken()).rejects.toThrow(
				'Service role token generation failed: MANA_JWT_SECRET not configured'
			);
		});
	});

	describe('consumeCreditsForOperation', () => {
		beforeEach(() => {
			(jwt.sign as jest.Mock).mockReturnValue(mockServiceToken);
		});

		it('should successfully consume credits for an operation', async () => {
			const mockResponse: CreditConsumptionResult = {
				success: true,
				creditsConsumed: 10,
				creditType: 'user',
				remainingCredits: 90,
				message: 'Credits consumed successfully',
			};

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await service.consumeCreditsForOperation(
				mockUserId,
				'transcription',
				10,
				'Test transcription',
				{ memoId: 'memo-123' },
				undefined,
				mockUserToken
			);

			expect(result).toEqual({
				success: true,
				creditsConsumed: 10,
				creditType: 'user',
				remainingCredits: 90,
				message: 'Credits consumed successfully',
			});

			expect(global.fetch).toHaveBeenCalledWith(
				`${mockManaServiceUrl}/credits/consume`,
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${mockUserToken}`,
						'X-Service-Auth': 'memoro-service',
					},
				})
			);

			// Check body separately
			const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
			const bodyData = JSON.parse(fetchCall[1].body);
			expect(bodyData).toEqual({
				userId: mockUserId,
				amount: 10,
				operation: 'transcription',
				description: 'Test transcription',
				metadata: expect.objectContaining({
					memoId: 'memo-123',
					service: 'memoro-service',
					timestamp: expect.any(String),
				}),
				spaceId: undefined,
			});
		});

		it('should consume space credits when spaceId is provided', async () => {
			const mockResponse: CreditConsumptionResult = {
				success: true,
				creditsConsumed: 10,
				creditType: 'space',
				remainingCredits: 190,
				message: 'Credits consumed successfully',
			};

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await service.consumeCreditsForOperation(
				mockUserId,
				'transcription',
				10,
				'Test transcription',
				{},
				mockSpaceId,
				mockUserToken
			);

			expect(result.creditType).toBe('space');
			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining(`"spaceId":"${mockSpaceId}"`),
				})
			);
		});

		it('should throw BadRequestException for invalid inputs', async () => {
			await expect(
				service.consumeCreditsForOperation(
					'',
					'transcription',
					10,
					'Test',
					{},
					undefined,
					mockUserToken
				)
			).rejects.toThrow(BadRequestException);

			await expect(
				service.consumeCreditsForOperation(
					mockUserId,
					'transcription',
					0,
					'Test',
					{},
					undefined,
					mockUserToken
				)
			).rejects.toThrow(BadRequestException);

			await expect(
				service.consumeCreditsForOperation(
					mockUserId,
					'transcription',
					10,
					'Test',
					{},
					undefined,
					''
				)
			).rejects.toThrow(BadRequestException);
		});

		it('should handle insufficient credits gracefully', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: 'Bad Request',
				json: async () => ({ message: 'insufficient credits' }),
			});

			const result = await service.consumeCreditsForOperation(
				mockUserId,
				'transcription',
				100,
				'Test',
				{},
				undefined,
				mockUserToken
			);

			expect(result).toEqual({
				success: false,
				creditsConsumed: 0,
				creditType: 'user',
				message: 'Insufficient credits. Required: 100',
				error: 'insufficient credits',
			});
		});

		it('should handle server errors', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => ({ message: 'Server error' }),
			});

			const result = await service.consumeCreditsForOperation(
				mockUserId,
				'transcription',
				10,
				'Test',
				{},
				undefined,
				mockUserToken
			);

			expect(result).toEqual({
				success: false,
				creditsConsumed: 0,
				creditType: 'user',
				message: 'Credit consumption failed',
				error: 'Credit consumption failed: Server error',
			});
		});

		it('should handle network errors', async () => {
			(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

			const result = await service.consumeCreditsForOperation(
				mockUserId,
				'transcription',
				10,
				'Test',
				{},
				undefined,
				mockUserToken
			);

			expect(result).toEqual({
				success: false,
				creditsConsumed: 0,
				creditType: 'user',
				message: 'Credit consumption failed',
				error: 'Network error',
			});
		});
	});

	describe('convenience methods', () => {
		beforeEach(() => {
			jest.spyOn(service, 'consumeCreditsForOperation').mockResolvedValue({
				success: true,
				creditsConsumed: 10,
				creditType: 'user',
				message: 'Success',
			});
		});

		it('should consume transcription credits', async () => {
			await service.consumeTranscriptionCredits(
				mockUserId,
				5,
				10,
				'memo-123',
				'fast',
				mockSpaceId,
				mockUserToken
			);

			expect(service.consumeCreditsForOperation).toHaveBeenCalledWith(
				mockUserId,
				'transcription',
				10,
				'Transcription completed via fast route for memo memo-123',
				{
					memoId: 'memo-123',
					route: 'fast',
					durationMinutes: 5,
					actualCost: 10,
				},
				mockSpaceId,
				mockUserToken
			);
		});

		it('should consume question credits', async () => {
			const questionText = 'What is the main topic discussed?';

			await service.consumeQuestionCredits(
				mockUserId,
				'memo-123',
				questionText,
				mockSpaceId,
				mockUserToken
			);

			expect(service.consumeCreditsForOperation).toHaveBeenCalledWith(
				mockUserId,
				'question',
				5,
				'Question asked on memo memo-123',
				{
					memoId: 'memo-123',
					questionLength: questionText.length,
					questionPreview: questionText,
				},
				mockSpaceId,
				mockUserToken
			);
		});

		it('should consume combination credits', async () => {
			const memoIds = ['memo-1', 'memo-2', 'memo-3'];

			await service.consumeCombinationCredits(mockUserId, memoIds, mockSpaceId, mockUserToken);

			expect(service.consumeCreditsForOperation).toHaveBeenCalledWith(
				mockUserId,
				'combination',
				15, // 5 credits per memo
				'Combined 3 memos',
				{
					memoCount: 3,
					memoIds,
				},
				mockSpaceId,
				mockUserToken
			);
		});

		it('should consume blueprint credits', async () => {
			await service.consumeBlueprintCredits(
				mockUserId,
				'blueprint-123',
				'memo-123',
				mockSpaceId,
				mockUserToken
			);

			expect(service.consumeCreditsForOperation).toHaveBeenCalledWith(
				mockUserId,
				'blueprint',
				5,
				'Blueprint blueprint-123 applied to memo memo-123',
				{
					blueprintId: 'blueprint-123',
					memoId: 'memo-123',
				},
				mockSpaceId,
				mockUserToken
			);
		});

		it('should consume headline credits', async () => {
			await service.consumeHeadlineCredits(mockUserId, 'memo-123', mockSpaceId, mockUserToken);

			expect(service.consumeCreditsForOperation).toHaveBeenCalledWith(
				mockUserId,
				'headline',
				10,
				'Headline generation for memo memo-123',
				{
					memoId: 'memo-123',
				},
				mockSpaceId,
				mockUserToken
			);
		});
	});

	describe('validateCreditsForOperation', () => {
		beforeEach(() => {
			(jwt.sign as jest.Mock).mockReturnValue(mockServiceToken);
		});

		it('should validate credits successfully', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					valid: true,
					availableCredits: 100,
				}),
			});

			const result = await service.validateCreditsForOperation(
				mockUserId,
				'transcription',
				10,
				mockSpaceId
			);

			expect(result).toEqual({
				hasEnoughCredits: true,
				availableCredits: 100,
				requiredCredits: 10,
			});
		});

		it('should handle validation failure', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: 'Insufficient credits' }),
			});

			const result = await service.validateCreditsForOperation(mockUserId, 'transcription', 100);

			expect(result).toEqual({
				hasEnoughCredits: false,
				availableCredits: 0,
				requiredCredits: 100,
			});
		});
	});

	describe('getCurrentCredits', () => {
		beforeEach(() => {
			(jwt.sign as jest.Mock).mockReturnValue(mockServiceToken);
		});

		it('should get current credits for user', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ credits: 100 }),
			});

			const result = await service.getCurrentCredits(mockUserId);

			expect(result).toEqual({
				userCredits: 100,
				spaceCredits: undefined,
			});
		});

		it('should get both user and space credits', async () => {
			(global.fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ credits: 100 }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ creditSummary: { current_balance: 200 } }),
				});

			const result = await service.getCurrentCredits(mockUserId, mockSpaceId);

			expect(result).toEqual({
				userCredits: 100,
				spaceCredits: 200,
			});
		});

		it('should handle errors gracefully', async () => {
			(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

			const result = await service.getCurrentCredits(mockUserId, mockSpaceId);

			expect(result).toEqual({
				userCredits: 0,
				spaceCredits: undefined,
			});
		});
	});
});
