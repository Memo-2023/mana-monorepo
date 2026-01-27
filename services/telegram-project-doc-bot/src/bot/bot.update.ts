import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { ProjectService } from '../project/project.service';
import { MediaService } from '../media/media.service';
import { GenerationService } from '../generation/generation.service';
import { BLOG_STYLES } from '../config/configuration';

interface PhotoSize {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	file_size?: number;
}

interface Voice {
	file_id: string;
	file_unique_id: string;
	duration: number;
	mime_type?: string;
	file_size?: number;
}

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);
	private readonly allowedUsers: number[];

	// Active project per user (userId -> projectId)
	private activeProjects: Map<number, string> = new Map();

	constructor(
		private readonly projectService: ProjectService,
		private readonly mediaService: MediaService,
		private readonly generationService: GenerationService,
		private configService: ConfigService
	) {
		this.allowedUsers = this.configService.get<number[]>('telegram.allowedUsers') || [];
	}

	private isAllowed(userId: number): boolean {
		if (this.allowedUsers.length === 0) return true;
		return this.allowedUsers.includes(userId);
	}

	private formatHelp(): string {
		const styles = Object.entries(BLOG_STYLES)
			.map(([key, value]) => `• <code>${key}</code> - ${value.name}`)
			.join('\n');

		return `<b>📸 Project Doc Bot</b>

Sammle Fotos, Sprachnotizen und Text für deine Projekte und erstelle daraus Blogbeiträge.

<b>Projekt-Commands:</b>
/new [Name] - Neues Projekt starten
/projects - Alle Projekte anzeigen
/switch [ID] - Projekt wechseln
/status - Status des aktiven Projekts
/archive - Aktives Projekt archivieren

<b>Content:</b>
📷 Foto senden - Wird gespeichert
🎤 Sprachnotiz - Wird transkribiert
💬 Text-Nachricht - Als Notiz gespeichert

<b>Generierung:</b>
/generate - Blogbeitrag erstellen
/generate [Stil] - Mit bestimmtem Stil
/styles - Verfügbare Stile anzeigen
/export - Letzte Generierung exportieren

<b>Verfügbare Stile:</b>
${styles}

<b>Tipp:</b> Starte mit /new Projektname`;
	}

	@Start()
	async start(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		this.logger.log(`/start from user ${userId}`);
		await ctx.replyWithHTML(this.formatHelp());
	}

	@Help()
	async help(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		await ctx.replyWithHTML(this.formatHelp());
	}

	@Command('new')
	async newProject(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const name = text.replace('/new', '').trim();
		if (!name) {
			await ctx.reply('Verwendung: /new Projektname\n\nBeispiel: /new Gartenhaus-Renovierung');
			return;
		}

		try {
			this.logger.log(`Creating project "${name}" for user ${userId}`);

			const project = await this.projectService.create({
				telegramUserId: userId,
				name,
			});

			this.activeProjects.set(userId, project.id);
			this.logger.log(`User ${userId} created project "${name}" with id ${project.id}`);

			await ctx.replyWithHTML(
				`✅ <b>Projekt erstellt!</b>\n\n` +
					`<b>Name:</b> ${project.name}\n` +
					`<b>ID:</b> <code>${project.id.slice(0, 8)}</code>\n\n` +
					`Sende jetzt:\n` +
					`📷 Fotos\n` +
					`🎤 Sprachnotizen\n` +
					`💬 Text-Nachrichten\n\n` +
					`Mit /generate erstellst du den Blogbeitrag.`
			);
		} catch (error) {
			this.logger.error('Failed to create project:', error);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await ctx.reply(`Fehler beim Erstellen des Projekts: ${errorMsg}`);
		}
	}

	@Command('projects')
	async listProjects(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const projects = await this.projectService.findByUser(userId);

		if (projects.length === 0) {
			await ctx.reply('Keine Projekte gefunden.\n\nStarte mit: /new Projektname');
			return;
		}

		const activeId = this.activeProjects.get(userId);

		const projectList = await Promise.all(
			projects.map(async (p) => {
				const stats = await this.projectService.getStats(p.id);
				const active = p.id === activeId ? ' ✓' : '';
				const status = p.status === 'archived' ? ' 📦' : '';
				return `• <b>${p.name}</b>${active}${status}\n  ID: <code>${p.id.slice(0, 8)}</code> | ${stats.total} Einträge`;
			})
		);

		await ctx.replyWithHTML(
			`<b>📂 Deine Projekte:</b>\n\n${projectList.join('\n\n')}\n\n` + `Wechseln mit: /switch [ID]`
		);
	}

	@Command('switch')
	async switchProject(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const idPrefix = text.replace('/switch', '').trim();
		if (!idPrefix) {
			await ctx.reply('Verwendung: /switch [ID]\n\nZeige Projekte mit /projects');
			return;
		}

		// Find project by ID prefix
		const projects = await this.projectService.findByUser(userId);
		const project = projects.find((p) => p.id.startsWith(idPrefix));

		if (!project) {
			await ctx.reply(`Projekt mit ID "${idPrefix}" nicht gefunden.`);
			return;
		}

		this.activeProjects.set(userId, project.id);
		const stats = await this.projectService.getStats(project.id);

		await ctx.replyWithHTML(
			`✅ Gewechselt zu: <b>${project.name}</b>\n\n` +
				`📷 ${stats.photos} Fotos\n` +
				`🎤 ${stats.voices} Sprachnotizen\n` +
				`📝 ${stats.texts} Textnotizen`
		);
	}

	@Command('status')
	async status(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const projectId = this.activeProjects.get(userId);
		if (!projectId) {
			await ctx.reply('Kein aktives Projekt.\n\nStarte mit: /new Projektname');
			return;
		}

		const project = await this.projectService.findById(projectId);
		if (!project) {
			this.activeProjects.delete(userId);
			await ctx.reply('Projekt nicht gefunden. Starte ein neues mit /new');
			return;
		}

		const stats = await this.projectService.getStats(projectId);
		const latest = await this.generationService.getLatestGeneration(projectId);

		let statusText =
			`<b>📊 Projekt-Status</b>\n\n` +
			`<b>Name:</b> ${project.name}\n` +
			`<b>Status:</b> ${project.status}\n` +
			`<b>Erstellt:</b> ${project.createdAt.toLocaleDateString('de-DE')}\n\n` +
			`<b>Inhalte:</b>\n` +
			`📷 ${stats.photos} Fotos\n` +
			`🎤 ${stats.voices} Sprachnotizen\n` +
			`📝 ${stats.texts} Textnotizen\n` +
			`<b>Gesamt:</b> ${stats.total} Einträge`;

		if (latest) {
			statusText += `\n\n<b>Letzte Generierung:</b>\n${latest.createdAt.toLocaleString('de-DE')} (${latest.style})`;
		}

		await ctx.replyWithHTML(statusText);
	}

	@Command('archive')
	async archiveProject(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const projectId = this.activeProjects.get(userId);
		if (!projectId) {
			await ctx.reply('Kein aktives Projekt.');
			return;
		}

		await this.projectService.update(projectId, { status: 'archived' });
		this.activeProjects.delete(userId);

		await ctx.reply('📦 Projekt archiviert.\n\nStarte ein neues mit /new');
	}

	@Command('styles')
	async showStyles(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const styles = Object.entries(BLOG_STYLES)
			.map(
				([key, value]) => `<b>${key}</b> - ${value.name}\n<i>${value.prompt.slice(0, 80)}...</i>`
			)
			.join('\n\n');

		await ctx.replyWithHTML(
			`<b>📝 Verfügbare Blog-Stile:</b>\n\n${styles}\n\nVerwendung: /generate [stil]`
		);
	}

	@Command('generate')
	async generate(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const projectId = this.activeProjects.get(userId);
		if (!projectId) {
			await ctx.reply('Kein aktives Projekt.\n\nStarte mit: /new Projektname');
			return;
		}

		const style = text.replace('/generate', '').trim().toLowerCase() || 'casual';
		const validStyles = Object.keys(BLOG_STYLES);

		if (!validStyles.includes(style)) {
			await ctx.reply(
				`Unbekannter Stil: "${style}"\n\nVerfügbar: ${validStyles.join(', ')}\n\nZeige Details mit /styles`
			);
			return;
		}

		await ctx.reply('🚀 Generiere Blogbeitrag...\n\nDas kann einen Moment dauern.');
		await ctx.sendChatAction('typing');

		try {
			const content = await this.generationService.generateBlogpost(
				projectId,
				style as keyof typeof BLOG_STYLES
			);

			// Split if too long for Telegram
			if (content.length <= 4000) {
				await ctx.reply(content);
			} else {
				// Send as document
				const buffer = Buffer.from(content, 'utf-8');
				await ctx.replyWithDocument(
					{
						source: buffer,
						filename: 'blogpost.md',
					},
					{
						caption: '📄 Blogbeitrag (zu lang für Telegram-Nachricht)',
					}
				);

				// Also send a preview
				const preview = content.slice(0, 1000) + '\n\n[...gekürzt, siehe Datei]';
				await ctx.reply(preview);
			}

			await ctx.reply('✅ Blogbeitrag erstellt!\n\nExportieren mit /export');
		} catch (error) {
			this.logger.error('Generation failed:', error);
			const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await ctx.reply(`❌ Fehler: ${message}`);
		}
	}

	@Command('export')
	async exportGeneration(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const projectId = this.activeProjects.get(userId);
		if (!projectId) {
			await ctx.reply('Kein aktives Projekt.');
			return;
		}

		const latest = await this.generationService.getLatestGeneration(projectId);
		if (!latest) {
			await ctx.reply('Noch kein Blogbeitrag generiert.\n\nErstelle einen mit /generate');
			return;
		}

		const project = await this.projectService.findById(projectId);
		const filename = `${project?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'blogpost'}.md`;

		const buffer = Buffer.from(latest.content, 'utf-8');
		await ctx.replyWithDocument(
			{
				source: buffer,
				filename,
			},
			{
				caption: `📄 ${filename}\nGeneriert: ${latest.createdAt.toLocaleString('de-DE')}`,
			}
		);
	}

	@On('photo')
	async onPhoto(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const projectId = this.activeProjects.get(userId);
		if (!projectId) {
			await ctx.reply('Kein aktives Projekt.\n\nStarte mit: /new Projektname');
			return;
		}

		const message = ctx.message as { photo?: PhotoSize[]; caption?: string };
		const photos = message.photo;
		if (!photos || photos.length === 0) return;

		// Get largest photo
		const photo = photos[photos.length - 1];
		const caption = message.caption;

		await ctx.sendChatAction('upload_photo');

		try {
			await this.mediaService.processPhoto(projectId, photo.file_id, caption);

			const stats = await this.projectService.getStats(projectId);
			await ctx.reply(`📷 Foto gespeichert! (${stats.photos} Fotos gesamt)`);
		} catch (error) {
			this.logger.error('Failed to process photo:', error);
			await ctx.reply('❌ Fehler beim Speichern des Fotos.');
		}
	}

	@On('voice')
	async onVoice(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const projectId = this.activeProjects.get(userId);
		if (!projectId) {
			await ctx.reply('Kein aktives Projekt.\n\nStarte mit: /new Projektname');
			return;
		}

		const message = ctx.message as { voice?: Voice };
		const voice = message.voice;
		if (!voice) return;

		await ctx.reply('🎤 Verarbeite Sprachnotiz...');
		await ctx.sendChatAction('typing');

		try {
			const item = await this.mediaService.processVoice(projectId, voice.file_id, voice.duration);

			const stats = await this.projectService.getStats(projectId);
			let reply = `✅ Sprachnotiz gespeichert! (${stats.voices} gesamt)`;

			if (item.transcription) {
				reply += `\n\n📝 Transkription:\n"${item.transcription}"`;
			}

			await ctx.reply(reply);
		} catch (error) {
			this.logger.error('Failed to process voice:', error);
			await ctx.reply('❌ Fehler beim Verarbeiten der Sprachnotiz.');
		}
	}

	@On('text')
	async onText(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		// Ignore commands
		if (text.startsWith('/')) return;

		const projectId = this.activeProjects.get(userId);
		if (!projectId) {
			// No active project - show hint
			await ctx.reply('💡 Tipp: Starte ein Projekt mit /new Projektname');
			return;
		}

		try {
			await this.mediaService.addTextNote(projectId, text);

			const stats = await this.projectService.getStats(projectId);
			await ctx.reply(`📝 Notiz gespeichert! (${stats.texts} Notizen gesamt)`);
		} catch (error) {
			this.logger.error('Failed to add text note:', error);
			await ctx.reply('❌ Fehler beim Speichern der Notiz.');
		}
	}
}
