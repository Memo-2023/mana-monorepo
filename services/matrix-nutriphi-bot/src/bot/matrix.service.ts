import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
} from '@manacore/matrix-bot-common';
import {
	NutriPhiService,
	AIAnalysisResult,
	DailySummary,
	WeeklyStats,
} from '../nutriphi/nutriphi.service';
import { SessionService, TranscriptionService } from '@manacore/bot-services';
import { HELP_MESSAGE, MEAL_TYPE_LABELS } from '../config/configuration';

// Natural language keywords that trigger commands (German + English)
const KEYWORD_COMMANDS: { keywords: string[]; command: string }[] = [
	{ keywords: ['hilfe', 'help', 'was kannst du', 'befehle', 'commands'], command: 'help' },
	{ keywords: ['heute', 'today', 'tages', 'tagesübersicht'], command: 'today' },
	{ keywords: ['woche', 'week', 'wochen', 'wochenübersicht'], command: 'week' },
	{ keywords: ['ziele', 'goals', 'meine ziele'], command: 'goals' },
	{ keywords: ['favoriten', 'favorites', 'lieblings'], command: 'favorites' },
	{ keywords: ['tipps', 'tips', 'empfehlungen', 'ratschläge'], command: 'tips' },
	{ keywords: ['status', 'verbindung'], command: 'status' },
];

@Injectable()
export class MatrixService extends BaseMatrixService {
	constructor(
		configService: ConfigService,
		private nutriphiService: NutriPhiService,
		private sessionService: SessionService,
		private transcriptionService: TranscriptionService
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
		return `**NutriPhi Bot - KI-Ernahrungsassistent**

Analysiere deine Mahlzeiten mit KI und tracke deine Ernahrung!

**Quick Start:**
1. \`!login email passwort\` - Anmelden
2. Sende ein Foto deiner Mahlzeit
3. \`!analyze\` - Nahrwerte erhalten

Sag "hilfe" fur alle Befehle!`;
	}

	async onModuleInit() {
		await super.onModuleInit();

		if (!this.client) return;

		// Handle image messages
		this.client.on('room.message', async (roomId: string, event: any) => {
			if (event.sender === await this.client.getUserId()) return;

			const content = event.content as {
				msgtype?: string;
				body?: string;
				url?: string;
				info?: { mimetype?: string; duration?: number };
			};

			// Handle image messages
			if (content.msgtype === 'm.image' && content.url) {
				this.sessionService.setSessionData(event.sender, 'pendingImage', {
					url: content.url,
					mimeType: content.info?.mimetype || 'image/png',
				});
				this.logger.log(`Image received from ${event.sender}`);
				await this.sendMessage(
					roomId,
					`Bild empfangen! Nutze jetzt \`!analyze\` um es zu analysieren, oder \`!analyze Beschreibung\` um zusatzlichen Kontext zu geben.`
				);
			}
		});
	}

	protected async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(
				roomId,
				`Du bist nicht angemeldet. Nutze \`!login email passwort\` um dich anzumelden.`
			);
			return;
		}

		await this.sendMessage(roomId, 'Verarbeite Sprachnotiz...');
		await this.client.setTyping(roomId, true, 60000);

		try {
			// Download audio from Matrix
			const mxcUrl = event.content.url!;
			const httpUrl = this.client.mxcToHttp(mxcUrl);
			this.logger.log(`Downloading audio from ${httpUrl}`);

			const response = await fetch(httpUrl);
			if (!response.ok) {
				throw new Error(`Failed to download audio: ${response.status}`);
			}

			const buffer = Buffer.from(await response.arrayBuffer());

			// Transcribe audio
			const transcription = await this.transcriptionService.transcribe(buffer);
			this.logger.log(`Transcription: ${transcription.substring(0, 50)}...`);

			if (!transcription.trim()) {
				await this.client.setTyping(roomId, false);
				await this.sendMessage(roomId, 'Konnte keine Sprache erkennen. Bitte versuche es erneut.');
				return;
			}

			// Analyze the transcribed text as a meal
			await this.sendMessage(roomId, `Transkription: "${transcription}"\n\nAnalysiere...`);

			const result = await this.nutriphiService.analyzeText(transcription, token);
			await this.client.setTyping(roomId, false);

			// Format and send result
			const formattedResult = this.formatAnalysisResult(result);
			await this.sendMessage(roomId, formattedResult);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			this.logger.error('Audio processing failed:', error);
			await this.sendMessage(roomId, `Fehler bei der Verarbeitung: ${errorMsg}`);
		}
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

		// Don't respond to random messages - only commands
	}

	private detectKeywordCommand(message: string): string | null {
		const lowerMessage = message.toLowerCase().trim();

		// Only match if the message is short
		if (lowerMessage.length > 50) return null;

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
			case 'start':
				await this.sendHelp(roomId);
				break;

			case 'login':
				await this.handleLogin(roomId, sender, args);
				break;

			case 'logout':
				this.sessionService.logout(sender);
				await this.sendMessage(roomId, 'Du wurdest abgemeldet.');
				break;

			case 'analyze':
				await this.handleAnalyze(roomId, sender, argString);
				break;

			case 'today':
				await this.handleToday(roomId, sender);
				break;

			case 'week':
				await this.handleWeek(roomId, sender);
				break;

			case 'goals':
				await this.handleGoals(roomId, sender);
				break;

			case 'setgoals':
				await this.handleSetGoals(roomId, sender, args);
				break;

			case 'favorites':
				await this.handleFavorites(roomId, sender);
				break;

			case 'tips':
				await this.handleTips(roomId, sender);
				break;

			case 'status':
				await this.handleStatus(roomId, sender);
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
				`Erfolgreich angemeldet!\n\nDu kannst jetzt Fotos analysieren und deine Ernahrung tracken.`
			);
		} else {
			await this.sendMessage(roomId, `Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleAnalyze(roomId: string, sender: string, description: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(
				roomId,
				`Du bist nicht angemeldet. Nutze \`!login email passwort\` um dich anzumelden.`
			);
			return;
		}

		const pendingImage = this.sessionService.getSessionData<{ url: string; mimeType: string }>(
			sender,
			'pendingImage'
		);

		// If no image and no description, show help
		if (!pendingImage && !description.trim()) {
			await this.sendMessage(
				roomId,
				`**Verwendung:**\n- Sende ein Foto, dann \`!analyze\`\n- Oder: \`!analyze Spaghetti mit Tomatensauce\``
			);
			return;
		}

		await this.client.setTyping(roomId, true, 60000);

		try {
			let result: AIAnalysisResult;

			if (pendingImage) {
				// Analyze image
				await this.sendMessage(roomId, 'Analysiere Bild...');
				const imageData = await this.downloadMatrixImage(pendingImage.url);
				result = await this.nutriphiService.analyzePhoto(imageData, pendingImage.mimeType, token);
				this.sessionService.setSessionData(sender, 'pendingImage', null);
			} else {
				// Analyze text
				await this.sendMessage(roomId, `Analysiere: "${description}"...`);
				result = await this.nutriphiService.analyzeText(description, token);
			}

			await this.client.setTyping(roomId, false);

			// Format and send result
			const response = this.formatAnalysisResult(result);
			await this.sendMessage(roomId, response);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler bei der Analyse: ${errorMsg}`);
		}
	}

	private formatAnalysisResult(result: AIAnalysisResult): string {
		const { foods, totalNutrition, confidence, warnings, suggestions } = result;

		let text = `**Mahlzeit analysiert** (Konfidenz: ${Math.round(confidence * 100)}%)\n\n`;

		if (foods.length > 0) {
			text += '**Erkannte Lebensmittel:**\n';
			for (const food of foods) {
				text += `- ${food.name} (${food.quantity}) - ${food.calories} kcal\n`;
			}
			text += '\n';
		}

		text += `**Nahrwerte:**\n`;
		text += `- Kalorien: ${Math.round(totalNutrition.calories)} kcal\n`;
		text += `- Protein: ${Math.round(totalNutrition.protein)}g\n`;
		text += `- Kohlenhydrate: ${Math.round(totalNutrition.carbohydrates)}g\n`;
		text += `- Fett: ${Math.round(totalNutrition.fat)}g\n`;
		text += `- Ballaststoffe: ${Math.round(totalNutrition.fiber)}g\n`;

		if (warnings && warnings.length > 0) {
			text += `\n**Hinweise:**\n`;
			for (const warning of warnings) {
				text += `- ${warning}\n`;
			}
		}

		if (suggestions && suggestions.length > 0) {
			text += `\n**Vorschlage:**\n`;
			for (const suggestion of suggestions) {
				text += `- ${suggestion}\n`;
			}
		}

		return text;
	}

	private async handleToday(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		await this.client.setTyping(roomId, true, 10000);

		try {
			const today = new Date().toISOString().split('T')[0];
			const summary = await this.nutriphiService.getDailySummary(today, token);

			await this.client.setTyping(roomId, false);
			await this.sendMessage(roomId, this.formatDailySummary(summary));
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private formatDailySummary(summary: DailySummary): string {
		const dateStr = new Date(summary.date).toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		});

		let text = `**Tages-Zusammenfassung - ${dateStr}**\n\n`;

		const { progress } = summary;
		text += `**Kalorien:** ${Math.round(progress.calories.current)} / ${progress.calories.target} kcal (${Math.round(progress.calories.percentage)}%)\n`;

		if (progress.protein) {
			text += `**Protein:** ${Math.round(progress.protein.current)}g / ${progress.protein.target}g (${Math.round(progress.protein.percentage)}%)\n`;
		}
		if (progress.carbs) {
			text += `**Kohlenhydrate:** ${Math.round(progress.carbs.current)}g / ${progress.carbs.target}g (${Math.round(progress.carbs.percentage)}%)\n`;
		}
		if (progress.fat) {
			text += `**Fett:** ${Math.round(progress.fat.current)}g / ${progress.fat.target}g (${Math.round(progress.fat.percentage)}%)\n`;
		}

		if (summary.meals.length > 0) {
			text += `\n**Mahlzeiten (${summary.meals.length}):**\n`;
			for (const meal of summary.meals) {
				const mealLabel = MEAL_TYPE_LABELS[meal.mealType] || meal.mealType;
				const calories = meal.nutrition?.calories
					? ` - ${Math.round(meal.nutrition.calories)} kcal`
					: '';
				text += `- ${mealLabel}: ${meal.description}${calories}\n`;
			}
		} else {
			text += `\n_Noch keine Mahlzeiten heute._`;
		}

		return text;
	}

	private async handleWeek(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		await this.client.setTyping(roomId, true, 10000);

		try {
			const today = new Date().toISOString().split('T')[0];
			const stats = await this.nutriphiService.getWeeklyStats(today, token);

			await this.client.setTyping(roomId, false);
			await this.sendMessage(roomId, this.formatWeeklyStats(stats));
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private formatWeeklyStats(stats: WeeklyStats): string {
		const startStr = new Date(stats.startDate).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
		});
		const endStr = new Date(stats.endDate).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
		});

		let text = `**Wochen-Statistik (${startStr} - ${endStr})**\n\n`;

		text += `**Durchschnittswerte:**\n`;
		text += `- Kalorien: ${Math.round(stats.averages.calories)} kcal/Tag\n`;
		text += `- Protein: ${Math.round(stats.averages.protein)}g/Tag\n`;
		text += `- Kohlenhydrate: ${Math.round(stats.averages.carbs)}g/Tag\n`;
		text += `- Fett: ${Math.round(stats.averages.fat)}g/Tag\n\n`;

		text += `**Tage:**\n`;
		for (const day of stats.days) {
			const dayStr = new Date(day.date).toLocaleDateString('de-DE', {
				weekday: 'short',
				day: 'numeric',
			});
			const goalIcon = day.goalsMet ? ' ' : '';
			text += `- ${dayStr}: ${Math.round(day.totalCalories)} kcal, ${day.mealCount} Mahlzeiten${goalIcon}\n`;
		}

		return text;
	}

	private async handleGoals(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const goals = await this.nutriphiService.getGoals(token);

			if (!goals) {
				await this.sendMessage(
					roomId,
					`Du hast noch keine Ziele gesetzt.\n\nNutze \`!setgoals kalorien protein carbs fett\`\nBeispiel: \`!setgoals 2000 80 250 65\``
				);
				return;
			}

			let text = `**Deine Tagesziele:**\n\n`;
			text += `- Kalorien: ${goals.dailyCalories} kcal\n`;
			if (goals.dailyProtein) text += `- Protein: ${goals.dailyProtein}g\n`;
			if (goals.dailyCarbs) text += `- Kohlenhydrate: ${goals.dailyCarbs}g\n`;
			if (goals.dailyFat) text += `- Fett: ${goals.dailyFat}g\n`;

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleSetGoals(roomId: string, sender: string, args: string[]) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!setgoals kalorien [protein] [carbs] [fett]\`\n\nBeispiel: \`!setgoals 2000 80 250 65\``
			);
			return;
		}

		const calories = parseInt(args[0], 10);
		const protein = args[1] ? parseInt(args[1], 10) : undefined;
		const carbs = args[2] ? parseInt(args[2], 10) : undefined;
		const fat = args[3] ? parseInt(args[3], 10) : undefined;

		if (isNaN(calories) || calories < 500 || calories > 10000) {
			await this.sendMessage(
				roomId,
				`Ungiultige Kalorienzahl. Bitte eine Zahl zwischen 500 und 10000 angeben.`
			);
			return;
		}

		try {
			await this.nutriphiService.setGoals(
				{
					dailyCalories: calories,
					dailyProtein: protein,
					dailyCarbs: carbs,
					dailyFat: fat,
				},
				token
			);

			let text = `**Ziele gesetzt:**\n`;
			text += `- Kalorien: ${calories} kcal\n`;
			if (protein) text += `- Protein: ${protein}g\n`;
			if (carbs) text += `- Kohlenhydrate: ${carbs}g\n`;
			if (fat) text += `- Fett: ${fat}g\n`;

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleFavorites(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const favorites = await this.nutriphiService.getFavorites(token);

			if (favorites.length === 0) {
				await this.sendMessage(roomId, `Du hast noch keine Favoriten gespeichert.`);
				return;
			}

			let text = `**Deine Favoriten (${favorites.length}):**\n\n`;
			for (const fav of favorites) {
				text += `- **${fav.name}** (${fav.usageCount}x verwendet)\n`;
				text += `  ${Math.round(fav.nutrition.calories)} kcal, ${Math.round(fav.nutrition.protein)}g P, ${Math.round(fav.nutrition.carbohydrates)}g KH, ${Math.round(fav.nutrition.fat)}g F\n`;
			}

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleTips(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const recommendations = await this.nutriphiService.getRecommendations(token);

			if (recommendations.length === 0) {
				await this.sendMessage(
					roomId,
					`Keine aktuellen Empfehlungen. Tracke mehr Mahlzeiten fur personalisierte Tipps!`
				);
				return;
			}

			let text = `**KI-Empfehlungen:**\n\n`;
			for (const rec of recommendations) {
				const icon = rec.type === 'coaching' ? '' : '';
				text += `${icon} ${rec.message}\n\n`;
			}

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendHealthy = await this.nutriphiService.checkHealth();
		const isLoggedIn = this.sessionService.isLoggedIn(sender);
		const sessionCount = this.sessionService.getSessionCount();
		const loggedInCount = this.sessionService.getActiveSessionCount();

		const statusText = `**NutriPhi Bot Status**

**Backend:** ${backendHealthy ? 'Online' : 'Offline'}
**Dein Status:** ${isLoggedIn ? 'Angemeldet' : 'Nicht angemeldet'}
**Aktive Sessions:** ${sessionCount} (${loggedInCount} angemeldet)

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

	private async downloadMatrixImage(mxcUrl: string): Promise<string> {
		const httpUrl = this.client.mxcToHttp(mxcUrl);
		this.logger.log(`Downloading image from ${httpUrl}`);

		const response = await fetch(httpUrl);
		if (!response.ok) {
			throw new Error(`Failed to download image: ${response.status}`);
		}

		const buffer = await response.arrayBuffer();
		const base64 = Buffer.from(buffer).toString('base64');
		return base64;
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
