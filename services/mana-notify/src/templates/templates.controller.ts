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
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { TemplatesService, RenderedTemplate } from './templates.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { Template } from '../db/schema';

class CreateTemplateDto {
	slug!: string;
	channel!: 'email' | 'push' | 'matrix' | 'webhook';
	subject?: string;
	bodyTemplate!: string;
	locale?: string;
	appId?: string;
	variables?: Record<string, string>;
}

class UpdateTemplateDto {
	subject?: string;
	bodyTemplate?: string;
	isActive?: boolean;
	variables?: Record<string, string>;
}

class PreviewTemplateDto {
	subject?: string;
	bodyTemplate!: string;
	data!: Record<string, unknown>;
}

@Controller('templates')
@UseGuards(ServiceAuthGuard)
export class TemplatesController {
	constructor(private readonly templatesService: TemplatesService) {}

	@Get()
	async listTemplates(@Query('appId') appId?: string): Promise<{ templates: Template[] }> {
		const templatesList = await this.templatesService.listTemplates(appId);
		return { templates: templatesList };
	}

	@Get(':slug')
	async getTemplate(
		@Param('slug') slug: string,
		@Query('locale') locale: string = 'de-DE'
	): Promise<{ template: Template | null }> {
		const template = await this.templatesService.getTemplate(slug, locale);
		return { template };
	}

	@Post()
	async createTemplate(@Body() dto: CreateTemplateDto): Promise<{ template: Template }> {
		const template = await this.templatesService.createTemplate({
			slug: dto.slug,
			channel: dto.channel,
			subject: dto.subject,
			bodyTemplate: dto.bodyTemplate,
			locale: dto.locale || 'de-DE',
			appId: dto.appId,
			variables: dto.variables,
			isActive: true,
			isSystem: false,
		});
		return { template };
	}

	@Put(':slug')
	async updateTemplate(
		@Param('slug') slug: string,
		@Query('locale') locale: string = 'de-DE',
		@Body() dto: UpdateTemplateDto
	): Promise<{ template: Template }> {
		const template = await this.templatesService.updateTemplate(slug, locale, dto);
		return { template };
	}

	@Delete(':slug')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteTemplate(
		@Param('slug') slug: string,
		@Query('locale') locale: string = 'de-DE'
	): Promise<void> {
		await this.templatesService.deleteTemplate(slug, locale);
	}

	@Post(':slug/preview')
	async previewTemplate(
		@Param('slug') slug: string,
		@Query('locale') locale: string = 'de-DE',
		@Body() dto: { data: Record<string, unknown> }
	): Promise<{ preview: RenderedTemplate | null }> {
		const preview = await this.templatesService.renderBySlug(slug, dto.data, locale);
		return { preview };
	}

	@Post('preview')
	async previewCustomTemplate(
		@Body() dto: PreviewTemplateDto
	): Promise<{ preview: RenderedTemplate }> {
		const preview = this.templatesService.previewTemplate(
			dto.subject || null,
			dto.bodyTemplate,
			dto.data
		);
		return { preview };
	}
}
