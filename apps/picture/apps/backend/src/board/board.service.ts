import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { boards, boardItems } from '../db/schema';
import type { Board } from '../db/schema';
import { CreateBoardDto, UpdateBoardDto, GetBoardsQueryDto } from './dto/board.dto';
import { StorageService } from '../upload/storage.service';

export interface BoardWithCount extends Board {
	itemCount: number;
}

@Injectable()
export class BoardService {
	private readonly logger = new Logger(BoardService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: Database,
		private readonly storageService: StorageService
	) {}

	async getBoards(userId: string, query: GetBoardsQueryDto): Promise<BoardWithCount[]> {
		try {
			const { page = 1, limit = 20, includePublic = false } = query;
			const offset = (page - 1) * limit;

			const conditions = includePublic
				? or(eq(boards.userId, userId), eq(boards.isPublic, true))
				: eq(boards.userId, userId);

			const result = await this.db
				.select({
					id: boards.id,
					userId: boards.userId,
					name: boards.name,
					description: boards.description,
					thumbnailUrl: boards.thumbnailUrl,
					canvasWidth: boards.canvasWidth,
					canvasHeight: boards.canvasHeight,
					backgroundColor: boards.backgroundColor,
					isPublic: boards.isPublic,
					createdAt: boards.createdAt,
					updatedAt: boards.updatedAt,
					itemCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${boardItems}
            WHERE ${boardItems.boardId} = ${boards.id}
          )`,
				})
				.from(boards)
				.where(conditions)
				.orderBy(desc(boards.updatedAt))
				.limit(limit)
				.offset(offset);

			return result as BoardWithCount[];
		} catch (error) {
			this.logger.error('Error fetching boards', error);
			throw error;
		}
	}

	async getPublicBoards(query: GetBoardsQueryDto): Promise<BoardWithCount[]> {
		try {
			const { page = 1, limit = 20 } = query;
			const offset = (page - 1) * limit;

			const result = await this.db
				.select({
					id: boards.id,
					userId: boards.userId,
					name: boards.name,
					description: boards.description,
					thumbnailUrl: boards.thumbnailUrl,
					canvasWidth: boards.canvasWidth,
					canvasHeight: boards.canvasHeight,
					backgroundColor: boards.backgroundColor,
					isPublic: boards.isPublic,
					createdAt: boards.createdAt,
					updatedAt: boards.updatedAt,
					itemCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${boardItems}
            WHERE ${boardItems.boardId} = ${boards.id}
          )`,
				})
				.from(boards)
				.where(eq(boards.isPublic, true))
				.orderBy(desc(boards.updatedAt))
				.limit(limit)
				.offset(offset);

			return result as BoardWithCount[];
		} catch (error) {
			this.logger.error('Error fetching public boards', error);
			throw error;
		}
	}

	async getBoardById(id: string, userId: string): Promise<Board> {
		try {
			const result = await this.db.select().from(boards).where(eq(boards.id, id)).limit(1);

			if (result.length === 0) {
				throw new NotFoundException(`Board with id ${id} not found`);
			}

			const board = result[0];

			// Check access
			if (board.userId !== userId && !board.isPublic) {
				throw new ForbiddenException('Access denied');
			}

			return board;
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error fetching board ${id}`, error);
			throw error;
		}
	}

	async createBoard(userId: string, dto: CreateBoardDto): Promise<Board> {
		try {
			const result = await this.db
				.insert(boards)
				.values({
					userId,
					name: dto.name,
					description: dto.description,
					canvasWidth: dto.canvasWidth || 2000,
					canvasHeight: dto.canvasHeight || 1500,
					backgroundColor: dto.backgroundColor || '#ffffff',
					isPublic: dto.isPublic || false,
				})
				.returning();

			return result[0];
		} catch (error) {
			this.logger.error('Error creating board', error);
			throw error;
		}
	}

	async updateBoard(id: string, userId: string, dto: UpdateBoardDto): Promise<Board> {
		try {
			await this.verifyOwnership(id, userId);

			const result = await this.db
				.update(boards)
				.set({
					...(dto.name && { name: dto.name }),
					...(dto.description !== undefined && { description: dto.description }),
					...(dto.canvasWidth && { canvasWidth: dto.canvasWidth }),
					...(dto.canvasHeight && { canvasHeight: dto.canvasHeight }),
					...(dto.backgroundColor && { backgroundColor: dto.backgroundColor }),
					...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
					updatedAt: new Date(),
				})
				.where(eq(boards.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error updating board ${id}`, error);
			throw error;
		}
	}

	async deleteBoard(id: string, userId: string): Promise<void> {
		try {
			await this.verifyOwnership(id, userId);

			// Delete board items first
			await this.db.delete(boardItems).where(eq(boardItems.boardId, id));

			// Delete the board
			await this.db.delete(boards).where(eq(boards.id, id));
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error deleting board ${id}`, error);
			throw error;
		}
	}

	async duplicateBoard(id: string, userId: string): Promise<Board> {
		try {
			// Get original board (user can duplicate public boards too)
			const original = await this.db.select().from(boards).where(eq(boards.id, id)).limit(1);

			if (original.length === 0) {
				throw new NotFoundException(`Board with id ${id} not found`);
			}

			const board = original[0];

			// Check access
			if (board.userId !== userId && !board.isPublic) {
				throw new ForbiddenException('Access denied');
			}

			// Use a transaction to ensure board + items are created atomically
			const newBoard = await this.db.transaction(async (tx) => {
				const newBoardResult = await tx
					.insert(boards)
					.values({
						userId,
						name: `${board.name} (Copy)`,
						description: board.description,
						canvasWidth: board.canvasWidth,
						canvasHeight: board.canvasHeight,
						backgroundColor: board.backgroundColor,
						isPublic: false,
					})
					.returning();

				// Copy board items
				const items = await tx.select().from(boardItems).where(eq(boardItems.boardId, id));

				if (items.length > 0) {
					await tx.insert(boardItems).values(
						items.map((item) => ({
							boardId: newBoardResult[0].id,
							imageId: item.imageId,
							itemType: item.itemType,
							positionX: item.positionX,
							positionY: item.positionY,
							scaleX: item.scaleX,
							scaleY: item.scaleY,
							rotation: item.rotation,
							zIndex: item.zIndex,
							opacity: item.opacity,
							width: item.width,
							height: item.height,
							textContent: item.textContent,
							fontSize: item.fontSize,
							color: item.color,
							properties: item.properties,
						}))
					);
				}

				return newBoardResult[0];
			});

			return newBoard;
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error duplicating board ${id}`, error);
			throw error;
		}
	}

	async generateThumbnail(id: string, userId: string, dataUrl: string): Promise<Board> {
		try {
			await this.verifyOwnership(id, userId);

			// Upload thumbnail using StorageService
			const thumbnailUrl = await this.storageService.uploadBoardThumbnail(id, dataUrl);

			// Update board with thumbnail URL
			const result = await this.db
				.update(boards)
				.set({
					thumbnailUrl,
					updatedAt: new Date(),
				})
				.where(eq(boards.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error generating thumbnail for board ${id}`, error);
			throw error;
		}
	}

	async toggleVisibility(id: string, userId: string, isPublic: boolean): Promise<Board> {
		try {
			await this.verifyOwnership(id, userId);

			const result = await this.db
				.update(boards)
				.set({
					isPublic,
					updatedAt: new Date(),
				})
				.where(eq(boards.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error toggling visibility for board ${id}`, error);
			throw error;
		}
	}

	private async verifyOwnership(id: string, userId: string): Promise<void> {
		const result = await this.db
			.select({ userId: boards.userId })
			.from(boards)
			.where(eq(boards.id, id))
			.limit(1);

		if (result.length === 0) {
			throw new NotFoundException(`Board with id ${id} not found`);
		}

		if (result[0].userId !== userId) {
			throw new ForbiddenException('Access denied');
		}
	}
}
