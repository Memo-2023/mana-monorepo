import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SequencesService } from './sequences.service';
import { CreateSequenceDto, UpdateSequenceDto } from './dto';

@Controller('sequences')
@UseGuards(JwtAuthGuard)
export class SequencesController {
	constructor(private readonly sequencesService: SequencesService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.sequencesService.findAllByUser(user.userId);
	}

	@Get(':id')
	async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.sequencesService.findOne(id, user.userId);
	}

	@Post()
	async create(@Body() dto: CreateSequenceDto, @CurrentUser() user: CurrentUserData) {
		return this.sequencesService.create(user.userId, dto);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateSequenceDto,
		@CurrentUser() user: CurrentUserData
	) {
		return this.sequencesService.update(id, user.userId, dto);
	}

	@Delete(':id')
	async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		await this.sequencesService.delete(id, user.userId);
		return { success: true };
	}
}
