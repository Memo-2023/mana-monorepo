import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BoardItemService } from './board-item.service';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import {
	AddImageToBoardDto,
	AddTextToBoardDto,
	UpdateBoardItemDto,
	UpdateBoardItemsDto,
	RemoveBoardItemsDto,
	ChangeZIndexDto,
} from './dto/board-item.dto';

@Controller('board-items')
@UseGuards(JwtAuthGuard)
export class BoardItemController {
	constructor(private readonly boardItemService: BoardItemService) {}

	@Get('board/:boardId')
	async getBoardItems(@CurrentUser() user: CurrentUserData, @Param('boardId') boardId: string) {
		return this.boardItemService.getBoardItems(boardId, user.userId);
	}

	@Get(':id')
	async getBoardItemById(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.boardItemService.getBoardItemById(id, user.userId);
	}

	@Post('image')
	async addImageToBoard(@CurrentUser() user: CurrentUserData, @Body() dto: AddImageToBoardDto) {
		return this.boardItemService.addImageToBoard(user.userId, dto);
	}

	@Post('text')
	async addTextToBoard(@CurrentUser() user: CurrentUserData, @Body() dto: AddTextToBoardDto) {
		return this.boardItemService.addTextToBoard(user.userId, dto);
	}

	@Patch(':id')
	async updateBoardItem(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateBoardItemDto
	) {
		return this.boardItemService.updateBoardItem(id, user.userId, dto);
	}

	@Patch('batch')
	async updateBoardItems(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateBoardItemsDto) {
		return this.boardItemService.updateBoardItems(user.userId, dto.items);
	}

	@Delete(':id')
	async removeBoardItem(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.boardItemService.removeBoardItem(id, user.userId);
	}

	@Delete('batch')
	async removeBoardItems(@CurrentUser() user: CurrentUserData, @Body() dto: RemoveBoardItemsDto) {
		return this.boardItemService.removeBoardItems(user.userId, dto.ids);
	}

	@Patch(':id/z-index')
	async changeZIndex(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: ChangeZIndexDto
	) {
		return this.boardItemService.changeZIndex(id, user.userId, dto.direction);
	}

	@Get('check/:boardId/:imageId')
	async isImageOnBoard(
		@CurrentUser() user: CurrentUserData,
		@Param('boardId') boardId: string,
		@Param('imageId') imageId: string
	) {
		const result = await this.boardItemService.isImageOnBoard(boardId, imageId);
		return { isOnBoard: result };
	}
}
