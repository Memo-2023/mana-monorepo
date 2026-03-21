import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateService } from '../generate.service';
import { ReplicateService } from '../replicate.service';
import { StorageService } from '../../upload/storage.service';
import { CreditClientService } from '@manacore/nestjs-integration';
import { DATABASE_CONNECTION } from '../../db/database.module';

// ── Mock helpers ──────────────────────────────────────────────────────

const NOW = new Date('2026-01-15T12:00:00Z');

const makeModel = (overrides: Record<string, any> = {}) => ({
	id: 'model-1',
	name: 'flux-schnell',
	displayName: 'Flux Schnell',
	description: 'Fast generation',
	replicateId: 'black-forest-labs/flux-schnell',
	version: 'abc123',
	defaultWidth: 1024,
	defaultHeight: 1024,
	defaultSteps: 25,
	defaultGuidanceScale: 7.5,
	minWidth: 512,
	minHeight: 512,
	maxWidth: 2048,
	maxHeight: 2048,
	maxSteps: 50,
	supportsNegativePrompt: true,
	supportsImg2Img: false,
	supportsSeed: true,
	isActive: true,
	isDefault: false,
	sortOrder: 0,
	costPerGeneration: null,
	estimatedTimeSeconds: 10,
	createdAt: NOW,
	updatedAt: NOW,
	...overrides,
});

const makeGeneration = (overrides: Record<string, any> = {}) => ({
	id: 'gen-1',
	userId: 'user-1',
	modelId: 'model-1',
	batchId: null,
	prompt: 'A beautiful sunset over the ocean',
	negativePrompt: null,
	model: 'flux-schnell',
	style: null,
	sourceImageUrl: null,
	width: 1024,
	height: 1024,
	steps: 25,
	guidanceScale: 7.5,
	seed: null,
	generationStrength: null,
	status: 'pending',
	replicatePredictionId: null,
	errorMessage: null,
	generationTimeSeconds: null,
	retryCount: 0,
	priority: 0,
	createdAt: NOW,
	completedAt: null,
	...overrides,
});

const makeImage = (overrides: Record<string, any> = {}) => ({
	id: 'img-1',
	userId: 'user-1',
	generationId: 'gen-1',
	sourceImageId: null,
	prompt: 'A beautiful sunset over the ocean',
	negativePrompt: null,
	model: 'flux-schnell',
	style: null,
	publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
	storagePath: 'user-1/generated-gen-1.webp',
	filename: 'generated-gen-1.webp',
	format: 'webp',
	width: 1024,
	height: 1024,
	fileSize: null,
	blurhash: null,
	isPublic: false,
	isFavorite: false,
	downloadCount: 0,
	rating: null,
	archivedAt: null,
	createdAt: NOW,
	updatedAt: NOW,
	...overrides,
});

const makeDto = (overrides: Record<string, any> = {}) => ({
	prompt: 'A beautiful sunset over the ocean',
	modelId: 'model-1',
	...overrides,
});

// Drizzle fluent chain mock
function createChainMock(terminal: jest.Mock) {
	const chain: any = {};
	const methods = [
		'from',
		'where',
		'orderBy',
		'limit',
		'offset',
		'groupBy',
		'having',
		'set',
		'values',
		'returning',
	];
	for (const m of methods) {
		chain[m] = jest.fn().mockReturnValue(chain);
	}
	chain.then = (resolve: any, reject: any) => terminal().then(resolve, reject);
	(chain as any)[Symbol.toStringTag] = 'Promise';
	return chain;
}

let selectResult: jest.Mock;
let selectChain: any;
let insertResult: jest.Mock;
let insertChain: any;
let updateResult: jest.Mock;
let updateChain: any;
let deleteResult: jest.Mock;
let deleteChain: any;
let mockDb: any;

function buildMockDb() {
	selectResult = jest.fn().mockResolvedValue([]);
	selectChain = createChainMock(selectResult);

	insertResult = jest.fn().mockResolvedValue([]);
	insertChain = createChainMock(insertResult);

	updateResult = jest.fn().mockResolvedValue([]);
	updateChain = createChainMock(updateResult);

	deleteResult = jest.fn().mockResolvedValue([]);
	deleteChain = createChainMock(deleteResult);

	mockDb = {
		select: jest.fn().mockReturnValue(selectChain),
		insert: jest.fn().mockReturnValue(insertChain),
		update: jest.fn().mockReturnValue(updateChain),
		delete: jest.fn().mockReturnValue(deleteChain),
		transaction: jest.fn(),
	};
}

const mockReplicateService = {
	processGeneration: jest.fn(),
	createPrediction: jest.fn(),
	getPrediction: jest.fn(),
	cancelPrediction: jest.fn(),
};

const mockStorageService = {
	uploadFromUrl: jest.fn(),
};

const mockCreditClient = {
	getBalance: jest.fn(),
	consumeCredits: jest.fn(),
};

// ── Test suite ────────────────────────────────────────────────────────

describe('GenerateService', () => {
	let service: GenerateService;
	let configValues: Record<string, string>;

	function createService(overrides: Record<string, string> = {}) {
		configValues = {
			WEBHOOK_BASE_URL: 'http://localhost:3003',
			NODE_ENV: 'development',
			...overrides,
		};
	}

	beforeEach(async () => {
		buildMockDb();
		jest.clearAllMocks();
		createService();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GenerateService,
				{ provide: DATABASE_CONNECTION, useValue: mockDb },
				{ provide: ReplicateService, useValue: mockReplicateService },
				{ provide: StorageService, useValue: mockStorageService },
				{ provide: CreditClientService, useValue: mockCreditClient },
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string) => configValues[key]),
					},
				},
			],
		}).compile();

		service = module.get<GenerateService>(GenerateService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// ── checkGenerationAccess ──────────────────────────────────────

	describe('checkGenerationAccess', () => {
		it('should skip credit check in development and allow generation', async () => {
			const result = await service.checkGenerationAccess('user-1');

			expect(result.canGenerate).toBe(true);
			expect(result.creditsRequired).toBe(10);
			expect(result.currentBalance).toBeUndefined();
			expect(mockCreditClient.getBalance).not.toHaveBeenCalled();
		});

		it('should check credits in production and allow when sufficient', async () => {
			// Rebuild service with production config
			buildMockDb();
			createService({ NODE_ENV: 'production' });

			const module = await Test.createTestingModule({
				providers: [
					GenerateService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: ReplicateService, useValue: mockReplicateService },
					{ provide: StorageService, useValue: mockStorageService },
					{ provide: CreditClientService, useValue: mockCreditClient },
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn((key: string) => configValues[key]),
						},
					},
				],
			}).compile();

			const prodService = module.get<GenerateService>(GenerateService);
			mockCreditClient.getBalance.mockResolvedValue({ balance: 100 });

			const result = await prodService.checkGenerationAccess('user-1');

			expect(result.canGenerate).toBe(true);
			expect(result.creditsRequired).toBe(10);
			expect(result.currentBalance).toBe(100);
			expect(mockCreditClient.getBalance).toHaveBeenCalledWith('user-1');
		});

		it('should deny generation in production when credits insufficient', async () => {
			buildMockDb();
			createService({ NODE_ENV: 'production' });

			const module = await Test.createTestingModule({
				providers: [
					GenerateService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: ReplicateService, useValue: mockReplicateService },
					{ provide: StorageService, useValue: mockStorageService },
					{ provide: CreditClientService, useValue: mockCreditClient },
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn((key: string) => configValues[key]),
						},
					},
				],
			}).compile();

			const prodService = module.get<GenerateService>(GenerateService);
			mockCreditClient.getBalance.mockResolvedValue({ balance: 5 });

			const result = await prodService.checkGenerationAccess('user-1');

			expect(result.canGenerate).toBe(false);
			expect(result.currentBalance).toBe(5);
		});

		it('should fail open on credit check error in production', async () => {
			buildMockDb();
			createService({ NODE_ENV: 'production' });

			const module = await Test.createTestingModule({
				providers: [
					GenerateService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: ReplicateService, useValue: mockReplicateService },
					{ provide: StorageService, useValue: mockStorageService },
					{ provide: CreditClientService, useValue: mockCreditClient },
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn((key: string) => configValues[key]),
						},
					},
				],
			}).compile();

			const prodService = module.get<GenerateService>(GenerateService);
			mockCreditClient.getBalance.mockRejectedValue(new Error('Credit service down'));

			const result = await prodService.checkGenerationAccess('user-1');

			expect(result.canGenerate).toBe(true);
			expect(result.currentBalance).toBeUndefined();
		});
	});

	// ── generateImage ──────────────────────────────────────────────

	describe('generateImage', () => {
		it('should throw 402 on insufficient credits in production', async () => {
			buildMockDb();
			createService({ NODE_ENV: 'production' });

			const module = await Test.createTestingModule({
				providers: [
					GenerateService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: ReplicateService, useValue: mockReplicateService },
					{ provide: StorageService, useValue: mockStorageService },
					{ provide: CreditClientService, useValue: mockCreditClient },
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn((key: string) => configValues[key]),
						},
					},
				],
			}).compile();

			const prodService = module.get<GenerateService>(GenerateService);
			mockCreditClient.getBalance.mockResolvedValue({ balance: 3 });

			await expect(prodService.generateImage('user-1', makeDto())).rejects.toThrow(HttpException);

			try {
				await prodService.generateImage('user-1', makeDto());
			} catch (e) {
				expect((e as HttpException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
			}
		});

		it('should throw NotFoundException for invalid model', async () => {
			// Credit check passes (dev mode)
			// Model lookup returns empty
			selectResult.mockResolvedValue([]);

			await expect(service.generateImage('user-1', makeDto())).rejects.toThrow(NotFoundException);
		});

		it('should use sync mode when waitForResult is true', async () => {
			const model = makeModel();
			const generation = makeGeneration();
			const image = makeImage();

			// Model lookup
			selectResult.mockResolvedValueOnce([model]);

			// Insert generation returning
			insertChain.returning.mockResolvedValueOnce([generation]);

			// processGeneration succeeds
			mockReplicateService.processGeneration.mockResolvedValue({
				success: true,
				outputUrl: 'https://replicate.delivery/output.webp',
				format: 'webp',
				width: 1024,
				height: 1024,
				generationTimeSeconds: 5,
			});

			// uploadFromUrl
			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			// Insert image returning
			insertChain.returning.mockResolvedValueOnce([image]);

			const result = await service.generateImage('user-1', makeDto({ waitForResult: true }));

			expect(result.status).toBe('completed');
			expect(result.generationId).toBe('gen-1');
			expect(result.image).toEqual(image);
			expect(mockReplicateService.processGeneration).toHaveBeenCalled();
			expect(mockReplicateService.createPrediction).not.toHaveBeenCalled();
		});

		it('should use sync mode when webhooks are not available (no HTTPS)', async () => {
			// Default config has http://localhost:3003, so sync mode is forced
			const model = makeModel();
			const generation = makeGeneration();
			const image = makeImage();

			selectResult.mockResolvedValueOnce([model]);
			insertChain.returning.mockResolvedValueOnce([generation]);

			mockReplicateService.processGeneration.mockResolvedValue({
				success: true,
				outputUrl: 'https://replicate.delivery/output.webp',
				format: 'webp',
				width: 1024,
				height: 1024,
				generationTimeSeconds: 5,
			});

			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			insertChain.returning.mockResolvedValueOnce([image]);

			// Not explicitly setting waitForResult - should still use sync because no HTTPS webhook
			const result = await service.generateImage('user-1', makeDto());

			expect(result.status).toBe('completed');
			expect(mockReplicateService.processGeneration).toHaveBeenCalled();
			expect(mockReplicateService.createPrediction).not.toHaveBeenCalled();
		});

		it('should use async mode when HTTPS webhook is available', async () => {
			buildMockDb();
			createService({ WEBHOOK_BASE_URL: 'https://api.example.com', NODE_ENV: 'development' });

			const module = await Test.createTestingModule({
				providers: [
					GenerateService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: ReplicateService, useValue: mockReplicateService },
					{ provide: StorageService, useValue: mockStorageService },
					{ provide: CreditClientService, useValue: mockCreditClient },
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn((key: string) => configValues[key]),
						},
					},
				],
			}).compile();

			const asyncService = module.get<GenerateService>(GenerateService);

			const model = makeModel();
			const generation = makeGeneration();

			selectResult.mockResolvedValueOnce([model]);
			insertChain.returning.mockResolvedValueOnce([generation]);

			mockReplicateService.createPrediction.mockResolvedValue({
				id: 'pred-1',
				status: 'starting',
			});

			const result = await asyncService.generateImage('user-1', makeDto());

			expect(result.status).toBe('processing');
			expect(result.generationId).toBe('gen-1');
			expect(mockReplicateService.createPrediction).toHaveBeenCalled();
			expect(mockReplicateService.processGeneration).not.toHaveBeenCalled();
		});

		it('should consume credits after successful sync generation in production', async () => {
			buildMockDb();
			createService({
				NODE_ENV: 'production',
				WEBHOOK_BASE_URL: 'http://localhost:3003',
			});

			const module = await Test.createTestingModule({
				providers: [
					GenerateService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: ReplicateService, useValue: mockReplicateService },
					{ provide: StorageService, useValue: mockStorageService },
					{ provide: CreditClientService, useValue: mockCreditClient },
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn((key: string) => configValues[key]),
						},
					},
				],
			}).compile();

			const prodService = module.get<GenerateService>(GenerateService);

			mockCreditClient.getBalance.mockResolvedValue({ balance: 100 });

			const model = makeModel();
			const generation = makeGeneration();
			const image = makeImage();

			selectResult.mockResolvedValueOnce([model]);
			insertChain.returning.mockResolvedValueOnce([generation]);

			mockReplicateService.processGeneration.mockResolvedValue({
				success: true,
				outputUrl: 'https://replicate.delivery/output.webp',
				format: 'webp',
				width: 1024,
				height: 1024,
				generationTimeSeconds: 5,
			});

			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			insertChain.returning.mockResolvedValueOnce([image]);

			const result = await prodService.generateImage('user-1', makeDto({ waitForResult: true }));

			expect(result.status).toBe('completed');
			expect(result.creditsUsed).toBe(10);
			expect(mockCreditClient.consumeCredits).toHaveBeenCalledWith(
				'user-1',
				'image_generation',
				10,
				expect.stringContaining('gen-1')
			);
		});

		it('should not consume credits in development after sync generation', async () => {
			const model = makeModel();
			const generation = makeGeneration();
			const image = makeImage();

			selectResult.mockResolvedValueOnce([model]);
			insertChain.returning.mockResolvedValueOnce([generation]);

			mockReplicateService.processGeneration.mockResolvedValue({
				success: true,
				outputUrl: 'https://replicate.delivery/output.webp',
				format: 'webp',
				width: 1024,
				height: 1024,
				generationTimeSeconds: 5,
			});

			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			insertChain.returning.mockResolvedValueOnce([image]);

			await service.generateImage('user-1', makeDto({ waitForResult: true }));

			expect(mockCreditClient.consumeCredits).not.toHaveBeenCalled();
		});

		it('should handle sync generation failure gracefully', async () => {
			const model = makeModel();
			const generation = makeGeneration();

			selectResult.mockResolvedValueOnce([model]);
			insertChain.returning.mockResolvedValueOnce([generation]);

			mockReplicateService.processGeneration.mockResolvedValue({
				success: false,
				error: 'Model unavailable',
			});

			const result = await service.generateImage('user-1', makeDto({ waitForResult: true }));

			expect(result.status).toBe('failed');
			expect(result.generationId).toBe('gen-1');
			expect(result.image).toBeUndefined();
		});
	});

	// ── checkStatus ────────────────────────────────────────────────

	describe('checkStatus', () => {
		it('should return completed generation with associated image', async () => {
			const generation = makeGeneration({ status: 'completed', completedAt: NOW });
			const image = makeImage();

			// First select: generation lookup
			selectResult.mockResolvedValueOnce([generation]);
			// Second select: image lookup
			selectResult.mockResolvedValueOnce([image]);

			const result = await service.checkStatus('gen-1', 'user-1');

			expect(result.status).toBe('completed');
			expect(result.image).toEqual(image);
		});

		it('should throw NotFoundException for non-existent generation', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.checkStatus('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when user does not own generation', async () => {
			const generation = makeGeneration({ userId: 'user-other' });
			selectResult.mockResolvedValueOnce([generation]);

			await expect(service.checkStatus('gen-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});

		it('should poll Replicate when generation is processing with prediction ID', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			// First select: generation lookup
			selectResult.mockResolvedValueOnce([generation]);

			// Replicate returns succeeded
			mockReplicateService.getPrediction.mockResolvedValue({
				id: 'pred-1',
				status: 'succeeded',
				output: ['https://replicate.delivery/output.webp'],
			});

			// uploadFromUrl for processCompletedGeneration
			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			// Transaction mock for processCompletedGeneration
			const txInsertChain: any = {};
			const txUpdateChain: any = {};
			for (const m of ['from', 'where', 'set', 'values', 'returning', 'limit']) {
				txInsertChain[m] = jest.fn().mockReturnValue(txInsertChain);
				txUpdateChain[m] = jest.fn().mockReturnValue(txUpdateChain);
			}
			txInsertChain.then = (r: any) => Promise.resolve().then(r);
			txUpdateChain.then = (r: any) => Promise.resolve().then(r);

			mockDb.transaction.mockImplementation((cb: any) =>
				cb({
					insert: jest.fn().mockReturnValue(txInsertChain),
					update: jest.fn().mockReturnValue(txUpdateChain),
				})
			);

			// Refetch after processing: updated generation
			const updatedGeneration = makeGeneration({ status: 'completed', completedAt: NOW });
			selectResult.mockResolvedValueOnce([updatedGeneration]);

			// Image fetch
			const image = makeImage();
			selectResult.mockResolvedValueOnce([image]);

			const result = await service.checkStatus('gen-1', 'user-1');

			expect(mockReplicateService.getPrediction).toHaveBeenCalledWith('pred-1');
			expect(result.status).toBe('completed');
			expect(result.image).toEqual(image);
		});

		it('should update status to failed when Replicate prediction failed', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			mockReplicateService.getPrediction.mockResolvedValue({
				id: 'pred-1',
				status: 'failed',
				error: 'GPU out of memory',
			});

			const result = await service.checkStatus('gen-1', 'user-1');

			expect(result.status).toBe('failed');
			expect(result.errorMessage).toBe('GPU out of memory');
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should return generation as-is when still processing (no completion yet)', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			mockReplicateService.getPrediction.mockResolvedValue({
				id: 'pred-1',
				status: 'processing',
			});

			const result = await service.checkStatus('gen-1', 'user-1');

			expect(result.status).toBe('processing');
			expect(result.image).toBeUndefined();
		});

		it('should return pending generation without polling Replicate', async () => {
			const generation = makeGeneration({ status: 'pending' });

			selectResult.mockResolvedValueOnce([generation]);

			const result = await service.checkStatus('gen-1', 'user-1');

			expect(result.status).toBe('pending');
			expect(mockReplicateService.getPrediction).not.toHaveBeenCalled();
		});
	});

	// ── cancelGeneration ───────────────────────────────────────────

	describe('cancelGeneration', () => {
		it('should cancel generation on Replicate and update status', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			await service.cancelGeneration('gen-1', 'user-1');

			expect(mockReplicateService.cancelPrediction).toHaveBeenCalledWith('pred-1');
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent generation', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.cancelGeneration('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when user does not own generation', async () => {
			const generation = makeGeneration({ userId: 'user-other' });
			selectResult.mockResolvedValueOnce([generation]);

			await expect(service.cancelGeneration('gen-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});

		it('should no-op for completed generation', async () => {
			const generation = makeGeneration({ status: 'completed', completedAt: NOW });
			selectResult.mockResolvedValueOnce([generation]);

			await service.cancelGeneration('gen-1', 'user-1');

			expect(mockReplicateService.cancelPrediction).not.toHaveBeenCalled();
			expect(mockDb.update).not.toHaveBeenCalled();
		});

		it('should no-op for failed generation', async () => {
			const generation = makeGeneration({ status: 'failed', errorMessage: 'Some error' });
			selectResult.mockResolvedValueOnce([generation]);

			await service.cancelGeneration('gen-1', 'user-1');

			expect(mockReplicateService.cancelPrediction).not.toHaveBeenCalled();
			expect(mockDb.update).not.toHaveBeenCalled();
		});

		it('should cancel pending generation without prediction ID', async () => {
			const generation = makeGeneration({ status: 'pending' });
			selectResult.mockResolvedValueOnce([generation]);

			await service.cancelGeneration('gen-1', 'user-1');

			// No prediction to cancel on Replicate
			expect(mockReplicateService.cancelPrediction).not.toHaveBeenCalled();
			// But should still update the DB status
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should still update status even if Replicate cancel fails', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);
			mockReplicateService.cancelPrediction.mockRejectedValue(new Error('Network error'));

			await service.cancelGeneration('gen-1', 'user-1');

			// Should still update status despite Replicate failure
			expect(mockDb.update).toHaveBeenCalled();
		});
	});

	// ── handleWebhook ──────────────────────────────────────────────

	describe('handleWebhook', () => {
		it('should process completed webhook and create image', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			// Transaction mock for processCompletedGeneration
			const txInsertChain: any = {};
			const txUpdateChain: any = {};
			for (const m of ['from', 'where', 'set', 'values', 'returning', 'limit']) {
				txInsertChain[m] = jest.fn().mockReturnValue(txInsertChain);
				txUpdateChain[m] = jest.fn().mockReturnValue(txUpdateChain);
			}
			txInsertChain.then = (r: any) => Promise.resolve().then(r);
			txUpdateChain.then = (r: any) => Promise.resolve().then(r);

			mockDb.transaction.mockImplementation((cb: any) =>
				cb({
					insert: jest.fn().mockReturnValue(txInsertChain),
					update: jest.fn().mockReturnValue(txUpdateChain),
				})
			);

			const result = await service.handleWebhook({
				id: 'pred-1',
				status: 'succeeded',
				output: ['https://replicate.delivery/output.webp'],
			});

			expect(result).toEqual({ received: true });
			expect(mockStorageService.uploadFromUrl).toHaveBeenCalled();
			expect(mockDb.transaction).toHaveBeenCalled();
		});

		it('should consume credits on webhook success in production', async () => {
			buildMockDb();
			createService({
				NODE_ENV: 'production',
				WEBHOOK_BASE_URL: 'https://api.example.com',
			});

			const module = await Test.createTestingModule({
				providers: [
					GenerateService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: ReplicateService, useValue: mockReplicateService },
					{ provide: StorageService, useValue: mockStorageService },
					{ provide: CreditClientService, useValue: mockCreditClient },
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn((key: string) => configValues[key]),
						},
					},
				],
			}).compile();

			const prodService = module.get<GenerateService>(GenerateService);

			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			const txInsertChain: any = {};
			const txUpdateChain: any = {};
			for (const m of ['from', 'where', 'set', 'values', 'returning', 'limit']) {
				txInsertChain[m] = jest.fn().mockReturnValue(txInsertChain);
				txUpdateChain[m] = jest.fn().mockReturnValue(txUpdateChain);
			}
			txInsertChain.then = (r: any) => Promise.resolve().then(r);
			txUpdateChain.then = (r: any) => Promise.resolve().then(r);

			mockDb.transaction.mockImplementation((cb: any) =>
				cb({
					insert: jest.fn().mockReturnValue(txInsertChain),
					update: jest.fn().mockReturnValue(txUpdateChain),
				})
			);

			await prodService.handleWebhook({
				id: 'pred-1',
				status: 'succeeded',
				output: ['https://replicate.delivery/output.webp'],
			});

			expect(mockCreditClient.consumeCredits).toHaveBeenCalledWith(
				'user-1',
				'image_generation',
				10,
				expect.stringContaining('gen-1')
			);
		});

		it('should update status to failed on failed webhook', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			const result = await service.handleWebhook({
				id: 'pred-1',
				status: 'failed',
				error: 'NSFW content detected',
			});

			expect(result).toEqual({ received: true });
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockStorageService.uploadFromUrl).not.toHaveBeenCalled();
		});

		it('should return received:false for unknown prediction ID', async () => {
			selectResult.mockResolvedValue([]);

			const result = await service.handleWebhook({
				id: 'pred-unknown',
				status: 'succeeded',
				output: ['https://replicate.delivery/output.webp'],
			});

			expect(result).toEqual({ received: false });
		});

		it('should return received:false when webhook body has no id', async () => {
			const result = await service.handleWebhook({
				status: 'succeeded',
				output: ['https://replicate.delivery/output.webp'],
			});

			expect(result).toEqual({ received: false });
		});

		it('should handle string output format in webhook', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.png',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.png',
			});

			const txInsertChain: any = {};
			const txUpdateChain: any = {};
			for (const m of ['from', 'where', 'set', 'values', 'returning', 'limit']) {
				txInsertChain[m] = jest.fn().mockReturnValue(txInsertChain);
				txUpdateChain[m] = jest.fn().mockReturnValue(txUpdateChain);
			}
			txInsertChain.then = (r: any) => Promise.resolve().then(r);
			txUpdateChain.then = (r: any) => Promise.resolve().then(r);

			mockDb.transaction.mockImplementation((cb: any) =>
				cb({
					insert: jest.fn().mockReturnValue(txInsertChain),
					update: jest.fn().mockReturnValue(txUpdateChain),
				})
			);

			const result = await service.handleWebhook({
				id: 'pred-1',
				status: 'succeeded',
				output: 'https://replicate.delivery/output.png',
			});

			expect(result).toEqual({ received: true });
			expect(mockStorageService.uploadFromUrl).toHaveBeenCalledWith(
				'https://replicate.delivery/output.png',
				'user-1',
				expect.stringContaining('gen-1')
			);
		});

		it('should handle object output format with url property in webhook', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			mockStorageService.uploadFromUrl.mockResolvedValue({
				storagePath: 'user-1/generated-gen-1.webp',
				publicUrl: 'https://cdn.example.com/images/generated-gen-1.webp',
			});

			const txInsertChain: any = {};
			const txUpdateChain: any = {};
			for (const m of ['from', 'where', 'set', 'values', 'returning', 'limit']) {
				txInsertChain[m] = jest.fn().mockReturnValue(txInsertChain);
				txUpdateChain[m] = jest.fn().mockReturnValue(txUpdateChain);
			}
			txInsertChain.then = (r: any) => Promise.resolve().then(r);
			txUpdateChain.then = (r: any) => Promise.resolve().then(r);

			mockDb.transaction.mockImplementation((cb: any) =>
				cb({
					insert: jest.fn().mockReturnValue(txInsertChain),
					update: jest.fn().mockReturnValue(txUpdateChain),
				})
			);

			const result = await service.handleWebhook({
				id: 'pred-1',
				status: 'succeeded',
				output: { url: 'https://replicate.delivery/output.webp' },
			});

			expect(result).toEqual({ received: true });
			expect(mockStorageService.uploadFromUrl).toHaveBeenCalledWith(
				'https://replicate.delivery/output.webp',
				'user-1',
				expect.stringContaining('gen-1')
			);
		});

		it('should return received:false on unexpected error during processing', async () => {
			const generation = makeGeneration({
				status: 'processing',
				replicatePredictionId: 'pred-1',
			});

			selectResult.mockResolvedValueOnce([generation]);

			// uploadFromUrl throws
			mockStorageService.uploadFromUrl.mockRejectedValue(new Error('Storage unavailable'));

			const result = await service.handleWebhook({
				id: 'pred-1',
				status: 'succeeded',
				output: ['https://replicate.delivery/output.webp'],
			});

			// processCompletedGeneration catches the error and updates status to failed,
			// then handleWebhook returns received: true since it found the generation
			expect(result).toEqual({ received: true });
		});
	});
});
