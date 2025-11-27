import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import { TemplateService } from './template.service';
import { type Template } from '../db/schema/templates.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
	constructor(private readonly templateService: TemplateService) {}

	@Get()
	async getTemplates(@CurrentUser() user: CurrentUserData): Promise<Template[]> {
		const result = await this.templateService.getTemplates(user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get('default')
	async getDefaultTemplate(@CurrentUser() user: CurrentUserData): Promise<Template | null> {
		const result = await this.templateService.getDefaultTemplate(user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get(':id')
	async getTemplate(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Template> {
		const result = await this.templateService.getTemplate(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Post()
	async createTemplate(
		@Body()
		body: {
			name: string;
			description?: string;
			systemPrompt: string;
			initialQuestion?: string;
			modelId?: string;
			color?: string;
			documentMode?: boolean;
		},
		@CurrentUser() user: CurrentUserData
	): Promise<Template> {
		const result = await this.templateService.createTemplate(user.userId, body);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Patch(':id')
	async updateTemplate(
		@Param('id') id: string,
		@Body()
		body: Partial<{
			name: string;
			description: string;
			systemPrompt: string;
			initialQuestion: string;
			modelId: string;
			color: string;
			documentMode: boolean;
		}>,
		@CurrentUser() user: CurrentUserData
	): Promise<Template> {
		const result = await this.templateService.updateTemplate(id, user.userId, body);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Patch(':id/default')
	async setDefaultTemplate(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Template> {
		const result = await this.templateService.setDefaultTemplate(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Delete(':id')
	async deleteTemplate(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<{ success: boolean }> {
		const result = await this.templateService.deleteTemplate(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return { success: true };
	}
}
