import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FiguresService } from './figures.service';
import { CreateFigureDto } from './dto/create-figure.dto';
import { FuseFiguresDto } from './dto/fuse-figures.dto';

@Controller('figures')
@UseGuards(JwtAuthGuard)
export class FiguresController {
	constructor(private readonly figuresService: FiguresService) {}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateFigureDto) {
		const figure = await this.figuresService.create(
			user.userId,
			dto.name,
			dto.description,
			dto.language || 'en',
			dto.faceImage
		);
		return { figure };
	}

	@Post('fuse')
	async fuse(@CurrentUser() user: CurrentUserData, @Body() dto: FuseFiguresDto) {
		const figure = await this.figuresService.fuse(user.userId, dto.figureIdA, dto.figureIdB);
		return { figure };
	}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const figures = await this.figuresService.findByUserId(user.userId);
		return { figures };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const figure = await this.figuresService.findById(id, user.userId);
		return { figure };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.figuresService.delete(id, user.userId);
		return { success: true };
	}
}
