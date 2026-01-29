import { Injectable, Logger, Inject, OnModuleInit, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_CONNECTION } from '../db/database.module';
import { templates, type Template, type NewTemplate } from '../db/schema';

export interface RenderedTemplate {
	subject: string;
	body: string;
}

interface DefaultTemplate {
	slug: string;
	channel: 'email' | 'push' | 'matrix' | 'webhook';
	subject?: string;
	bodyFile: string;
	variables: Record<string, string>;
}

@Injectable()
export class TemplatesService implements OnModuleInit {
	private readonly logger = new Logger(TemplatesService.name);
	private readonly defaultTemplates: DefaultTemplate[] = [
		{
			slug: 'auth-password-reset',
			channel: 'email',
			subject: 'Passwort zurücksetzen - ManaCore',
			bodyFile: 'password-reset.hbs',
			variables: { resetUrl: 'URL to reset password', userName: 'User display name' },
		},
		{
			slug: 'auth-verification',
			channel: 'email',
			subject: 'E-Mail bestätigen - ManaCore',
			bodyFile: 'verification.hbs',
			variables: { verificationUrl: 'URL to verify email', userName: 'User display name' },
		},
		{
			slug: 'auth-welcome',
			channel: 'email',
			subject: 'Willkommen bei ManaCore!',
			bodyFile: 'welcome.hbs',
			variables: { userName: 'User display name', loginUrl: 'URL to login' },
		},
		{
			slug: 'calendar-reminder',
			channel: 'email',
			subject: 'Erinnerung: {{eventTitle}}',
			bodyFile: 'reminder.hbs',
			variables: {
				eventTitle: 'Event title',
				eventTime: 'Event start time',
				eventLocation: 'Event location',
				eventUrl: 'URL to view event',
			},
		},
	];

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

	async onModuleInit() {
		await this.seedDefaultTemplates();
	}

	private async seedDefaultTemplates(): Promise<void> {
		this.logger.log('Checking default templates...');

		for (const defaultTemplate of this.defaultTemplates) {
			const existing = await this.db
				.select()
				.from(templates)
				.where(and(eq(templates.slug, defaultTemplate.slug), eq(templates.locale, 'de-DE')))
				.limit(1);

			if (existing.length === 0) {
				this.logger.log(`Creating default template: ${defaultTemplate.slug}`);

				const bodyTemplate = this.loadDefaultTemplate(defaultTemplate.bodyFile);

				await this.db.insert(templates).values({
					slug: defaultTemplate.slug,
					channel: defaultTemplate.channel,
					subject: defaultTemplate.subject,
					bodyTemplate,
					locale: 'de-DE',
					isActive: true,
					isSystem: true,
					variables: defaultTemplate.variables,
				});
			}
		}

		this.logger.log('Default templates initialized');
	}

	private loadDefaultTemplate(filename: string): string {
		// Try multiple paths for flexibility
		const paths = [
			path.join(__dirname, 'defaults', filename),
			path.join(process.cwd(), 'src', 'templates', 'defaults', filename),
			path.join(process.cwd(), 'dist', 'templates', 'defaults', filename),
		];

		for (const templatePath of paths) {
			try {
				if (fs.existsSync(templatePath)) {
					return fs.readFileSync(templatePath, 'utf-8');
				}
			} catch {
				// Continue to next path
			}
		}

		this.logger.warn(`Default template not found: ${filename}, using placeholder`);
		return `<p>Template content for ${filename}</p>`;
	}

	async getTemplate(slug: string, locale: string = 'de-DE'): Promise<Template | null> {
		const [template] = await this.db
			.select()
			.from(templates)
			.where(
				and(eq(templates.slug, slug), eq(templates.locale, locale), eq(templates.isActive, true))
			)
			.limit(1);

		// Fallback to de-DE if locale not found
		if (!template && locale !== 'de-DE') {
			return this.getTemplate(slug, 'de-DE');
		}

		return template || null;
	}

	async getTemplateById(id: string): Promise<Template | null> {
		const [template] = await this.db.select().from(templates).where(eq(templates.id, id)).limit(1);

		return template || null;
	}

	async listTemplates(appId?: string): Promise<Template[]> {
		if (appId) {
			return this.db
				.select()
				.from(templates)
				.where(eq(templates.appId, appId))
				.orderBy(templates.slug);
		}

		return this.db.select().from(templates).orderBy(templates.slug);
	}

	async createTemplate(data: NewTemplate): Promise<Template> {
		const [template] = await this.db.insert(templates).values(data).returning();
		return template;
	}

	async updateTemplate(
		slug: string,
		locale: string,
		data: Partial<NewTemplate>
	): Promise<Template> {
		const existing = await this.getTemplate(slug, locale);
		if (!existing) {
			throw new NotFoundException(`Template ${slug} not found for locale ${locale}`);
		}

		if (existing.isSystem && data.isActive === false) {
			throw new Error('Cannot deactivate system templates');
		}

		const [updated] = await this.db
			.update(templates)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(templates.slug, slug), eq(templates.locale, locale)))
			.returning();

		return updated;
	}

	async deleteTemplate(slug: string, locale: string): Promise<void> {
		const existing = await this.getTemplate(slug, locale);
		if (!existing) {
			throw new NotFoundException(`Template ${slug} not found for locale ${locale}`);
		}

		if (existing.isSystem) {
			throw new Error('Cannot delete system templates');
		}

		await this.db
			.delete(templates)
			.where(and(eq(templates.slug, slug), eq(templates.locale, locale)));
	}

	renderTemplate(template: Template, data: Record<string, unknown>): RenderedTemplate {
		const subjectTemplate = template.subject ? Handlebars.compile(template.subject) : null;
		const bodyTemplate = Handlebars.compile(template.bodyTemplate);

		return {
			subject: subjectTemplate ? subjectTemplate(data) : '',
			body: bodyTemplate(data),
		};
	}

	async renderBySlug(
		slug: string,
		data: Record<string, unknown>,
		locale: string = 'de-DE'
	): Promise<RenderedTemplate | null> {
		const template = await this.getTemplate(slug, locale);
		if (!template) {
			return null;
		}

		return this.renderTemplate(template, data);
	}

	previewTemplate(
		subject: string | null,
		bodyTemplate: string,
		data: Record<string, unknown>
	): RenderedTemplate {
		const subjectCompiled = subject ? Handlebars.compile(subject) : null;
		const bodyCompiled = Handlebars.compile(bodyTemplate);

		return {
			subject: subjectCompiled ? subjectCompiled(data) : '',
			body: bodyCompiled(data),
		};
	}
}
