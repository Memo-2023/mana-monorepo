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
import { CollectionService } from './collection.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionController {
	constructor(private readonly collectionService: CollectionService) {}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCollectionDto) {
		return this.collectionService.create(user.userId, dto);
	}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.collectionService.findAll(user.userId);
	}

	@Get('default')
	async getDefault(@CurrentUser() user: CurrentUserData) {
		return this.collectionService.getDefault(user.userId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.collectionService.findOne(user.userId, id);
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateCollectionDto,
	) {
		return this.collectionService.update(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.collectionService.delete(user.userId, id);
		return { success: true };
	}

	@Post('reorder')
	async reorder(@CurrentUser() user: CurrentUserData, @Body('orderedIds') orderedIds: string[]) {
		await this.collectionService.reorder(user.userId, orderedIds);
		return { success: true };
	}
}
