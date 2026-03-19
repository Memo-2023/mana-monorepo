import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { TokenService } from '../token/token.service';

describe('AiService', () => {
	let service: AiService;
	let tokenService: any;
	let configService: any;

	const TEST_USER_ID = 'test-user-123';

	beforeEach(async () => {
		tokenService = {
			calculateCost: jest.fn().mockResolvedValue({
				inputTokens: 100,
				outputTokens: 200,
				totalTokens: 300,
				costUsd: 0.007,
				appTokens: 1,
			}),
			hasEnoughTokens: jest.fn().mockResolvedValue(true),
			logUsage: jest.fn().mockResolvedValue({
				tokensUsed: 1,
				remainingBalance: 999,
			}),
			getBalance: jest.fn().mockResolvedValue(1000),
		};

		configService = {
			get: jest.fn().mockReturnValue(''),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AiService,
				{ provide: TokenService, useValue: tokenService },
				{ provide: ConfigService, useValue: configService },
			],
		}).compile();

		service = module.get<AiService>(AiService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('generate', () => {
		it('should throw BadRequestException when user has insufficient tokens', async () => {
			tokenService.hasEnoughTokens.mockResolvedValueOnce(false);

			await expect(service.generate(TEST_USER_ID, { prompt: 'Hello' })).rejects.toThrow(
				BadRequestException
			);
		});

		it('should check token balance before generating', async () => {
			// Mock fetch to fail (we just want to test the token check)
			const originalFetch = global.fetch;
			global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

			try {
				await service.generate(TEST_USER_ID, { prompt: 'Hello' });
			} catch {
				// Expected to fail since fetch is mocked
			}

			expect(tokenService.calculateCost).toHaveBeenCalled();
			expect(tokenService.hasEnoughTokens).toHaveBeenCalled();

			global.fetch = originalFetch;
		});

		it('should use gpt-4.1 as default model', async () => {
			const originalFetch = global.fetch;
			global.fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						choices: [{ message: { content: 'Generated text' } }],
					}),
			});

			const result = await service.generate(TEST_USER_ID, { prompt: 'Hello' });

			expect(result.text).toBe('Generated text');
			expect(tokenService.logUsage).toHaveBeenCalledWith(
				TEST_USER_ID,
				'gpt-4.1',
				expect.any(Number),
				expect.any(Number),
				undefined
			);

			global.fetch = originalFetch;
		});

		it('should use Google provider for gemini models', async () => {
			const originalFetch = global.fetch;
			global.fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
					}),
			});

			const result = await service.generate(TEST_USER_ID, {
				prompt: 'Hello',
				model: 'gemini-pro',
			});

			expect(result.text).toBe('Gemini response');
			expect(tokenService.logUsage).toHaveBeenCalledWith(
				TEST_USER_ID,
				'gemini-pro',
				expect.any(Number),
				expect.any(Number),
				undefined
			);

			global.fetch = originalFetch;
		});

		it('should include referenced documents in prompt', async () => {
			const originalFetch = global.fetch;
			global.fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						choices: [{ message: { content: 'Response with refs' } }],
					}),
			});

			await service.generate(TEST_USER_ID, {
				prompt: 'Summarize',
				referencedDocuments: [
					{ title: 'Doc 1', content: 'Content 1' },
					{ title: 'Doc 2', content: 'Content 2' },
				],
			});

			const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
			const body = JSON.parse(fetchCall[1].body);
			const userMessage = body.messages[1].content;
			expect(userMessage).toContain('Dokument 1 (Doc 1)');
			expect(userMessage).toContain('Dokument 2 (Doc 2)');

			global.fetch = originalFetch;
		});

		it('should pass documentId to logUsage', async () => {
			const originalFetch = global.fetch;
			global.fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						choices: [{ message: { content: 'Response' } }],
					}),
			});

			await service.generate(TEST_USER_ID, {
				prompt: 'Hello',
				documentId: 'doc-123',
			});

			expect(tokenService.logUsage).toHaveBeenCalledWith(
				TEST_USER_ID,
				'gpt-4.1',
				expect.any(Number),
				expect.any(Number),
				'doc-123'
			);

			global.fetch = originalFetch;
		});

		it('should return token info in response', async () => {
			const originalFetch = global.fetch;
			global.fetch = jest.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						choices: [{ message: { content: 'Response' } }],
					}),
			});

			const result = await service.generate(TEST_USER_ID, { prompt: 'Hello' });

			expect(result.tokenInfo).toBeDefined();
			expect(result.tokenInfo.tokensUsed).toBe(1);
			expect(result.tokenInfo.remainingTokens).toBe(999);

			global.fetch = originalFetch;
		});
	});

	describe('estimateCost', () => {
		it('should return cost estimate with balance check', async () => {
			const result = await service.estimateCost(TEST_USER_ID, {
				prompt: 'Hello world',
				model: 'gpt-4.1',
			});

			expect(result.hasEnough).toBe(true);
			expect(result.balance).toBe(1000);
			expect(result.estimate).toBeDefined();
		});

		it('should account for referenced documents in estimate', async () => {
			await service.estimateCost(TEST_USER_ID, {
				prompt: 'Summarize',
				referencedDocuments: [{ title: 'Doc 1', content: 'Long content here' }],
			});

			expect(tokenService.calculateCost).toHaveBeenCalled();
		});

		it('should return hasEnough=false when balance is insufficient', async () => {
			tokenService.getBalance.mockResolvedValueOnce(0);

			const result = await service.estimateCost(TEST_USER_ID, {
				prompt: 'Hello',
			});

			expect(result.hasEnough).toBe(false);
		});
	});
});
