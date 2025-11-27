import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	Request,
} from '@nestjs/common';
import { DeckService } from './deck.service';
import { CreateDeckDto, UpdateDeckDto } from './deck.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('decks')
@UseGuards(AuthGuard)
export class DeckController {
	constructor(private readonly deckService: DeckService) {}

	@Get()
	async findAll(@Request() req: { user: { sub: string } }) {
		return this.deckService.findByUser(req.user.sub);
	}

	@Get(':id')
	async findOne(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
		return this.deckService.findOneWithSlides(id, req.user.sub);
	}

	@Post()
	async create(@Body() createDeckDto: CreateDeckDto, @Request() req: { user: { sub: string } }) {
		return this.deckService.create(req.user.sub, createDeckDto);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateDeckDto: UpdateDeckDto,
		@Request() req: { user: { sub: string } }
	) {
		return this.deckService.update(id, req.user.sub, updateDeckDto);
	}

	@Delete(':id')
	async remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
		return this.deckService.remove(id, req.user.sub);
	}
}
