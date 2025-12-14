import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ContactService } from './contact.service';
import {
	IsString,
	IsOptional,
	IsEmail,
	IsBoolean,
	IsDateString,
	IsUUID,
	MaxLength,
	IsArray,
	ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class CustomDateDto {
	@IsUUID()
	id: string;

	@IsString()
	@MaxLength(100)
	label: string;

	@IsDateString()
	date: string;
}

class CreateContactDto {
	@IsString()
	@IsOptional()
	@MaxLength(100)
	firstName?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	lastName?: string;

	@IsString()
	@IsOptional()
	@MaxLength(200)
	displayName?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	nickname?: string;

	@IsEmail()
	@IsOptional()
	@MaxLength(255)
	email?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	phone?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	mobile?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	street?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	city?: string;

	@IsString()
	@IsOptional()
	@MaxLength(20)
	postalCode?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	country?: string;

	@IsString()
	@IsOptional()
	@MaxLength(200)
	company?: string;

	@IsString()
	@IsOptional()
	@MaxLength(200)
	jobTitle?: string;

	@IsString()
	@IsOptional()
	@MaxLength(200)
	department?: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	website?: string;

	@IsDateString()
	@IsOptional()
	birthday?: string;

	@IsString()
	@IsOptional()
	notes?: string;

	@IsArray()
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => CustomDateDto)
	customDates?: CustomDateDto[];

	// Social Media
	@IsString()
	@IsOptional()
	@MaxLength(255)
	linkedin?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	twitter?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	facebook?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	instagram?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	xing?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	github?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	youtube?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	tiktok?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	telegram?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	whatsapp?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	signal?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	discord?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	bluesky?: string;

	@IsUUID()
	@IsOptional()
	organizationId?: string;

	@IsUUID()
	@IsOptional()
	teamId?: string;

	@IsString()
	@IsOptional()
	visibility?: string;
}

class UpdateContactDto extends CreateContactDto {
	@IsBoolean()
	@IsOptional()
	isFavorite?: boolean;

	@IsBoolean()
	@IsOptional()
	isArchived?: boolean;
}

class ContactQueryDto {
	@IsString()
	@IsOptional()
	search?: string;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	isFavorite?: boolean;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	isArchived?: boolean;

	@IsUUID()
	@IsOptional()
	tagId?: string;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	offset?: number;
}

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactController {
	constructor(private readonly contactService: ContactService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: ContactQueryDto) {
		const contacts = await this.contactService.findByUserId(user.userId, query);
		const total = await this.contactService.count(user.userId, query.isArchived);
		return { contacts, total };
	}

	/**
	 * Get all contacts with birthdays (for calendar integration)
	 * Returns lightweight data: id, displayName, firstName, lastName, birthday, photoUrl
	 */
	@Get('birthdays')
	async getBirthdays(@CurrentUser() user: CurrentUserData) {
		const contacts = await this.contactService.findWithBirthdays(user.userId);
		return { contacts };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const contact = await this.contactService.findById(id, user.userId);
		if (!contact) {
			return { contact: null };
		}
		return { contact };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateContactDto) {
		// Generate display name if not provided
		let displayName = dto.displayName;
		if (!displayName && (dto.firstName || dto.lastName)) {
			displayName = [dto.firstName, dto.lastName].filter(Boolean).join(' ');
		}

		const contact = await this.contactService.create({
			...dto,
			displayName,
			userId: user.userId,
			createdBy: user.userId,
		});
		return { contact };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateContactDto
	) {
		const contact = await this.contactService.update(id, user.userId, dto);
		return { contact };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.contactService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/favorite')
	async toggleFavorite(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const contact = await this.contactService.toggleFavorite(id, user.userId);
		return { contact };
	}

	@Post(':id/archive')
	async toggleArchive(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const contact = await this.contactService.toggleArchive(id, user.userId);
		return { contact };
	}
}
