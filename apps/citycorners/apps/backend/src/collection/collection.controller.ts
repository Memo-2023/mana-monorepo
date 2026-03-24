import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { CollectionService } from './collection.service';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class CreateCollectionDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsOptional()
	description?: string;
}

class UpdateCollectionDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	description?: string;
}

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionController {
	constructor(private readonly collectionService: CollectionService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const collections = await this.collectionService.findByUserId(user.userId);
		return { collections };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCollectionDto) {
		const collection = await this.collectionService.create({
			name: dto.name,
			description: dto.description,
			userId: user.userId,
		});
		return { collection };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateCollectionDto
	) {
		const collection = await this.collectionService.update(id, dto, user.userId);
		return { collection };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.collectionService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/locations/:locationId')
	async addLocation(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Param('locationId') locationId: string
	) {
		const collection = await this.collectionService.addLocation(id, locationId, user.userId);
		return { collection };
	}

	@Delete(':id/locations/:locationId')
	async removeLocation(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Param('locationId') locationId: string
	) {
		const collection = await this.collectionService.removeLocation(id, locationId, user.userId);
		return { collection };
	}
}
