import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardService } from '../board.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { StorageService } from '../../upload/storage.service';
import { boards, boardItems } from '../../db/schema';

// ── Mock helpers ──────────────────────────────────────────────────────

const NOW = new Date('2026-01-15T12:00:00Z');

const makeBoard = (overrides: Record<string, any> = {}) => ({
	id: 'board-1',
	userId: 'user-1',
	name: 'My Board',
	description: 'A test board',
	thumbnailUrl: null,
	canvasWidth: 2000,
	canvasHeight: 1500,
	backgroundColor: '#ffffff',
	isPublic: false,
	createdAt: NOW,
	updatedAt: NOW,
	...overrides,
});

const makeBoardItem = (overrides: Record<string, any> = {}) => ({
	id: 'item-1',
	boardId: 'board-1',
	imageId: 'img-1',
	itemType: 'image' as const,
	positionX: 100,
	positionY: 200,
	scaleX: 1,
	scaleY: 1,
	rotation: 0,
	zIndex: 0,
	opacity: 1,
	width: 512,
	height: 512,
	textContent: null,
	fontSize: null,
	color: null,
	properties: null,
	createdAt: NOW,
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

const mockStorageService = {
	uploadBoardThumbnail: jest.fn(),
};

// ── Test suite ────────────────────────────────────────────────────────

describe('BoardService', () => {
	let service: BoardService;

	beforeEach(async () => {
		buildMockDb();
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BoardService,
				{ provide: DATABASE_CONNECTION, useValue: mockDb },
				{ provide: StorageService, useValue: mockStorageService },
			],
		}).compile();

		service = module.get<BoardService>(BoardService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// ── getBoards ───────────────────────────────────────────────────

	describe('getBoards', () => {
		it('should return boards for a user with item counts', async () => {
			const board = { ...makeBoard(), itemCount: 3 };
			selectResult.mockResolvedValue([board]);

			const result = await service.getBoards('user-1', {});

			expect(result).toEqual([board]);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should respect pagination', async () => {
			selectResult.mockResolvedValue([]);

			await service.getBoards('user-1', { page: 3, limit: 5 });

			expect(selectChain.limit).toHaveBeenCalledWith(5);
			expect(selectChain.offset).toHaveBeenCalledWith(10);
		});

		it('should include public boards when includePublic=true', async () => {
			selectResult.mockResolvedValue([]);

			await service.getBoards('user-1', { includePublic: true });

			expect(mockDb.select).toHaveBeenCalled();
			expect(selectChain.where).toHaveBeenCalled();
		});
	});

	// ── getPublicBoards ─────────────────────────────────────────────

	describe('getPublicBoards', () => {
		it('should return only public boards', async () => {
			const board = { ...makeBoard({ isPublic: true }), itemCount: 1 };
			selectResult.mockResolvedValue([board]);

			const result = await service.getPublicBoards({});

			expect(result).toEqual([board]);
		});

		it('should respect pagination', async () => {
			selectResult.mockResolvedValue([]);

			await service.getPublicBoards({ page: 2, limit: 10 });

			expect(selectChain.limit).toHaveBeenCalledWith(10);
			expect(selectChain.offset).toHaveBeenCalledWith(10);
		});
	});

	// ── getBoardById ────────────────────────────────────────────────

	describe('getBoardById', () => {
		it('should return board when user owns it', async () => {
			const board = makeBoard();
			selectResult.mockResolvedValue([board]);

			const result = await service.getBoardById('board-1', 'user-1');

			expect(result).toEqual(board);
		});

		it('should return public board to non-owner', async () => {
			const board = makeBoard({ userId: 'user-other', isPublic: true });
			selectResult.mockResolvedValue([board]);

			const result = await service.getBoardById('board-1', 'user-1');

			expect(result).toEqual(board);
		});

		it('should throw NotFoundException when board does not exist', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.getBoardById('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException for private board of another user', async () => {
			const board = makeBoard({ userId: 'user-other', isPublic: false });
			selectResult.mockResolvedValue([board]);

			await expect(service.getBoardById('board-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});
	});

	// ── createBoard ─────────────────────────────────────────────────

	describe('createBoard', () => {
		it('should create a board with provided values', async () => {
			const created = makeBoard({ name: 'New Board', description: 'desc' });
			insertChain.returning.mockResolvedValueOnce([created]);

			const result = await service.createBoard('user-1', {
				name: 'New Board',
				description: 'desc',
			});

			expect(result.name).toBe('New Board');
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should use default canvas dimensions', async () => {
			const created = makeBoard();
			insertChain.returning.mockResolvedValueOnce([created]);

			const result = await service.createBoard('user-1', { name: 'Board' });

			expect(result.canvasWidth).toBe(2000);
			expect(result.canvasHeight).toBe(1500);
		});

		it('should use custom canvas dimensions when provided', async () => {
			const created = makeBoard({ canvasWidth: 3000, canvasHeight: 2000 });
			insertChain.returning.mockResolvedValueOnce([created]);

			const result = await service.createBoard('user-1', {
				name: 'Wide Board',
				canvasWidth: 3000,
				canvasHeight: 2000,
			});

			expect(result.canvasWidth).toBe(3000);
			expect(result.canvasHeight).toBe(2000);
		});
	});

	// ── updateBoard ─────────────────────────────────────────────────

	describe('updateBoard', () => {
		it('should update board fields', async () => {
			const updated = makeBoard({ name: 'Updated Name' });
			// verifyOwnership
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([updated]);

			const result = await service.updateBoard('board-1', 'user-1', { name: 'Updated Name' });

			expect(result.name).toBe('Updated Name');
		});

		it('should throw NotFoundException for non-existent board', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.updateBoard('non-existent', 'user-1', { name: 'Test' })).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException for board owned by another user', async () => {
			selectResult.mockResolvedValueOnce([{ userId: 'user-other' }]);

			await expect(service.updateBoard('board-1', 'user-1', { name: 'Test' })).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	// ── deleteBoard ─────────────────────────────────────────────────

	describe('deleteBoard', () => {
		it('should delete board items then the board', async () => {
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);

			await service.deleteBoard('board-1', 'user-1');

			// delete called twice: boardItems then boards
			expect(mockDb.delete).toHaveBeenCalledTimes(2);
		});

		it('should throw NotFoundException for non-existent board', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.deleteBoard('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException for board owned by another user', async () => {
			selectResult.mockResolvedValueOnce([{ userId: 'user-other' }]);

			await expect(service.deleteBoard('board-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});
	});

	// ── duplicateBoard ──────────────────────────────────────────────

	describe('duplicateBoard', () => {
		function buildTxMock(items: any[], newBoard: any) {
			// Build a fresh tx mock where each chain resolves properly
			const txInsertReturning = jest
				.fn()
				.mockResolvedValueOnce([newBoard]) // board insert returning
				.mockResolvedValueOnce([]); // items insert returning (if called)

			const txInsertChain: any = {};
			for (const m of [
				'from',
				'where',
				'orderBy',
				'limit',
				'offset',
				'groupBy',
				'having',
				'set',
				'values',
			]) {
				txInsertChain[m] = jest.fn().mockReturnValue(txInsertChain);
			}
			txInsertChain.returning = txInsertReturning;

			// For select chain, resolve with items when awaited
			const txSelectTerminal = jest.fn().mockResolvedValue(items);
			const txSelectChain: any = {};
			for (const m of ['from', 'where', 'orderBy', 'limit', 'offset', 'groupBy', 'having']) {
				txSelectChain[m] = jest.fn().mockReturnValue(txSelectChain);
			}
			txSelectChain.then = (resolve: any, reject: any) => txSelectTerminal().then(resolve, reject);

			return {
				insert: jest.fn().mockReturnValue(txInsertChain),
				select: jest.fn().mockReturnValue(txSelectChain),
			};
		}

		it('should duplicate owned board with items', async () => {
			const original = makeBoard();
			const items = [makeBoardItem(), makeBoardItem({ id: 'item-2', positionX: 300 })];
			const newBoard = makeBoard({ id: 'board-2', name: 'My Board (Copy)' });

			// First select: get original board
			selectResult.mockResolvedValueOnce([original]);

			const txDb = buildTxMock(items, newBoard);
			mockDb.transaction.mockImplementation((cb: any) => cb(txDb));

			const result = await service.duplicateBoard('board-1', 'user-1');

			expect(result.id).toBe('board-2');
			expect(result.name).toBe('My Board (Copy)');
			// insert called twice inside tx: board + items
			expect(txDb.insert).toHaveBeenCalledTimes(2);
		});

		it('should duplicate a public board from another user', async () => {
			const original = makeBoard({ userId: 'user-other', isPublic: true });
			const newBoard = makeBoard({ id: 'board-2', userId: 'user-1', name: 'My Board (Copy)' });

			selectResult.mockResolvedValueOnce([original]);

			const txDb = buildTxMock([], newBoard);
			mockDb.transaction.mockImplementation((cb: any) => cb(txDb));

			const result = await service.duplicateBoard('board-1', 'user-1');

			expect(result.userId).toBe('user-1');
			// Only one insert (board, no items)
			expect(txDb.insert).toHaveBeenCalledTimes(1);
		});

		it('should throw NotFoundException for non-existent board', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.duplicateBoard('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException for private board of another user', async () => {
			const original = makeBoard({ userId: 'user-other', isPublic: false });
			selectResult.mockResolvedValueOnce([original]);

			await expect(service.duplicateBoard('board-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});
	});

	// ── generateThumbnail ───────────────────────────────────────────

	describe('generateThumbnail', () => {
		it('should upload thumbnail and update board', async () => {
			const thumbnailUrl = 'https://cdn.example.com/boards/board-1/thumb.png';
			const updated = makeBoard({ thumbnailUrl });

			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			mockStorageService.uploadBoardThumbnail.mockResolvedValue(thumbnailUrl);
			updateChain.returning.mockResolvedValueOnce([updated]);

			const result = await service.generateThumbnail(
				'board-1',
				'user-1',
				'data:image/png;base64,abc'
			);

			expect(result.thumbnailUrl).toBe(thumbnailUrl);
			expect(mockStorageService.uploadBoardThumbnail).toHaveBeenCalledWith(
				'board-1',
				'data:image/png;base64,abc'
			);
		});

		it('should throw NotFoundException for non-existent board', async () => {
			selectResult.mockResolvedValue([]);

			await expect(
				service.generateThumbnail('non-existent', 'user-1', 'data:image/png;base64,abc')
			).rejects.toThrow(NotFoundException);
		});
	});

	// ── toggleVisibility ────────────────────────────────────────────

	describe('toggleVisibility', () => {
		it('should make board public', async () => {
			const updated = makeBoard({ isPublic: true });
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([updated]);

			const result = await service.toggleVisibility('board-1', 'user-1', true);

			expect(result.isPublic).toBe(true);
		});

		it('should make board private', async () => {
			const updated = makeBoard({ isPublic: false });
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([updated]);

			const result = await service.toggleVisibility('board-1', 'user-1', false);

			expect(result.isPublic).toBe(false);
		});

		it('should throw ForbiddenException for board owned by another user', async () => {
			selectResult.mockResolvedValueOnce([{ userId: 'user-other' }]);

			await expect(service.toggleVisibility('board-1', 'user-1', true)).rejects.toThrow(
				ForbiddenException
			);
		});
	});
});
