import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get()
	findAll(@CurrentUser() user: CurrentUserData, @Query('type') type?: 'income' | 'expense') {
		return this.categoryService.findAll(user.userId, type);
	}

	@Get('all')
	findAllIncludingArchived(@CurrentUser() user: CurrentUserData) {
		return this.categoryService.findAllIncludingArchived(user.userId);
	}

	@Get('tree')
	getTree(@CurrentUser() user: CurrentUserData) {
		return this.categoryService.getTree(user.userId);
	}

	@Get(':id')
	findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.categoryService.findOne(user.userId, id);
	}

	@Post()
	create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCategoryDto) {
		return this.categoryService.create(user.userId, dto);
	}

	@Post('seed')
	seed(@CurrentUser() user: CurrentUserData) {
		return this.categoryService.seed(user.userId);
	}

	@Put(':id')
	update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateCategoryDto
	) {
		return this.categoryService.update(user.userId, id, dto);
	}

	@Delete(':id')
	delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.categoryService.delete(user.userId, id);
	}
}
