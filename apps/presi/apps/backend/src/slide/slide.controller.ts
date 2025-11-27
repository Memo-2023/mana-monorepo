import { Controller, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SlideService } from './slide.service';
import { CreateSlideDto, UpdateSlideDto, ReorderSlidesDto } from './slide.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class SlideController {
	constructor(private readonly slideService: SlideService) {}

	@Post('decks/:deckId/slides')
	async create(
		@Param('deckId') deckId: string,
		@Body() createSlideDto: CreateSlideDto,
		@Request() req: { user: { sub: string } }
	) {
		return this.slideService.create(deckId, req.user.sub, createSlideDto);
	}

	@Put('slides/:id')
	async update(
		@Param('id') id: string,
		@Body() updateSlideDto: UpdateSlideDto,
		@Request() req: { user: { sub: string } }
	) {
		return this.slideService.update(id, req.user.sub, updateSlideDto);
	}

	@Delete('slides/:id')
	async remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
		return this.slideService.remove(id, req.user.sub);
	}

	@Put('slides/reorder')
	async reorder(@Body() reorderDto: ReorderSlidesDto, @Request() req: { user: { sub: string } }) {
		return this.slideService.reorder(req.user.sub, reorderDto);
	}
}
