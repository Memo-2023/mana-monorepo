import { v4 as uuidv4 } from 'uuid';
import type { Space } from '../../db/schema/spaces.schema';
import type { Document } from '../../db/schema/documents.schema';
import type { TokenTransaction } from '../../db/schema/token-transactions.schema';
import type { ModelPrice } from '../../db/schema/model-prices.schema';
import type { UserToken } from '../../db/schema/user-tokens.schema';

export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_EMAIL = 'test@example.com';

export function createMockSpace(overrides: Partial<Space> = {}): Space {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		name: 'Test Space',
		description: 'A test space',
		settings: null,
		pinned: true,
		prefix: 'T',
		textDocCounter: 0,
		contextDocCounter: 0,
		promptDocCounter: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

export function createMockDocument(overrides: Partial<Document> = {}): Document {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		spaceId: uuidv4(),
		title: 'Test Document',
		content: 'This is test content for the document.',
		type: 'text',
		shortId: 'DOC-abc123',
		pinned: false,
		metadata: { word_count: 7, token_count: 10 },
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

export function createMockTokenTransaction(
	overrides: Partial<TokenTransaction> = {}
): TokenTransaction {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		amount: -5,
		transactionType: 'usage',
		modelUsed: 'gpt-4.1',
		promptTokens: 100,
		completionTokens: 200,
		totalTokens: 300,
		costUsd: '0.004000',
		documentId: null,
		createdAt: new Date(),
		...overrides,
	};
}

export function createMockModelPrice(overrides: Partial<ModelPrice> = {}): ModelPrice {
	return {
		id: uuidv4(),
		modelName: 'gpt-4.1',
		inputPricePer1kTokens: '0.010000',
		outputPricePer1kTokens: '0.030000',
		tokensPerDollar: 50000,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

export function createMockUserToken(overrides: Partial<UserToken> = {}): UserToken {
	return {
		userId: TEST_USER_ID,
		tokenBalance: 1000,
		monthlyFreeTokens: 1000,
		lastTokenReset: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}
