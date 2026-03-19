import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeckService } from './deck.service';
import { CreateDeckDto } from './deck.dto';
import type { UpdateDeckDto } from './deck.dto';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';

@ApiTags('Decks')
@ApiBearerAuth()
@Controller('decks')
@UseGuards(JwtAuthGuard)
export class DeckController {
	constructor(private readonly deckService: DeckService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.deckService.findByUser(user.userId);
	}

	@Get(':id')
	async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserData) {
		return this.deckService.findOneWithSlides(id, user.userId);
	}

	@Post()
	async create(@Body() createDeckDto: CreateDeckDto, @CurrentUser() user: CurrentUserData) {
		return this.deckService.create(user.userId, createDeckDto);
	}

	@Put(':id')
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() updateDeckDto: UpdateDeckDto,
		@CurrentUser() user: CurrentUserData
	) {
		return this.deckService.update(id, user.userId, updateDeckDto);
	}

	@Delete(':id')
	async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserData) {
		return this.deckService.remove(id, user.userId);
	}
}
