import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from '../conversation.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

describe('ConversationService', () => {
	let service: ConversationService;
	let mockDb: any;

	const userId = 'user-123';
	const conversationId = 'conv-abc-123';
	const modelId = 'model-456';

	const mockConversation = {
		id: conversationId,
		userId,
		modelId,
		templateId: null,
		spaceId: null,
		title: 'Test Conversation',
		conversationMode: 'free' as const,
		documentMode: false,
		isArchived: false,
		isPinned: false,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
	};

	const mockMessage = {
		id: 'msg-001',
		conversationId,
		sender: 'user' as const,
		messageText: 'Hello, world!',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ConversationService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<ConversationService>(ConversationService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getConversations', () => {
		it('should return non-archived conversations for a user', async () => {
			const conversations = [
				mockConversation,
				{ ...mockConversation, id: 'conv-2', title: 'Second' },
			];
			mockDb.orderBy.mockResolvedValue(conversations);

			const result = await service.getConversations(userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].id).toBe(conversationId);
			}
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should filter by spaceId when provided', async () => {
			const spaceId = 'space-789';
			const spaceConversation = { ...mockConversation, spaceId };
			mockDb.orderBy.mockResolvedValue([spaceConversation]);

			const result = await service.getConversations(userId, spaceId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].spaceId).toBe(spaceId);
			}
		});

		it('should return empty array when no conversations exist', async () => {
			mockDb.orderBy.mockResolvedValue([]);

			const result = await service.getConversations(userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
			}
		});

		it('should return error on database failure', async () => {
			mockDb.orderBy.mockRejectedValue(new Error('DB connection failed'));

			const result = await service.getConversations(userId);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Failed to fetch conversations');
			}
		});
	});

	describe('getArchivedConversations', () => {
		it('should return archived conversations for a user', async () => {
			const archivedConv = { ...mockConversation, isArchived: true };
			mockDb.orderBy.mockResolvedValue([archivedConv]);

			const result = await service.getArchivedConversations(userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].isArchived).toBe(true);
			}
		});

		it('should return error on database failure', async () => {
			mockDb.orderBy.mockRejectedValue(new Error('DB error'));

			const result = await service.getArchivedConversations(userId);

			expect(result.ok).toBe(false);
		});
	});

	describe('getConversation', () => {
		it('should return a conversation when found', async () => {
			mockDb.limit.mockResolvedValue([mockConversation]);

			const result = await service.getConversation(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.id).toBe(conversationId);
				expect(result.value.userId).toBe(userId);
			}
		});

		it('should return NotFoundError when conversation does not exist', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.getConversation('nonexistent', userId);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Conversation');
			}
		});

		it('should return error on database failure', async () => {
			mockDb.limit.mockRejectedValue(new Error('DB error'));

			const result = await service.getConversation(conversationId, userId);

			expect(result.ok).toBe(false);
		});
	});

	describe('createConversation', () => {
		it('should create a conversation with default title', async () => {
			const newConv = { ...mockConversation, title: 'Neue Unterhaltung' };
			mockDb.returning.mockResolvedValue([newConv]);

			const result = await service.createConversation(userId, modelId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.userId).toBe(userId);
				expect(result.value.title).toBe('Neue Unterhaltung');
			}
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should create a conversation with custom options', async () => {
			const customConv = {
				...mockConversation,
				title: 'Custom Title',
				conversationMode: 'guided' as const,
				documentMode: true,
				spaceId: 'space-123',
			};
			mockDb.returning.mockResolvedValue([customConv]);

			const result = await service.createConversation(userId, modelId, {
				title: 'Custom Title',
				conversationMode: 'guided',
				documentMode: true,
				spaceId: 'space-123',
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.title).toBe('Custom Title');
				expect(result.value.conversationMode).toBe('guided');
				expect(result.value.documentMode).toBe(true);
				expect(result.value.spaceId).toBe('space-123');
			}
		});

		it('should return error on database failure', async () => {
			mockDb.returning.mockRejectedValue(new Error('DB error'));

			const result = await service.createConversation(userId, modelId);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Failed to create conversation');
			}
		});
	});

	describe('addMessage', () => {
		it('should add a message to a valid conversation', async () => {
			// getConversation uses select().from().where().limit()
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			// insert().values().returning() for the message
			mockDb.returning.mockResolvedValueOnce([mockMessage]);
			// update().set().where() for updatedAt - the chain ends at where()
			// where() already returns this, which is fine for an awaited non-returning update

			const result = await service.addMessage(conversationId, userId, 'user', 'Hello, world!');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.messageText).toBe('Hello, world!');
				expect(result.value.sender).toBe('user');
			}
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.addMessage('nonexistent', userId, 'user', 'Hello');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Conversation');
			}
		});

		it('should return error on database failure during insert', async () => {
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			mockDb.returning.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.addMessage(conversationId, userId, 'assistant', 'Response');

			expect(result.ok).toBe(false);
		});
	});

	describe('getMessages', () => {
		it('should return messages for a valid conversation', async () => {
			const msgs = [
				mockMessage,
				{ ...mockMessage, id: 'msg-002', sender: 'assistant', messageText: 'Hi there!' },
			];
			// getConversation uses select().from().where().limit()
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			// select().from().where().orderBy() for messages
			mockDb.orderBy.mockResolvedValueOnce(msgs);

			const result = await service.getMessages(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].sender).toBe('user');
				expect(result.value[1].sender).toBe('assistant');
			}
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.getMessages('nonexistent', userId);

			expect(result.ok).toBe(false);
		});
	});

	describe('updateTitle', () => {
		it('should update conversation title', async () => {
			const updatedConv = { ...mockConversation, title: 'New Title' };
			// getConversation call
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			// update().set().where().returning()
			mockDb.returning.mockResolvedValueOnce([updatedConv]);

			const result = await service.updateTitle(conversationId, userId, 'New Title');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.title).toBe('New Title');
			}
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.updateTitle('nonexistent', userId, 'New Title');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Conversation');
			}
		});

		it('should return error on database failure', async () => {
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			mockDb.returning.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.updateTitle(conversationId, userId, 'New Title');

			expect(result.ok).toBe(false);
		});
	});

	describe('archiveConversation', () => {
		it('should archive a conversation', async () => {
			const archivedConv = { ...mockConversation, isArchived: true };
			// getConversation call
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			// update().set().where().returning()
			mockDb.returning.mockResolvedValueOnce([archivedConv]);

			const result = await service.archiveConversation(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.isArchived).toBe(true);
			}
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.archiveConversation('nonexistent', userId);

			expect(result.ok).toBe(false);
		});
	});

	describe('unarchiveConversation', () => {
		it('should unarchive a conversation', async () => {
			const unarchivedConv = { ...mockConversation, isArchived: false };
			// Direct select query uses select().from().where().limit()
			mockDb.limit.mockResolvedValueOnce([{ ...mockConversation, isArchived: true }]);
			// update().set().where().returning()
			mockDb.returning.mockResolvedValueOnce([unarchivedConv]);

			const result = await service.unarchiveConversation(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.isArchived).toBe(false);
			}
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.unarchiveConversation('nonexistent', userId);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Conversation');
			}
		});
	});

	describe('deleteConversation', () => {
		it('should delete a conversation', async () => {
			// getConversation call
			mockDb.limit.mockResolvedValueOnce([mockConversation]);

			const result = await service.deleteConversation(conversationId, userId);

			expect(result.ok).toBe(true);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.deleteConversation('nonexistent', userId);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Conversation');
			}
		});

		it('should return error on database failure', async () => {
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			// delete() is called after getConversation succeeds; make the delete chain throw
			mockDb.delete.mockImplementationOnce(() => {
				throw new Error('DB error');
			});

			const result = await service.deleteConversation(conversationId, userId);

			expect(result.ok).toBe(false);
		});
	});

	describe('getMessageCount', () => {
		it('should return the message count for a conversation', async () => {
			// getConversation: select().from().where().limit() - limit is terminal
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			// count query: select().from().where() - where is terminal
			// Use mockReturnValueOnce(mockDb) for the first where() call (getConversation chain),
			// then mockResolvedValueOnce for the second where() call (count query terminal)
			mockDb.where.mockReturnValueOnce(mockDb).mockResolvedValueOnce([{ count: 42 }]);

			const result = await service.getMessageCount(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBe(42);
			}
		});

		it('should return 0 when no messages exist', async () => {
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			mockDb.where.mockReturnValueOnce(mockDb).mockResolvedValueOnce([{ count: 0 }]);

			const result = await service.getMessageCount(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBe(0);
			}
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.getMessageCount('nonexistent', userId);

			expect(result.ok).toBe(false);
		});
	});

	describe('pinConversation', () => {
		it('should pin a conversation', async () => {
			const pinnedConv = { ...mockConversation, isPinned: true };
			mockDb.limit.mockResolvedValueOnce([mockConversation]);
			mockDb.returning.mockResolvedValueOnce([pinnedConv]);

			const result = await service.pinConversation(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.isPinned).toBe(true);
			}
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.pinConversation('nonexistent', userId);

			expect(result.ok).toBe(false);
		});
	});

	describe('unpinConversation', () => {
		it('should unpin a conversation', async () => {
			const unpinnedConv = { ...mockConversation, isPinned: false };
			mockDb.limit.mockResolvedValueOnce([{ ...mockConversation, isPinned: true }]);
			mockDb.returning.mockResolvedValueOnce([unpinnedConv]);

			const result = await service.unpinConversation(conversationId, userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.isPinned).toBe(false);
			}
		});

		it('should return error when conversation not found', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.unpinConversation('nonexistent', userId);

			expect(result.ok).toBe(false);
		});
	});
});
