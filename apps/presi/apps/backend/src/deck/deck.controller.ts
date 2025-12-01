import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DeckService } from './deck.service';
import { CreateDeckDto, UpdateDeckDto } from './deck.dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('decks')
@UseGuards(JwtAuthGuard)
export class DeckController {
	constructor(private readonly deckService: DeckService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.deckService.findByUser(user.userId);
	}

	@Get(':id')
	async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.deckService.findOneWithSlides(id, user.userId);
	}

	@Post()
	async create(@Body() createDeckDto: CreateDeckDto, @CurrentUser() user: CurrentUserData) {
		return this.deckService.create(user.userId, createDeckDto);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateDeckDto: UpdateDeckDto,
		@CurrentUser() user: CurrentUserData
	) {
		return this.deckService.update(id, user.userId, updateDeckDto);
	}

	@Delete(':id')
	async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.deckService.remove(id, user.userId);
	}
}
