import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.categoryService.findAll(user.userId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.categoryService.findOne(user.userId, id);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCategoryDto) {
		return this.categoryService.create(user.userId, dto);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateCategoryDto
	) {
		return this.categoryService.update(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.categoryService.delete(user.userId, id);
	}
}
