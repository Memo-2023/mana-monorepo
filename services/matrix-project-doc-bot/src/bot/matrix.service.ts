import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { ProjectService } from '../project/project.service';
import { MediaService } from '../media/media.service';
import { GenerationService } from '../generation/generation.service';
import { SessionService, CreditService } from '@manacore/bot-services';
import { BLOG_STYLES } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly allowedUsers: string[];

	// Active project per user (matrixUserId -> projectId)
	private activeProjects: Map<string, string> = new Map();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['projekte', 'projects', 'meine projekte', 'liste'], command: 'projects' },
		{ keywords: ['archiv', 'archive', 'archivieren'], command: 'archive' },
		{ keywords: ['generieren', 'generate', 'erstellen', 'blogbeitrag'], command: 'generate' },
		{ keywords: ['exportieren', 'export', 'herunterladen', 'download'], command: 'export' },
		{ keywords: ['stile', 'styles', 'vorlagen', 'formate'], command: 'styles' },
		{ keywords: ['neu', 'new', 'neues projekt', 'projekt starten'], command: 'new' },
		{ keywords: ['wechseln', 'switch', 'umschalten'], command: 'switch' },
	]);

	constructor(
		configService: ConfigService,
		private projectService: ProjectService,
		private mediaService: MediaService,
		private generationService: GenerationService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {
		super(configService);
		this.allowedUsers = this.configService.get<string[]>('matrix.allowedUsers') || [];
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl:
				this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: [], // This bot uses allowedUsers instead
		};
	}

	private isAllowed(userId: string): boolean {
		if (this.allowedUsers.length === 0) return true;
		return this.allowedUsers.includes(userId);
	}

	/**
	 * Override onRoomMessage to handle images and audio in addition to text
	 */
	protected async onRoomMessage(roomId: string, event: MatrixRoomEvent): Promise<void> {
		// Ignore own messages
		if (event.sender === this.botUserId) return;

		// Check user permissions
		if (!this.isAllowed(event.sender)) return;

		const msgtype = event.content?.msgtype;

		try {
			if (msgtype === 'm.text') {
				const body = event.content.body || '';
				await this.handleTextMessage(roomId, event, body, event.sender);
			} else if (msgtype === 'm.image') {
				await this.handleImage(roomId, event.sender, {
					url: event.content.url || '',
					info: event.content.info as { mimetype?: string } | undefined,
					body: event.content.body,
				});
			} else if (msgtype === 'm.audio') {
				await this.handleAudio(roomId, event.sender, {
					url: event.content.url || '',
					info: event.content.info as { mimetype?: string; duration?: number } | undefined,
				});
			}
		} catch (error) {
			this.logger.error(`Error handling message: ${error}`);
			await this.sendMessage(roomId, 'Fehler bei der Verarbeitung der Nachricht.');
		}
	}

	protected async handleTextMessage(
		roomId: string,
		_event: MatrixRoomEvent,
		body: string,
		sender: string
	): Promise<void> {
		// Check for keyword commands first
		const keywordCommand = this.keywordDetector.detect(body);
		if (keywordCommand) {
			body = `!${keywordCommand}`;
		}

		if (body.startsWith('!')) {
			await this.handleCommand(roomId, sender, body);
		} else {
			await this.handleTextNote(roomId, sender, body);
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
			case 'auth':
			case 'account':
				await this.handleAuthStatus(roomId, sender);
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

		const helpText = `**Project Doc Bot (DSGVO-konform)**

Sammle Fotos, Sprachnotizen und Text für deine Projekte und erstelle daraus Blogbeiträge.

**Account:**
- \`!login email passwort\` - Anmelden
- \`!logout\` - Abmelden
- \`!auth\` - Account Status

**Projekt-Commands:**
- \`!new [Name]\` - Neues Projekt starten
- \`!projects\` - Alle Projekte anzeigen
- \`!switch [ID]\` - Projekt wechseln
- \`!status\` - Status des aktiven Projekts
- \`!archive\` - Aktives Projekt archivieren

**Content:**
Foto senden - Wird gespeichert
Sprachnotiz - Wird transkribiert
Text-Nachricht - Als Notiz gespeichert

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

	private async handleAuthStatus(roomId: string, sender: string) {
		const loggedIn = await this.sessionService.isLoggedIn(sender);
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let response = '**📋 Account Status**\n\n';

		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			response += `👤 Angemeldet als: ${session.email}\n`;
			response += `⚡ Credits: ${balance.balance.toFixed(2)}`;
		} else {
			response += `❌ Nicht angemeldet\n`;
			response += `Nutze \`!login email passwort\` zum Anmelden.`;
		}

		await this.sendMessage(roomId, response);
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
				`**Projekt erstellt!**\n\n**Name:** ${project.name}\n**ID:** \`${project.id.slice(0, 8)}\`\n\nSende jetzt:\nFotos\nSprachnotizen\nText-Nachrichten\n\nMit \`!generate\` erstellst du den Blogbeitrag.`
			);
		} catch (error) {
			this.logger.error('Failed to create project:', error);
			await this.sendMessage(
				roomId,
				`Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`
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
				const active = p.id === activeId ? ' (aktiv)' : '';
				const status = p.status === 'archived' ? ' [archiviert]' : '';
				return `- **${p.name}**${active}${status}\n  ID: \`${p.id.slice(0, 8)}\` | ${stats.total} Einträge`;
			})
		);

		await this.sendMessage(
			roomId,
			`**Deine Projekte:**\n\n${projectList.join('\n\n')}\n\nWechseln mit: \`!switch [ID]\``
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
			`Gewechselt zu: **${project.name}**\n\n${stats.photos} Fotos\n${stats.voices} Sprachnotizen\n${stats.texts} Textnotizen`
		);
	}

	private async showStatus(roomId: string, sender: string) {
		// Auth info
		const loggedIn = await this.sessionService.isLoggedIn(sender);
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let authInfo = '';
		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			authInfo = `**👤 Account**\n${session.email} | ⚡ ${balance.balance.toFixed(2)} Credits\n\n`;
		}

		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(
				roomId,
				`${authInfo}Kein aktives Projekt.\n\nStarte mit: \`!new Projektname\``
			);
			return;
		}

		const project = await this.projectService.findById(projectId);
		if (!project) {
			this.activeProjects.delete(sender);
			await this.sendMessage(
				roomId,
				`${authInfo}Projekt nicht gefunden. Starte ein neues mit \`!new\``
			);
			return;
		}

		const stats = await this.projectService.getStats(projectId);
		const latest = await this.generationService.getLatestGeneration(projectId);

		let statusText = `${authInfo}**Projekt-Status**\n\n**Name:** ${project.name}\n**Status:** ${project.status}\n**Erstellt:** ${project.createdAt.toLocaleDateString('de-DE')}\n\n**Inhalte:**\n${stats.photos} Fotos\n${stats.voices} Sprachnotizen\n${stats.texts} Textnotizen\n**Gesamt:** ${stats.total} Einträge`;

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

		await this.sendMessage(roomId, 'Projekt archiviert.\n\nStarte ein neues mit `!new`');
	}

	private async showStyles(roomId: string) {
		const styles = Object.entries(BLOG_STYLES)
			.map(([key, value]) => `**${key}** - ${value.name}\n_${value.prompt.slice(0, 80)}..._`)
			.join('\n\n');

		await this.sendMessage(
			roomId,
			`**Verfügbare Blog-Stile:**\n\n${styles}\n\nVerwendung: \`!generate [stil]\``
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

		await this.sendMessage(roomId, 'Generiere Blogbeitrag...\n\nDas kann einen Moment dauern.');
		await this.client.setTyping(roomId, true, 60000);

		try {
			const content = await this.generationService.generateBlogpost(projectId, selectedStyle);
			await this.client.setTyping(roomId, false);

			await this.sendMessage(roomId, content);
			await this.sendMessage(roomId, 'Blogbeitrag erstellt!\n\nExportieren mit `!export`');
		} catch (error) {
			await this.client.setTyping(roomId, false);
			this.logger.error('Generation failed:', error);
			await this.sendMessage(
				roomId,
				`Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`
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

	private async handleTextNote(roomId: string, sender: string, text: string) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Tipp: Starte ein Projekt mit `!new Projektname`');
			return;
		}

		try {
			await this.mediaService.addTextNote(projectId, text);
			const stats = await this.projectService.getStats(projectId);
			await this.sendMessage(roomId, `Notiz gespeichert! (${stats.texts} Notizen gesamt)`);
		} catch (error) {
			this.logger.error('Failed to add text note:', error);
			await this.sendMessage(roomId, 'Fehler beim Speichern der Notiz.');
		}
	}

	private async handleImage(
		roomId: string,
		sender: string,
		content: { url: string; info?: { mimetype?: string }; body?: string }
	) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.\n\nStarte mit: `!new Projektname`');
			return;
		}

		try {
			const mxcUrl = content.url;
			const buffer = await this.downloadMedia(mxcUrl);
			const contentType = content.info?.mimetype || 'image/jpeg';

			await this.mediaService.processPhoto(projectId, buffer, contentType, mxcUrl, content.body);

			const stats = await this.projectService.getStats(projectId);
			await this.sendMessage(roomId, `Foto gespeichert! (${stats.photos} Fotos gesamt)`);
		} catch (error) {
			this.logger.error('Failed to process image:', error);
			await this.sendMessage(roomId, 'Fehler beim Speichern des Fotos.');
		}
	}

	private async handleAudio(
		roomId: string,
		sender: string,
		content: { url: string; info?: { mimetype?: string; duration?: number } }
	) {
		const projectId = this.activeProjects.get(sender);
		if (!projectId) {
			await this.sendMessage(roomId, 'Kein aktives Projekt.\n\nStarte mit: `!new Projektname`');
			return;
		}

		await this.sendMessage(roomId, 'Verarbeite Sprachnotiz...');

		try {
			const mxcUrl = content.url;
			const buffer = await this.downloadMedia(mxcUrl);
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
			let reply = `Sprachnotiz gespeichert! (${stats.voices} gesamt)`;

			if (item.content) {
				reply += `\n\nTranskription:\n"${item.content}"`;
			}

			await this.sendMessage(roomId, reply);
		} catch (error) {
			this.logger.error('Failed to process audio:', error);
			await this.sendMessage(roomId, 'Fehler beim Verarbeiten der Sprachnotiz.');
		}
	}
}
