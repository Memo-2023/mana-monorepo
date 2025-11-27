import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and, max, inArray, gt, lt, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { boards, boardItems, images, type BoardItem } from '../db/schema';
import {
  AddImageToBoardDto,
  AddTextToBoardDto,
  UpdateBoardItemDto,
} from './dto/board-item.dto';

export interface BoardItemWithImage extends BoardItem {
  image?: {
    id: string;
    publicUrl: string | null;
    width: number | null;
    height: number | null;
    prompt: string;
    blurhash: string | null;
  };
}

@Injectable()
export class BoardItemService {
  private readonly logger = new Logger(BoardItemService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getBoardItems(
    boardId: string,
    userId: string,
  ): Promise<BoardItemWithImage[]> {
    try {
      await this.verifyBoardAccess(boardId, userId);

      const result = await this.db
        .select({
          id: boardItems.id,
          boardId: boardItems.boardId,
          imageId: boardItems.imageId,
          itemType: boardItems.itemType,
          positionX: boardItems.positionX,
          positionY: boardItems.positionY,
          scaleX: boardItems.scaleX,
          scaleY: boardItems.scaleY,
          rotation: boardItems.rotation,
          zIndex: boardItems.zIndex,
          opacity: boardItems.opacity,
          width: boardItems.width,
          height: boardItems.height,
          textContent: boardItems.textContent,
          fontSize: boardItems.fontSize,
          color: boardItems.color,
          properties: boardItems.properties,
          createdAt: boardItems.createdAt,
          image: {
            id: images.id,
            publicUrl: images.publicUrl,
            width: images.width,
            height: images.height,
            prompt: images.prompt,
            blurhash: images.blurhash,
          },
        })
        .from(boardItems)
        .leftJoin(images, eq(boardItems.imageId, images.id))
        .where(eq(boardItems.boardId, boardId))
        .orderBy(boardItems.zIndex);

      return result as BoardItemWithImage[];
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching board items for board ${boardId}`, error);
      throw error;
    }
  }

  async getBoardItemById(
    id: string,
    userId: string,
  ): Promise<BoardItemWithImage> {
    try {
      const result = await this.db
        .select({
          id: boardItems.id,
          boardId: boardItems.boardId,
          imageId: boardItems.imageId,
          itemType: boardItems.itemType,
          positionX: boardItems.positionX,
          positionY: boardItems.positionY,
          scaleX: boardItems.scaleX,
          scaleY: boardItems.scaleY,
          rotation: boardItems.rotation,
          zIndex: boardItems.zIndex,
          opacity: boardItems.opacity,
          width: boardItems.width,
          height: boardItems.height,
          textContent: boardItems.textContent,
          fontSize: boardItems.fontSize,
          color: boardItems.color,
          properties: boardItems.properties,
          createdAt: boardItems.createdAt,
          image: {
            id: images.id,
            publicUrl: images.publicUrl,
            width: images.width,
            height: images.height,
            prompt: images.prompt,
            blurhash: images.blurhash,
          },
        })
        .from(boardItems)
        .leftJoin(images, eq(boardItems.imageId, images.id))
        .where(eq(boardItems.id, id))
        .limit(1);

      if (result.length === 0) {
        throw new NotFoundException(`Board item with id ${id} not found`);
      }

      const item = result[0];
      await this.verifyBoardAccess(item.boardId, userId);

      return item as BoardItemWithImage;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching board item ${id}`, error);
      throw error;
    }
  }

  async addImageToBoard(
    userId: string,
    dto: AddImageToBoardDto,
  ): Promise<BoardItem> {
    try {
      await this.verifyBoardOwnership(dto.boardId, userId);

      const nextZIndex = await this.getNextZIndex(dto.boardId);

      const result = await this.db
        .insert(boardItems)
        .values({
          boardId: dto.boardId,
          imageId: dto.imageId,
          itemType: 'image',
          positionX: dto.positionX || 100,
          positionY: dto.positionY || 100,
          zIndex: nextZIndex,
        })
        .returning();

      // Update board's updatedAt
      await this.db
        .update(boards)
        .set({ updatedAt: new Date() })
        .where(eq(boards.id, dto.boardId));

      return result[0];
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error('Error adding image to board', error);
      throw error;
    }
  }

  async addTextToBoard(
    userId: string,
    dto: AddTextToBoardDto,
  ): Promise<BoardItem> {
    try {
      await this.verifyBoardOwnership(dto.boardId, userId);

      const nextZIndex = await this.getNextZIndex(dto.boardId);

      const result = await this.db
        .insert(boardItems)
        .values({
          boardId: dto.boardId,
          itemType: 'text',
          positionX: dto.positionX || 100,
          positionY: dto.positionY || 100,
          textContent: dto.content || 'New Text',
          fontSize: dto.fontSize || 24,
          color: dto.color || '#000000',
          properties: dto.properties,
          zIndex: nextZIndex,
        })
        .returning();

      // Update board's updatedAt
      await this.db
        .update(boards)
        .set({ updatedAt: new Date() })
        .where(eq(boards.id, dto.boardId));

      return result[0];
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error('Error adding text to board', error);
      throw error;
    }
  }

  async updateBoardItem(
    id: string,
    userId: string,
    dto: UpdateBoardItemDto,
  ): Promise<BoardItem> {
    try {
      const item = await this.db
        .select()
        .from(boardItems)
        .where(eq(boardItems.id, id))
        .limit(1);

      if (item.length === 0) {
        throw new NotFoundException(`Board item with id ${id} not found`);
      }

      await this.verifyBoardOwnership(item[0].boardId, userId);

      const result = await this.db
        .update(boardItems)
        .set({
          ...(dto.positionX !== undefined && { positionX: dto.positionX }),
          ...(dto.positionY !== undefined && { positionY: dto.positionY }),
          ...(dto.scaleX !== undefined && { scaleX: dto.scaleX }),
          ...(dto.scaleY !== undefined && { scaleY: dto.scaleY }),
          ...(dto.rotation !== undefined && { rotation: dto.rotation }),
          ...(dto.zIndex !== undefined && { zIndex: dto.zIndex }),
          ...(dto.opacity !== undefined && { opacity: dto.opacity }),
          ...(dto.width !== undefined && { width: dto.width }),
          ...(dto.height !== undefined && { height: dto.height }),
          ...(dto.textContent !== undefined && { textContent: dto.textContent }),
          ...(dto.fontSize !== undefined && { fontSize: dto.fontSize }),
          ...(dto.color !== undefined && { color: dto.color }),
          ...(dto.properties !== undefined && { properties: dto.properties }),
        })
        .where(eq(boardItems.id, id))
        .returning();

      // Update board's updatedAt
      await this.db
        .update(boards)
        .set({ updatedAt: new Date() })
        .where(eq(boards.id, item[0].boardId));

      return result[0];
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error updating board item ${id}`, error);
      throw error;
    }
  }

  async updateBoardItems(
    userId: string,
    items: Array<{ id: string } & UpdateBoardItemDto>,
  ): Promise<void> {
    try {
      for (const item of items) {
        await this.updateBoardItem(item.id, userId, item);
      }
    } catch (error) {
      this.logger.error('Error batch updating board items', error);
      throw error;
    }
  }

  async removeBoardItem(id: string, userId: string): Promise<void> {
    try {
      const item = await this.db
        .select()
        .from(boardItems)
        .where(eq(boardItems.id, id))
        .limit(1);

      if (item.length === 0) {
        throw new NotFoundException(`Board item with id ${id} not found`);
      }

      await this.verifyBoardOwnership(item[0].boardId, userId);

      await this.db.delete(boardItems).where(eq(boardItems.id, id));

      // Update board's updatedAt
      await this.db
        .update(boards)
        .set({ updatedAt: new Date() })
        .where(eq(boards.id, item[0].boardId));
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error removing board item ${id}`, error);
      throw error;
    }
  }

  async removeBoardItems(userId: string, ids: string[]): Promise<void> {
    try {
      for (const id of ids) {
        await this.removeBoardItem(id, userId);
      }
    } catch (error) {
      this.logger.error('Error batch removing board items', error);
      throw error;
    }
  }

  async changeZIndex(
    id: string,
    userId: string,
    direction: 'up' | 'down' | 'top' | 'bottom',
  ): Promise<BoardItem> {
    try {
      const item = await this.db
        .select()
        .from(boardItems)
        .where(eq(boardItems.id, id))
        .limit(1);

      if (item.length === 0) {
        throw new NotFoundException(`Board item with id ${id} not found`);
      }

      await this.verifyBoardOwnership(item[0].boardId, userId);

      const currentZIndex = item[0].zIndex;
      let newZIndex: number;

      if (direction === 'top') {
        const maxResult = await this.db
          .select({ maxZ: max(boardItems.zIndex) })
          .from(boardItems)
          .where(eq(boardItems.boardId, item[0].boardId));
        newZIndex = (maxResult[0]?.maxZ || 0) + 1;
      } else if (direction === 'bottom') {
        newZIndex = 0;
        // Shift all other items up
        await this.db
          .update(boardItems)
          .set({ zIndex: sql`${boardItems.zIndex} + 1` })
          .where(eq(boardItems.boardId, item[0].boardId));
      } else if (direction === 'up') {
        // Find the next item above
        const above = await this.db
          .select()
          .from(boardItems)
          .where(
            and(
              eq(boardItems.boardId, item[0].boardId),
              gt(boardItems.zIndex, currentZIndex),
            ),
          )
          .orderBy(boardItems.zIndex)
          .limit(1);

        if (above.length > 0) {
          // Swap z-indices
          await this.db
            .update(boardItems)
            .set({ zIndex: currentZIndex })
            .where(eq(boardItems.id, above[0].id));
          newZIndex = above[0].zIndex;
        } else {
          newZIndex = currentZIndex;
        }
      } else {
        // down
        const below = await this.db
          .select()
          .from(boardItems)
          .where(
            and(
              eq(boardItems.boardId, item[0].boardId),
              lt(boardItems.zIndex, currentZIndex),
            ),
          )
          .orderBy(boardItems.zIndex)
          .limit(1);

        if (below.length > 0) {
          // Swap z-indices
          await this.db
            .update(boardItems)
            .set({ zIndex: currentZIndex })
            .where(eq(boardItems.id, below[0].id));
          newZIndex = below[0].zIndex;
        } else {
          newZIndex = currentZIndex;
        }
      }

      const result = await this.db
        .update(boardItems)
        .set({ zIndex: newZIndex })
        .where(eq(boardItems.id, id))
        .returning();

      return result[0];
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error changing z-index for board item ${id}`, error);
      throw error;
    }
  }

  async isImageOnBoard(boardId: string, imageId: string): Promise<boolean> {
    try {
      const result = await this.db
        .select()
        .from(boardItems)
        .where(
          and(eq(boardItems.boardId, boardId), eq(boardItems.imageId, imageId)),
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      this.logger.error(
        `Error checking if image ${imageId} is on board ${boardId}`,
        error,
      );
      throw error;
    }
  }

  private async getNextZIndex(boardId: string): Promise<number> {
    const result = await this.db
      .select({ maxZ: max(boardItems.zIndex) })
      .from(boardItems)
      .where(eq(boardItems.boardId, boardId));

    return (result[0]?.maxZ || 0) + 1;
  }

  private async verifyBoardAccess(
    boardId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.db
      .select({ userId: boards.userId, isPublic: boards.isPublic })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Board with id ${boardId} not found`);
    }

    if (result[0].userId !== userId && !result[0].isPublic) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async verifyBoardOwnership(
    boardId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.db
      .select({ userId: boards.userId })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Board with id ${boardId} not found`);
    }

    if (result[0].userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
