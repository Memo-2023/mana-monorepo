import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SkillService } from './skill.service';
import { CreateSkillDto, UpdateSkillDto, AddXpDto } from './dto';

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillController {
	constructor(private readonly skillService: SkillService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query('branch') branch?: string) {
		if (branch) {
			const skills = await this.skillService.findByBranch(user.userId, branch);
			return { skills };
		}
		const skills = await this.skillService.findAll(user.userId);
		return { skills };
	}

	@Get('stats')
	async getStats(@CurrentUser() user: CurrentUserData) {
		const stats = await this.skillService.getUserStats(user.userId);
		return { stats };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const skill = await this.skillService.findByIdOrThrow(id, user.userId);
		return { skill };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateSkillDto) {
		const skill = await this.skillService.create(user.userId, dto);
		return { skill };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateSkillDto
	) {
		const skill = await this.skillService.update(id, user.userId, dto);
		return { skill };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.skillService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/xp')
	async addXp(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: AddXpDto
	) {
		const result = await this.skillService.addXp(id, user.userId, dto);
		return result;
	}
}
