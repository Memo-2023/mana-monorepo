import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
} from '@manacore/matrix-bot-common';
import { PictureService } from '../picture/picture.service';
import { SessionService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

// Natural language keywords that trigger commands
const KEYWORD_COMMANDS: { keywords: string[]; command: string }[] = [
	{ keywords: ['hilfe', 'help', 'befehle', 'commands'], command: 'help' },
	{ keywords: ['modelle', 'models'], command: 'models' },
	{ keywords: ['verlauf', 'history', 'bilder'], command: 'history' },
	{ keywords: ['credits', 'guthaben'], command: 'credits' },
	{ keywords: ['status', 'info'], command: 'status' },
];

interface ParsedPrompt {
	prompt: string;
	negativePrompt?: string;
	width?: number;
	height?: number;
	steps?: number;
	style?: string;
}

@Injectable()
export class MatrixService extends BaseMatrixService {
	// Track active generations per user
	private activeGenerations: Map<string, string> = new Map();
	// Track selected model per user
	private userModels: Map<string, string> = new Map();

	constructor(
		configService: ConfigService,
		private pictureService: PictureService,
		private sessionService: SessionService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl: this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath: this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected getIntroductionMessage(): string | null {
		return `**Picture Bot - AI-Bildgenerierung**

Ich generiere Bilder mit AI fur dich!

**Schnellstart:**
\`!generate A beautiful landscape\`
\`!bild Ein niedlicher Hund\`

Sag "hilfe" fur alle Befehle!`;
	}

	protected async handleTextMessage(
		roomId: string,
		_event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Handle commands with ! prefix
		if (message.startsWith('!')) {
			await this.handleCommand(roomId, sender, message);
			return;
		}

		// Check for natural language keywords
		const keywordCommand = this.detectKeywordCommand(message);
		if (keywordCommand) {
			await this.handleCommand(roomId, sender, `!${keywordCommand}`);
			return;
		}

		// Don't respond to random messages
	}

	private detectKeywordCommand(message: string): string | null {
		const lowerMessage = message.toLowerCase().trim();

		// Only match if the message is short
		if (lowerMessage.length > 30) return null;

		for (const { keywords, command } of KEYWORD_COMMANDS) {
			for (const keyword of keywords) {
				if (lowerMessage === keyword || lowerMessage.startsWith(keyword + ' ')) {
					this.logger.log(`Detected keyword "${keyword}" -> command "${command}"`);
					return command;
				}
			}
		}
		return null;
	}

	private async handleCommand(roomId: string, sender: string, body: string) {
		const [command, ...args] = body.slice(1).split(' ');
		const argString = args.join(' ');

		switch (command.toLowerCase()) {
			case 'help':
			case 'hilfe':
			case 'start':
				await this.sendHelp(roomId);
				break;

			case 'generate':
			case 'bild':
			case 'gen':
				await this.handleGenerate(roomId, sender, argString);
				break;

			case 'models':
			case 'modelle':
				await this.handleModels(roomId);
				break;

			case 'model':
			case 'modell':
				await this.handleSelectModel(roomId, sender, argString);
				break;

			case 'history':
			case 'verlauf':
				await this.handleHistory(roomId, sender);
				break;

			case 'delete':
			case 'loeschen':
				await this.handleDelete(roomId, sender, args);
				break;

			case 'credits':
			case 'guthaben':
				await this.handleCredits(roomId, sender);
				break;

			case 'login':
				await this.handleLogin(roomId, sender, args);
				break;

			case 'logout':
				this.sessionService.logout(sender);
				await this.sendMessage(roomId, 'Du wurdest abgemeldet.');
				break;

			case 'status':
				await this.handleStatus(roomId, sender);
				break;

			case 'cancel':
			case 'abbrechen':
				await this.handleCancel(roomId, sender);
				break;

			case 'pin':
				await this.pinHelpMessage(roomId);
				break;

			default:
				await this.sendMessage(
					roomId,
					`Unbekannter Befehl: !${command}\n\nSag "hilfe" fur alle Befehle.`
				);
		}
	}

	private parsePrompt(input: string): ParsedPrompt {
		const result: ParsedPrompt = { prompt: '' };

		// Extract options
		const widthMatch = input.match(/--width\s+(\d+)/i);
		if (widthMatch) {
			result.width = parseInt(widthMatch[1], 10);
			input = input.replace(widthMatch[0], '');
		}

		const heightMatch = input.match(/--height\s+(\d+)/i);
		if (heightMatch) {
			result.height = parseInt(heightMatch[1], 10);
			input = input.replace(heightMatch[0], '');
		}

		const stepsMatch = input.match(/--steps\s+(\d+)/i);
		if (stepsMatch) {
			result.steps = parseInt(stepsMatch[1], 10);
			input = input.replace(stepsMatch[0], '');
		}

		const negativeMatch = input.match(/--negative\s+(.+?)(?=--|$)/i);
		if (negativeMatch) {
			result.negativePrompt = negativeMatch[1].trim();
			input = input.replace(negativeMatch[0], '');
		}

		const styleMatch = input.match(/--style\s+(\S+)/i);
		if (styleMatch) {
			result.style = styleMatch[1];
			input = input.replace(styleMatch[0], '');
		}

		result.prompt = input.trim();
		return result;
	}

	private async handleGenerate(roomId: string, sender: string, promptInput: string) {
		if (!promptInput.trim()) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!generate [prompt]\`\n\nBeispiel: \`!generate A beautiful sunset over mountains\``
			);
			return;
		}

		// Check if user is logged in
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(
				roomId,
				`Du musst angemeldet sein, um Bilder zu generieren.\n\nNutze \`!login email passwort\` zum Anmelden.`
			);
			return;
		}

		// Check if user already has an active generation
		if (this.activeGenerations.has(sender)) {
			await this.sendMessage(
				roomId,
				`Du hast bereits eine laufende Generierung. Warte bis sie fertig ist oder nutze \`!cancel\`.`
			);
			return;
		}

		// Parse the prompt
		const parsed = this.parsePrompt(promptInput);

		await this.sendMessage(roomId, `Generiere Bild...\n\n**Prompt:** "${parsed.prompt}"`);

		try {
			// Get user's selected model or use default
			const modelId = this.userModels.get(sender);

			// Mark generation as active
			this.activeGenerations.set(sender, 'generating');

			const result = await this.pictureService.generateImage(token, {
				prompt: parsed.prompt,
				negativePrompt: parsed.negativePrompt,
				modelId,
				width: parsed.width,
				height: parsed.height,
				steps: parsed.steps,
				style: parsed.style,
			});

			// Clear active generation
			this.activeGenerations.delete(sender);

			if (result.status === 'completed' && result.image) {
				// Upload image to Matrix
				const imageUrl = result.image.publicUrl;
				if (imageUrl) {
					try {
						// Download and upload to Matrix
						const response = await fetch(imageUrl);
						const buffer = Buffer.from(await response.arrayBuffer());
						const mxcUrl = await this.client.uploadContent(buffer, 'image/png');

						// Send image message
						await this.client.sendMessage(roomId, {
							msgtype: 'm.image',
							body: parsed.prompt.substring(0, 50),
							url: mxcUrl,
							info: {
								mimetype: 'image/png',
								w: result.image.width || 1024,
								h: result.image.height || 1024,
							},
						});

						let infoText = `**Bild generiert!**\n\n`;
						infoText += `**Prompt:** ${parsed.prompt}\n`;
						if (result.creditsUsed) {
							infoText += `**Credits verwendet:** ${result.creditsUsed}`;
						}

						await this.sendMessage(roomId, infoText);
					} catch (uploadError) {
						this.logger.error('Failed to upload image to Matrix:', uploadError);
						await this.sendMessage(roomId, `Bild generiert! Direkter Link: ${imageUrl}`);
					}
				} else {
					await this.sendMessage(roomId, `Bild generiert, aber keine URL verfugbar.`);
				}
			} else if (result.status === 'processing') {
				await this.sendMessage(
					roomId,
					`Generierung gestartet (ID: ${result.generationId}). Das Bild wird bald fertig sein.`
				);
			} else {
				await this.sendMessage(roomId, `Generierung fehlgeschlagen. Bitte versuche es erneut.`);
			}
		} catch (error) {
			this.activeGenerations.delete(sender);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			this.logger.error('Generation error:', error);
			await this.sendMessage(roomId, `Fehler bei der Generierung: ${errorMsg}`);
		}
	}

	private async handleModels(roomId: string) {
		try {
			const models = await this.pictureService.getModels();

			if (models.length === 0) {
				await this.sendMessage(roomId, 'Keine Modelle verfugbar.');
				return;
			}

			let text = `**Verfugbare Modelle:**\n\n`;
			for (const model of models) {
				const defaultTag = model.isDefault ? ' **(Standard)**' : '';
				text += `**${model.name}**${defaultTag}\n`;
				text += `ID: \`${model.id}\`\n`;
				if (model.description) {
					text += `${model.description}\n`;
				}
				text += `\n`;
			}

			text += `\nNutze \`!model [id]\` um ein Modell auszuwahlen.`;

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler beim Laden der Modelle: ${errorMsg}`);
		}
	}

	private async handleSelectModel(roomId: string, sender: string, modelId: string) {
		if (!modelId.trim()) {
			const currentModel = this.userModels.get(sender);
			if (currentModel) {
				await this.sendMessage(
					roomId,
					`Aktuelles Modell: \`${currentModel}\`\n\nNutze \`!models\` um alle Modelle zu sehen.`
				);
			} else {
				await this.sendMessage(
					roomId,
					`Kein Modell ausgewahlt (Standard wird verwendet).\n\nNutze \`!models\` um alle Modelle zu sehen.`
				);
			}
			return;
		}

		try {
			const model = await this.pictureService.getModel(modelId.trim());
			this.userModels.set(sender, model.id);
			await this.sendMessage(roomId, `Modell gewechselt zu: **${model.name}**`);
		} catch (error) {
			await this.sendMessage(
				roomId,
				`Modell "${modelId}" nicht gefunden. Nutze \`!models\` fur verfugbare Modelle.`
			);
		}
	}

	private async handleHistory(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const images = await this.pictureService.getImages(token, 10);

			if (images.length === 0) {
				await this.sendMessage(roomId, `Du hast noch keine Bilder generiert.`);
				return;
			}

			let text = `**Deine letzten Bilder (${images.length}):**\n\n`;

			for (let i = 0; i < images.length; i++) {
				const img = images[i];
				const promptPreview = img.prompt?.substring(0, 40) || 'Kein Prompt';
				const date = new Date(img.createdAt).toLocaleDateString('de-DE');
				text += `**${i + 1}.** "${promptPreview}${img.prompt && img.prompt.length > 40 ? '...' : ''}"\n`;
				text += `   ${date} | ${img.width}x${img.height}\n\n`;
			}

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleDelete(roomId: string, sender: string, args: string[]) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!delete [bild-nr]\`\n\nNutze \`!history\` um Bildnummern zu sehen.`
			);
			return;
		}

		const imageIndex = parseInt(args[0], 10);
		if (isNaN(imageIndex) || imageIndex < 1) {
			await this.sendMessage(roomId, `Ungultige Bildnummer.`);
			return;
		}

		try {
			const images = await this.pictureService.getImages(token, 10);
			if (imageIndex > images.length) {
				await this.sendMessage(roomId, `Bild ${imageIndex} existiert nicht.`);
				return;
			}

			const image = images[imageIndex - 1];
			await this.pictureService.deleteImage(token, image.id);

			await this.sendMessage(roomId, `Bild ${imageIndex} geloscht.`);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleCredits(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const balance = await this.pictureService.getCredits(token);
			await this.sendMessage(
				roomId,
				`**Dein Credit-Guthaben:** ${balance} Credits\n\nEine Bildgenerierung kostet 10 Credits.`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleCancel(roomId: string, sender: string) {
		if (!this.activeGenerations.has(sender)) {
			await this.sendMessage(roomId, `Du hast keine laufende Generierung.`);
			return;
		}

		this.activeGenerations.delete(sender);
		await this.sendMessage(roomId, `Generierung abgebrochen.`);
	}

	private async sendHelp(roomId: string) {
		await this.sendMessage(roomId, HELP_MESSAGE);
	}

	private async handleLogin(roomId: string, sender: string, args: string[]) {
		if (args.length < 2) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!login email passwort\`\n\nBeispiel: \`!login nutzer@example.com meinpasswort\``
			);
			return;
		}

		const [email, password] = args;

		await this.sendMessage(roomId, 'Anmeldung lauft...');

		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			await this.sendMessage(
				roomId,
				`Erfolgreich angemeldet!\n\nDu kannst jetzt Bilder generieren mit \`!generate [prompt]\``
			);
		} else {
			await this.sendMessage(roomId, `Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendHealthy = await this.pictureService.checkHealth();
		const isLoggedIn = this.sessionService.isLoggedIn(sender);
		const sessionCount = this.sessionService.getSessionCount();
		const currentModel = this.userModels.get(sender);
		const hasActiveGeneration = this.activeGenerations.has(sender);

		const statusText = `**Picture Bot Status**

**Backend:** ${backendHealthy ? 'Online' : 'Offline'}
**Dein Status:** ${isLoggedIn ? 'Angemeldet' : 'Nicht angemeldet'}
**Ausgewahltes Modell:** ${currentModel || 'Standard'}
**Aktive Generierung:** ${hasActiveGeneration ? 'Ja' : 'Nein'}
**Aktive Sessions:** ${sessionCount}

${!isLoggedIn ? 'Nutze `!login email passwort` um dich anzumelden.' : ''}`;

		await this.sendMessage(roomId, statusText);
	}

	private async pinHelpMessage(roomId: string) {
		try {
			const htmlBody = this.markdownToHtmlLocal(HELP_MESSAGE);

			const eventId = await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: HELP_MESSAGE,
				format: 'org.matrix.custom.html',
				formatted_body: htmlBody,
			});

			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [eventId],
			});

			this.logger.log(`Pinned help message in room ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to pin help message:`, error);
			await this.sendMessage(roomId, 'Fehler beim Pinnen der Hilfe.');
		}
	}

	private markdownToHtmlLocal(markdown: string): string {
		return (
			markdown
				// Code blocks
				.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
				// Inline code
				.replace(/`([^`]+)`/g, '<code>$1</code>')
				// Bold
				.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
				// Italic
				.replace(/\*([^*]+)\*/g, '<em>$1</em>')
				// Underscore italic
				.replace(/_([^_]+)_/g, '<em>$1</em>')
				// Line breaks
				.replace(/\n/g, '<br/>')
		);
	}
}
