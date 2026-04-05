import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

import { chatService, type Conversation } from './chat';

const mockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
	id: 'conv-1',
	userId: 'u-1',
	title: 'Test Chat',
	modelId: 'gpt-4',
	conversationMode: 'free',
	documentMode: false,
	isArchived: false,
	isPinned: false,
	createdAt: '2026-01-01',
	updatedAt: '2026-03-01',
	...overrides,
});

describe('chatService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getRecentConversations', () => {
		it('should fetch and sort conversations by updatedAt', async () => {
			const conversations = [
				mockConversation({ id: 'c-1', updatedAt: '2026-01-01' }),
				mockConversation({ id: 'c-2', updatedAt: '2026-03-01' }),
				mockConversation({ id: 'c-3', updatedAt: '2026-02-01' }),
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(conversations),
			});

			const result = await chatService.getRecentConversations(5);

			expect(result.data).toHaveLength(3);
			expect(result.data![0].id).toBe('c-2'); // Most recent first
			expect(result.data![1].id).toBe('c-3');
			expect(result.data![2].id).toBe('c-1');
		});

		it('should filter out archived conversations', async () => {
			const conversations = [
				mockConversation({ id: 'c-1', isArchived: false }),
				mockConversation({ id: 'c-2', isArchived: true }),
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(conversations),
			});

			const result = await chatService.getRecentConversations();

			expect(result.data).toHaveLength(1);
			expect(result.data![0].id).toBe('c-1');
		});

		it('should respect limit parameter', async () => {
			const conversations = Array.from({ length: 10 }, (_, i) =>
				mockConversation({ id: `c-${i}`, updatedAt: `2026-03-${String(i + 1).padStart(2, '0')}` })
			);
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(conversations),
			});

			const result = await chatService.getRecentConversations(3);

			expect(result.data).toHaveLength(3);
		});
	});

	describe('getPinnedConversations', () => {
		it('should return only pinned non-archived conversations', async () => {
			const conversations = [
				mockConversation({ id: 'c-1', isPinned: true, isArchived: false }),
				mockConversation({ id: 'c-2', isPinned: false }),
				mockConversation({ id: 'c-3', isPinned: true, isArchived: true }),
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(conversations),
			});

			const result = await chatService.getPinnedConversations();

			expect(result.data).toHaveLength(1);
			expect(result.data![0].id).toBe('c-1');
		});
	});

	describe('getConversationCount', () => {
		it('should count active and pinned conversations', async () => {
			const conversations = [
				mockConversation({ isPinned: true, isArchived: false }),
				mockConversation({ isPinned: false, isArchived: false }),
				mockConversation({ isPinned: true, isArchived: true }),
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(conversations),
			});

			const result = await chatService.getConversationCount();

			expect(result.data).toEqual({ total: 2, pinned: 1 });
		});
	});

	describe('getModels', () => {
		it('should fetch AI models', async () => {
			const models = [{ id: 'm-1', name: 'GPT-4', description: 'Advanced model' }];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(models),
			});

			const result = await chatService.getModels();

			expect(result.data).toEqual(models);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/chat/models'),
				expect.any(Object)
			);
		});
	});
});
