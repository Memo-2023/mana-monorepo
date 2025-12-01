import { Controller, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SlideService } from './slide.service';
import { CreateSlideDto, UpdateSlideDto, ReorderSlidesDto } from './slide.dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class SlideController {
	constructor(private readonly slideService: SlideService) {}

	@Post('decks/:deckId/slides')
	async create(
		@Param('deckId') deckId: string,
		@Body() createSlideDto: CreateSlideDto,
		@CurrentUser() user: CurrentUserData
	) {
		return this.slideService.create(deckId, user.userId, createSlideDto);
	}

	@Put('slides/:id')
	async update(
		@Param('id') id: string,
		@Body() updateSlideDto: UpdateSlideDto,
		@CurrentUser() user: CurrentUserData
	) {
		return this.slideService.update(id, user.userId, updateSlideDto);
	}

	@Delete('slides/:id')
	async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.slideService.remove(id, user.userId);
	}

	@Put('slides/reorder')
	async reorder(@Body() reorderDto: ReorderSlidesDto, @CurrentUser() user: CurrentUserData) {
		return this.slideService.reorder(user.userId, reorderDto);
	}
}
