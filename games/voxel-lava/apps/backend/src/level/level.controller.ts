import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LevelService } from './level.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { RecordPlayDto } from './dto/record-play.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('levels')
export class LevelController {
	constructor(private readonly levelService: LevelService) {}

	@Get('public')
	async getPublicLevels(@Query('page') page?: string, @Query('limit') limit?: string) {
		return this.levelService.findPublicLevels(
			page ? parseInt(page, 10) : 1,
			limit ? parseInt(limit, 10) : 20
		);
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getUserLevels(@CurrentUser() user: CurrentUserPayload) {
		return this.levelService.findUserLevels(user.userId);
	}

	@Get(':id')
	async getLevel(@Param('id') id: string) {
		return this.levelService.findById(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	async createLevel(@Body() dto: CreateLevelDto, @CurrentUser() user: CurrentUserPayload) {
		return this.levelService.create(dto, user.userId);
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async updateLevel(
		@Param('id') id: string,
		@Body() dto: UpdateLevelDto,
		@CurrentUser() user: CurrentUserPayload
	) {
		return this.levelService.update(id, dto, user.userId);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async deleteLevel(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.levelService.delete(id, user.userId);
	}

	@Post(':id/like')
	@UseGuards(JwtAuthGuard)
	async toggleLike(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.levelService.toggleLike(id, user.userId);
	}

	@Get(':id/liked')
	@UseGuards(JwtAuthGuard)
	async hasLiked(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.levelService.hasLiked(id, user.userId);
	}

	@Post(':id/play')
	async recordPlay(
		@Param('id') id: string,
		@Body() dto: RecordPlayDto,
		@CurrentUser() user?: CurrentUserPayload
	) {
		return this.levelService.recordPlay(id, dto, user?.userId);
	}

	@Get(':id/leaderboard')
	async getLeaderboard(@Param('id') id: string, @Query('limit') limit?: string) {
		return this.levelService.getLeaderboard(id, limit ? parseInt(limit, 10) : 10);
	}
}
