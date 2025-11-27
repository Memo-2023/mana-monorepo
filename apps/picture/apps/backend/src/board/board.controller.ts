import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';
import {
  CreateBoardDto,
  UpdateBoardDto,
  GetBoardsQueryDto,
  GenerateThumbnailDto,
  ToggleVisibilityDto,
} from './dto/board.dto';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  async getBoards(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetBoardsQueryDto,
  ) {
    return this.boardService.getBoards(user.userId, query);
  }

  @Get('public')
  async getPublicBoards(@Query() query: GetBoardsQueryDto) {
    return this.boardService.getPublicBoards(query);
  }

  @Get(':id')
  async getBoardById(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.boardService.getBoardById(id, user.userId);
  }

  @Post()
  async createBoard(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardService.createBoard(user.userId, dto);
  }

  @Patch(':id')
  async updateBoard(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardService.updateBoard(id, user.userId, dto);
  }

  @Delete(':id')
  async deleteBoard(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.boardService.deleteBoard(id, user.userId);
  }

  @Post(':id/duplicate')
  async duplicateBoard(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.boardService.duplicateBoard(id, user.userId);
  }

  @Post(':id/thumbnail')
  async generateThumbnail(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: GenerateThumbnailDto,
  ) {
    return this.boardService.generateThumbnail(id, user.userId, dto.dataUrl);
  }

  @Patch(':id/visibility')
  async toggleVisibility(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: ToggleVisibilityDto,
  ) {
    return this.boardService.toggleVisibility(id, user.userId, dto.isPublic);
  }
}
