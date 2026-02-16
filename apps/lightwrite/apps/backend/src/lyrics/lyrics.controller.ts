import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LyricsService } from './lyrics.service';
import { CreateOrUpdateLyricsDto, SyncLinesDto, UpdateLineTimestampDto } from './dto/lyrics.dto';

@Controller('lyrics')
@UseGuards(JwtAuthGuard)
export class LyricsController {
	constructor(private readonly lyricsService: LyricsService) {}

	@Get('project/:projectId')
	async findByProject(
		@CurrentUser() user: CurrentUserData,
		@Param('projectId', ParseUUIDPipe) projectId: string
	) {
		const result = await this.lyricsService.getWithLines(projectId, user.userId);
		return { lyrics: result };
	}

	@Post('project/:projectId')
	async createOrUpdate(
		@CurrentUser() user: CurrentUserData,
		@Param('projectId', ParseUUIDPipe) projectId: string,
		@Body() dto: CreateOrUpdateLyricsDto
	) {
		const lyricsRecord = await this.lyricsService.createOrUpdate(
			projectId,
			user.userId,
			dto.content
		);
		return { lyrics: lyricsRecord };
	}

	@Post(':id/sync')
	async syncLines(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: SyncLinesDto
	) {
		const lines = await this.lyricsService.syncLines(id, user.userId, dto.lines);
		return { lines };
	}

	@Put('line/:lineId/timestamp')
	async updateLineTimestamp(
		@CurrentUser() user: CurrentUserData,
		@Param('lineId', ParseUUIDPipe) lineId: string,
		@Body() dto: UpdateLineTimestampDto
	) {
		const line = await this.lyricsService.updateLineTimestamp(lineId, user.userId, dto);
		return { line };
	}
}
