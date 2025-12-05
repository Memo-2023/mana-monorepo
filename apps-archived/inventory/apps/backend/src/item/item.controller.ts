import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Patch,
	Body,
	Param,
	Query,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto, ItemQueryDto } from './dto';

@Controller('api/v1/items')
@UseGuards(JwtAuthGuard)
export class ItemController {
	constructor(private readonly itemService: ItemService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: ItemQueryDto) {
		return this.itemService.findAll(user.userId, query);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.itemService.findOne(user.userId, id);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateItemDto) {
		return this.itemService.create(user.userId, dto);
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateItemDto
	) {
		return this.itemService.update(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.itemService.delete(user.userId, id);
	}

	@Patch(':id/toggle-favorite')
	async toggleFavorite(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.itemService.toggleFavorite(user.userId, id);
	}

	@Patch(':id/toggle-archive')
	async toggleArchive(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.itemService.toggleArchive(user.userId, id);
	}
}
