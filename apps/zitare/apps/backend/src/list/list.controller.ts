import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ListService } from './list.service';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

class CreateListDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsOptional()
	description?: string;
}

class UpdateListDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	quoteIds?: string[];
}

class AddQuoteDto {
	@IsString()
	@IsNotEmpty()
	quoteId!: string;
}

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListController {
	constructor(private readonly listService: ListService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const lists = await this.listService.findByUserId(user.userId);
		return { lists };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const list = await this.listService.findById(user.userId, id);
		return { list };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateListDto) {
		const list = await this.listService.create({
			userId: user.userId,
			name: dto.name,
			description: dto.description,
		});
		return { list };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateListDto
	) {
		const list = await this.listService.update(user.userId, id, dto);
		return { list };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.listService.delete(user.userId, id);
		return { success: true };
	}

	@Post(':id/quotes')
	async addQuote(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: AddQuoteDto
	) {
		const list = await this.listService.addQuoteToList(user.userId, id, dto.quoteId);
		return { list };
	}

	@Delete(':id/quotes/:quoteId')
	async removeQuote(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Param('quoteId') quoteId: string
	) {
		const list = await this.listService.removeQuoteFromList(user.userId, id, quoteId);
		return { list };
	}
}
