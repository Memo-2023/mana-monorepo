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
import { LabelService } from './label.service';
import {
	CreateLabelDto,
	UpdateLabelDto,
	LabelQueryDto,
	AddLabelsDto,
	RemoveLabelsDto,
} from './dto/label.dto';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelController {
	constructor(private readonly labelService: LabelService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: LabelQueryDto) {
		const labels = await this.labelService.findByUserId(user.userId, query);
		return { labels };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const label = await this.labelService.findById(id, user.userId);
		if (!label) {
			return { label: null };
		}
		return { label };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateLabelDto) {
		const label = await this.labelService.create({
			...dto,
			userId: user.userId,
		});
		return { label };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateLabelDto
	) {
		const label = await this.labelService.update(id, user.userId, dto);
		return { label };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.labelService.delete(id, user.userId);
		return { success: true };
	}

	// Email-Label associations
	@Get('/email/:emailId')
	async getEmailLabels(
		@CurrentUser() user: CurrentUserData,
		@Param('emailId', ParseUUIDPipe) emailId: string
	) {
		const labels = await this.labelService.getEmailLabels(emailId, user.userId);
		return { labels };
	}

	@Post('/email/:emailId/add')
	async addLabelsToEmail(
		@CurrentUser() user: CurrentUserData,
		@Param('emailId', ParseUUIDPipe) emailId: string,
		@Body() dto: AddLabelsDto
	) {
		await this.labelService.addLabelsToEmail(emailId, dto.labelIds, user.userId);
		return { success: true };
	}

	@Post('/email/:emailId/remove')
	async removeLabelsFromEmail(
		@CurrentUser() user: CurrentUserData,
		@Param('emailId', ParseUUIDPipe) emailId: string,
		@Body() dto: RemoveLabelsDto
	) {
		await this.labelService.removeLabelsFromEmail(emailId, dto.labelIds, user.userId);
		return { success: true };
	}

	@Post('/email/:emailId/set')
	async setEmailLabels(
		@CurrentUser() user: CurrentUserData,
		@Param('emailId', ParseUUIDPipe) emailId: string,
		@Body() dto: AddLabelsDto
	) {
		await this.labelService.setEmailLabels(emailId, dto.labelIds, user.userId);
		return { success: true };
	}
}
