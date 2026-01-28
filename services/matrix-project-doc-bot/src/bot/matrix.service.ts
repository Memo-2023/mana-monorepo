import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichConsoleLogger,
	LogService,
	LogLevel,
} from 'matrix-bot-sdk';
import { ProjectService } from '../project/project.service';
import { MediaService } from '../media/media.service';
import { GenerationService } from '../generation/generation.service';
import { BLOG_STYLES } from '../config/configuration';

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client!: MatrixClient;
	private botUserId: string = '';
	private readonly allowedUsers: string[];

	// Active project per user (matrixUserId -> projectId)
	private activeProjects: Map<string, string> = new Map();

	constructor(
		private configService: ConfigService,
		private projectService: ProjectService,
		private mediaService: MediaService,
		private generationService: GenerationService
	) {
		this.allowedUsers = this.configService.get<string[]>('matrix.allowedUsers') || [];
	}

	async onModuleInit() {
		const homeserverUrl = this.configService.get<string>('matrix.homeserverUrl');
		const accessToken = this.configService.get<string>('matrix.accessToken');
		const storagePath = this.configService.get<string>('matrix.storagePath');

		if (!accessToken) {
			this.logger.error('MATRIX_ACCESS_TOKEN is required');
			return;
		}

		LogService.setLogger(new RichConsoleLogger());
		LogService.setLevel(LogLevel.INFO);

		const storage = new SimpleFsStorageProvider(storagePath || './data/bot-storage.json');
		this.client = new MatrixClient(homeserverUrl!, accessToken, storage);

		AutojoinRoomsMixin.setupOnClient(this.client);

		this.botUserId = await this.client.getUserId();
		this.logger.log(`Bot user ID: ${this.botUserId}`);

		this.client.on('room.message', this.handleRoomMessage.bind(this));

		await this.client.start();
		this.logger.log('Matrix Project Doc Bot started successfully');
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.stop();
		}
	}

	private isAllowed(userId: string): boolean {
		if (this.allowedUsers.length === 0) return true;
		return this.allowedUsers.includes(userId);
	}

	private async handleRoomMessage(roomId: string, event: any) {
		if (event.sender === this.botUserId) return;
		if (!this.isAllowed(event.sender)) return;

		const content = event.content as { msgtype?: string; body?: string; url?: string; info?: any };
		const msgtype = content.msgtype;

		if (msgtype === 'm.text') {
			const body = content.body || '';
			if (body.startsWith('!')) {
				await this.handleCommand(roomId, event.sender, body);
			} else {
				await this.handleTextMessage(roomId, event.sender, body);
			}
		} else if (msgtype === 'm.image') {
			await this.handleImage(roomId, event.sender, content);
		} else if (msgtype === 'm.audio') {
			await this.handleAudio(roomId, event.sender, content);
		}
	}

	private async handleCommand(roomId: string, sender: string, body: string) {
		const [command, ...args] = body.slice(1).split(' ');
		const argString = args.join(' ');

		switch (command.toLowerCase()) {
			case 'help':
			case 'start':
				await this.sendHelp(roomId);
				break;
			case 'new':
				await this.createProject(roomId, sender, argString);
				break;
			case 'projects':
				await this.listProjects(roomId, sender);
				break;
			case 'switch':
				await this.switchProject(roomId, sender, argString);
				break;
			case 'status':
				await this.showStatus(roomId, sender);
				break;
			case 'archive':
				await this.archiveProject(roomId, sender);
				break;
			case 'styles':
				await this.showStyles(roomId);
				break;
			case 'generate':
				await this.generateBlogpost(roomId, sender, argString);
				break;
			case 'export':
				await this.exportGeneration(roomId, sender);
				break;
			default:
				await this.sendMessage(roomId, `Unbekannter Befehl: !${command}\n\nVerwende !help`);
		}
	}

	private async sendHelp(roomId: string) {
		const styles = Object.entries(BLOG_STYLES)
			.map(([key, value]) => `- \`${key}\` - ${value.name}`)
			.join('\n');

		const helpText = `**📸 Project Doc Bot (DSGVO-konform)**

Sammle Fotos, Sprachnotizen und Text für deine Projekte und erstelle daraus Blogbeiträge.

**Projekt-Commands:**
- \`!new [Name]\` - Neues Projekt starten
- \`!projects\` - Alle Projekte anzeigen
- \`!switch [ID]\` - Projekt wechseln
- \`!status\` - Status des aktiven Projekts
- \`!archive\` - Aktives Projekt archivieren

**Content:**
📷 Foto senden - Wird gespeichert
🎤 Sprachnotiz - Wird transkribiert
💬 Text-Nachricht - Als Notiz gespeichert

**Generierung:**
- \`!generate\` - Blogbeitrag erstellen
- \`!generate [Stil]\` - Mit bestimmtem Stil
- \`!styles\` - Verfügbare Stile anzeigen
- \`!export\` - Letzte Generierung exportieren

**Verfügbare Stile:**
${styles}

**Tipp:** Starte mit \`!new Projektname\``;

		await this.sendMessage(roomId, helpText);
	}

	private async createProject(roomId: string, sender: string, name: string) {
		if (!name) {
			await this.sendMessage(
				roomId,
				'Verwendung: `!new Projektname`\n\nBeispiel: `!new Gartenhaus-Renovierung`'
			);
			return;
		}

		try {
			const project = await this.projectService.create({
				matrixUserId: sender,
				name,
			});

			this.activeProjects.set(sender, project.id);

			await this.sendMessage(
				roomId,
				`✅ **Projekt erstellt!**\n\n**Name:** ${project.name}\n**ID:** \`${project.id.slice(0, 8)}\`\n\nSende jetzt:\n📷 Fotos\n🎤 Sprachnotizen\n💬 Text-Nachrichten\n\nMit \`!generate\` erstellst du den Blogbeitrag.`
			);
		} catch (error) {
			this.logger.error('Failed to create project:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`
			);
		}
	}

	private async listProjects(roomId: string, sender: string) {
		const projects = await this.projectService.findByUser(sender);

		if (projects.length === 0) {
			await this.sendMessage(roomId, 'Keine Projekte gefunden.\n\nStarte mit: `!new Projektname`');
			return;
		}

		const activeId = this.activeProjects.get(sender);

		const projectList = await Promise.all(
			projects.map(async (p) => {
				const stats = await this.projectService.getStats(p.id);
				const active = p.id === activeId ? ' ✓' : '';
				const status = p.status === 'archived' ? ' 📦' : '';
				return `- **${p.name}**${active}${status}\n  ID: \`${p.id.slice(0, 8)}\` | ${stats.total} Einträge`;
			})
		);

		await this.sendMessage(
			roomId,
			`**📂 Deine Projekte:**\n\n${projectList.join('\n\n')}\n\nWechseln mit: \`!switch [ID]\``
		);
	}

	private async switchProject(roomId: string, sender: string, idPrefix: string) {
		if (!idPrefix) {
			await this.sendMessage(
				roomId,
				'Verwendung: `!switch [ID]`\n\nZeige Projekte mit `!projects`'
			);
			return;
		}

		const projects = await this.projectService.findByUser(sender);
		const project = projects.find((p) => p.id.startsWith(idPrefix));

		if (!project) {
			await this.sendMessage(roomId, `Projekt mit ID "${idPrefix}" nicht gefunden.`);
			return;
		}

		this.activeProjects.set(sender, project.id);
		const stats = await this.projectService.getStats(project.id);

		await this.sendMessage(
			roomId,
			`✅ Gewechselt zu: **${project.name}**\n\n📷 ${stats.photos} Fotos\n🎤 ${stats.voices} Sprachnotizen\n📝 ${stats.texts} Textnotizen`
		);
	}

	private async showStatus(roomId: string, sender: string) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.\n\nStarte mit: `!new Projektname`');
			return;
		}

		const project = await this.projectService.findById(projectId);
		if (!project) {
			this.activeProjects.delete(sender);
			await this.sendMessage(roomId, 'Projekt nicht gefunden. Starte ein neues mit `!new`');
			return;
		}

		const stats = await this.projectService.getStats(projectId);
		const latest = await this.generationService.getLatestGeneration(projectId);

		let statusText = `**📊 Projekt-Status**\n\n**Name:** ${project.name}\n**Status:** ${project.status}\n**Erstellt:** ${project.createdAt.toLocaleDateString('de-DE')}\n\n**Inhalte:**\n📷 ${stats.photos} Fotos\n🎤 ${stats.voices} Sprachnotizen\n📝 ${stats.texts} Textnotizen\n**Gesamt:** ${stats.total} Einträge`;

		if (latest) {
			statusText += `\n\n**Letzte Generierung:**\n${latest.createdAt.toLocaleString('de-DE')} (${latest.style})`;
		}

		await this.sendMessage(roomId, statusText);
	}

	private async archiveProject(roomId: string, sender: string) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.');
			return;
		}

		await this.projectService.update(projectId, { status: 'archived' });
		this.activeProjects.delete(sender);

		await this.sendMessage(roomId, '📦 Projekt archiviert.\n\nStarte ein neues mit `!new`');
	}

	private async showStyles(roomId: string) {
		const styles = Object.entries(BLOG_STYLES)
			.map(([key, value]) => `**${key}** - ${value.name}\n_${value.prompt.slice(0, 80)}..._`)
			.join('\n\n');

		await this.sendMessage(
			roomId,
			`**📝 Verfügbare Blog-Stile:**\n\n${styles}\n\nVerwendung: \`!generate [stil]\``
		);
	}

	private async generateBlogpost(roomId: string, sender: string, style: string) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.\n\nStarte mit: `!new Projektname`');
			return;
		}

		const selectedStyle = (style.toLowerCase() || 'casual') as keyof typeof BLOG_STYLES;
		const validStyles = Object.keys(BLOG_STYLES);

		if (!validStyles.includes(selectedStyle)) {
			await this.sendMessage(
				roomId,
				`Unbekannter Stil: "${style}"\n\nVerfügbar: ${validStyles.join(', ')}\n\nZeige Details mit \`!styles\``
			);
			return;
		}

		await this.sendMessage(roomId, '🚀 Generiere Blogbeitrag...\n\nDas kann einen Moment dauern.');
		await this.client.setTyping(roomId, true, 60000);

		try {
			const content = await this.generationService.generateBlogpost(projectId, selectedStyle);
			await this.client.setTyping(roomId, false);

			await this.sendMessage(roomId, content);
			await this.sendMessage(roomId, '✅ Blogbeitrag erstellt!\n\nExportieren mit `!export`');
		} catch (error) {
			await this.client.setTyping(roomId, false);
			this.logger.error('Generation failed:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`
			);
		}
	}

	private async exportGeneration(roomId: string, sender: string) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.');
			return;
		}

		const latest = await this.generationService.getLatestGeneration(projectId);
		if (!latest) {
			await this.sendMessage(
				roomId,
				'Noch kein Blogbeitrag generiert.\n\nErstelle einen mit `!generate`'
			);
			return;
		}

		const project = await this.projectService.findById(projectId);
		const filename = `${project?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'blogpost'}.md`;

		// Upload file to Matrix
		const buffer = Buffer.from(latest.content, 'utf-8');
		const mxcUrl = await this.client.uploadContent(buffer, 'text/markdown', filename);

		await this.client.sendMessage(roomId, {
			msgtype: 'm.file',
			body: filename,
			url: mxcUrl,
			info: {
				mimetype: 'text/markdown',
				size: buffer.length,
			},
		});
	}

	private async handleTextMessage(roomId: string, sender: string, text: string) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, '💡 Tipp: Starte ein Projekt mit `!new Projektname`');
			return;
		}

		try {
			await this.mediaService.addTextNote(projectId, text);
			const stats = await this.projectService.getStats(projectId);
			await this.sendMessage(roomId, `📝 Notiz gespeichert! (${stats.texts} Notizen gesamt)`);
		} catch (error) {
			this.logger.error('Failed to add text note:', error);
			await this.sendMessage(roomId, '❌ Fehler beim Speichern der Notiz.');
		}
	}

	private async handleImage(roomId: string, sender: string, content: any) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.\n\nStarte mit: `!new Projektname`');
			return;
		}

		try {
			const mxcUrl = content.url;
			const httpUrl = this.client.mxcToHttp(mxcUrl);
			const response = await fetch(httpUrl);
			const buffer = Buffer.from(await response.arrayBuffer());
			const contentType = content.info?.mimetype || 'image/jpeg';

			await this.mediaService.processPhoto(projectId, buffer, contentType, mxcUrl, content.body);

			const stats = await this.projectService.getStats(projectId);
			await this.sendMessage(roomId, `📷 Foto gespeichert! (${stats.photos} Fotos gesamt)`);
		} catch (error) {
			this.logger.error('Failed to process image:', error);
			await this.sendMessage(roomId, '❌ Fehler beim Speichern des Fotos.');
		}
	}

	private async handleAudio(roomId: string, sender: string, content: any) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.\n\nStarte mit: `!new Projektname`');
			return;
		}

		await this.sendMessage(roomId, '🎤 Verarbeite Sprachnotiz...');

		try {
			const mxcUrl = content.url;
			const httpUrl = this.client.mxcToHttp(mxcUrl);
			const response = await fetch(httpUrl);
			const buffer = Buffer.from(await response.arrayBuffer());
			const contentType = content.info?.mimetype || 'audio/ogg';
			const duration = Math.round((content.info?.duration || 0) / 1000);

			const item = await this.mediaService.processVoice(
				projectId,
				buffer,
				contentType,
				mxcUrl,
				duration
			);

			const stats = await this.projectService.getStats(projectId);
			let reply = `✅ Sprachnotiz gespeichert! (${stats.voices} gesamt)`;

			if (item.content) {
				reply += `\n\n📝 Transkription:\n"${item.content}"`;
			}

			await this.sendMessage(roomId, reply);
		} catch (error) {
			this.logger.error('Failed to process audio:', error);
			await this.sendMessage(roomId, '❌ Fehler beim Verarbeiten der Sprachnotiz.');
		}
	}

	private async sendMessage(roomId: string, message: string) {
		const htmlBody = this.markdownToHtml(message);

		await this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: message,
			format: 'org.matrix.custom.html',
			formatted_body: htmlBody,
		});
	}

	private markdownToHtml(markdown: string): string {
		return markdown
			.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/_([^_]+)_/g, '<em>$1</em>')
			.replace(/\n/g, '<br/>');
	}
}
