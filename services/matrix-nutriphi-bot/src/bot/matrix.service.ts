import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
	handleCreditCommand,
	type CreditCommandsHost,
} from '@manacore/matrix-bot-common';
import {
	NutriPhiService,
	AIAnalysisResult,
	DailySummary,
	WeeklyStats,
} from '../nutriphi/nutriphi.service';
import {
	SessionService,
	TranscriptionService,
	CreditService,
	I18nService,
	LOGIN_MESSAGES,
} from '@manacore/bot-services';
import { MediaService } from '../media/media.service';
import { HELP_MESSAGE, MEAL_TYPE_LABELS } from '../config/configuration';

const PHOTO_ANALYSIS_CREDITS = 3;

// Natural language keyword detector
const keywordDetector = new KeywordCommandDetector([
	...COMMON_KEYWORDS,
	{ keywords: ['heute', 'today', 'tages', 'tagesübersicht'], command: 'today' },
	{ keywords: ['woche', 'week', 'wochen', 'wochenübersicht'], command: 'week' },
	{ keywords: ['ziele', 'goals', 'meine ziele'], command: 'goals' },
	{ keywords: ['favoriten', 'favorites', 'lieblings'], command: 'favorites' },
	{ keywords: ['tipps', 'tips', 'empfehlungen', 'ratschläge'], command: 'tips' },
	{ keywords: ['verbindung'], command: 'status' },
	// Credit commands
	{ keywords: ['credits', 'guthaben', 'kontostand'], command: 'credits' },
	{ keywords: ['packages', 'pakete', 'preise'], command: 'packages' },
	{ keywords: ['kaufen', 'buy'], command: 'buy' },
]);

@Injectable()
export class MatrixService extends BaseMatrixService implements CreditCommandsHost {
	// Expose services for credit commands mixin
	public creditService: CreditService;
	public i18nService: I18nService;
	public sessionService: SessionService;

	constructor(
		configService: ConfigService,
		private nutriphiService: NutriPhiService,
		sessionService: SessionService,
		private transcriptionService: TranscriptionService,
		creditService: CreditService,
		i18nService: I18nService,
		private mediaService: MediaService
	) {
		super(configService);
		// Assign to public properties for credit commands mixin
		this.sessionService = sessionService;
		this.creditService = creditService;
		this.i18nService = i18nService;
	}

	// ============================================================================
	// CreditCommandsHost interface implementation
	// ============================================================================

	/**
	 * Send a credit message (delegates to protected sendMessage)
	 */
	async sendCreditMessage(roomId: string, message: string): Promise<void> {
		await this.sendMessage(roomId, message);
	}

	/**
	 * Send a credit reply (delegates to protected sendReply)
	 */
	async sendCreditReply(roomId: string, event: MatrixRoomEvent, message: string): Promise<void> {
		await this.sendReply(roomId, event, message);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl:
				this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected getIntroductionMessage(): string | null {
		return `**NutriPhi Bot - KI-Ernahrungsassistent**

Analysiere deine Mahlzeiten mit KI und tracke deine Ernahrung!

**Quick Start:**
1. \`!login email passwort\` - Anmelden
2. Sende ein Foto deiner Mahlzeit - wird automatisch analysiert!

Sag "hilfe" fur alle Befehle!`;
	}

	async onModuleInit() {
		await super.onModuleInit();

		if (!this.client) return;

		// Handle image messages - auto-analyze
		this.client.on('room.message', async (roomId: string, event: any) => {
			if (event.sender === (await this.client.getUserId())) return;

			const content = event.content as {
				msgtype?: string;
				body?: string;
				url?: string;
				info?: { mimetype?: string; duration?: number };
			};

			// Handle image messages - automatically analyze
			if (content.msgtype === 'm.image' && content.url) {
				this.logger.log(`Image received from ${event.sender}, auto-analyzing...`);
				await this.autoAnalyzeImage(
					roomId,
					event.sender,
					content.url,
					content.info?.mimetype || 'image/png'
				);
			}
		});
	}

	private async autoAnalyzeImage(roomId: string, sender: string, mxcUrl: string, mimeType: string) {
		let token = await this.requireLogin(roomId, sender);
		if (!token) return;

		await this.sendMessage(roomId, 'Bild empfangen! Analysiere...');
		await this.client.setTyping(roomId, true, 60000);

		try {
			const imageData = await this.downloadMatrixImage(mxcUrl);

			let result;
			try {
				result = await this.nutriphiService.analyzePhoto(imageData, mimeType, token);
			} catch (error) {
				// If token expired, try to refresh and retry once
				if (this.isTokenExpiredError(error)) {
					token = await this.refreshToken(sender);
					if (!token) {
						await this.client.setTyping(roomId, false);
						await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
						return;
					}
					// Retry with new token
					result = await this.nutriphiService.analyzePhoto(imageData, mimeType, token);
				} else {
					throw error;
				}
			}

			await this.client.setTyping(roomId, false);

			const response = this.formatAnalysisResult(result);
			await this.sendMessage(roomId, response);

			// Store image in mana-media for persistent storage (non-blocking)
			// Use Matrix sender ID as user identifier
			this.mediaService
				.storeFromMatrix(mxcUrl, sender)
				.then((mediaResult) => {
					if (mediaResult) {
						this.logger.log(`Image stored in mana-media: ${mediaResult.id}`);
					}
				})
				.catch((error) => {
					this.logger.warn(`Failed to store image in mana-media: ${error}`);
				});
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			this.logger.error('Auto-analyze failed:', error);
			await this.sendMessage(roomId, `Fehler bei der Analyse: ${errorMsg}`);
		}
	}

	protected async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		let token = await this.requireLogin(roomId, sender);
		if (!token) return;

		await this.sendMessage(roomId, 'Verarbeite Sprachnotiz...');
		await this.client.setTyping(roomId, true, 60000);

		try {
			// Download audio from Matrix using authenticated API
			const mxcUrl = event.content.url!;
			this.logger.log(`Downloading audio from ${mxcUrl}`);

			const buffer = await this.downloadMedia(mxcUrl);

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

			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.analyzeText(transcription, t)
			);

			if ('error' in apiResult) {
				await this.client.setTyping(roomId, false);
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			await this.client.setTyping(roomId, false);

			// Format and send result
			const formattedResult = this.formatAnalysisResult(apiResult.result);
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
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Handle commands with ! prefix
		if (message.startsWith('!')) {
			await this.handleCommand(roomId, event, sender, message);
			return;
		}

		// Check for natural language keywords
		const detectedCommand = keywordDetector.detect(message);
		if (detectedCommand) {
			this.logger.log(`Detected keyword command: ${detectedCommand}`);
			await this.handleCommand(roomId, event, sender, `!${detectedCommand}`);
			return;
		}

		// Auto-analyze text that looks like a meal description
		// (longer than 15 chars and contains food-related content)
		if (this.looksLikeMealDescription(message)) {
			await this.autoAnalyzeText(roomId, sender, message);
			return;
		}

		// Don't respond to random messages - only commands
	}

	/**
	 * Check if a message looks like a meal description
	 * Simple heuristic: longer than 15 chars, contains numbers or food keywords
	 */
	private looksLikeMealDescription(message: string): boolean {
		if (message.length < 15) return false;

		const lowerMessage = message.toLowerCase();

		// Skip greetings and questions
		const skipPatterns = [
			/^(hallo|hi|hey|guten|moin|servus)/,
			/^(was|wie|wann|wo|wer|warum|kannst|könntest)/,
			/\?$/,
		];
		for (const pattern of skipPatterns) {
			if (pattern.test(lowerMessage)) return false;
		}

		// Check for food indicators: numbers (portions), units, or food words
		const hasNumbers = /\d+/.test(message);
		const foodKeywords = [
			'gramm',
			'g ',
			'ml',
			'liter',
			'stück',
			'portion',
			'tasse',
			'löffel',
			'mit',
			'und',
			'apfel',
			'banane',
			'brot',
			'ei',
			'milch',
			'käse',
			'fleisch',
			'gemüse',
			'obst',
			'salat',
			'reis',
			'nudel',
			'pasta',
			'pizza',
			'suppe',
			'smoothie',
			'müsli',
			'joghurt',
			'haferflocken',
			'nüsse',
			'erdnüsse',
			'mandeln',
			'karotte',
			'tomate',
			'gurke',
			'zwiebel',
			'kartoffel',
			'huhn',
			'hähnchen',
			'rind',
			'schwein',
			'fisch',
			'lachs',
			'thunfisch',
			'schinken',
			'wurst',
			'butter',
			'öl',
			'olive',
			'kokos',
			'dattel',
			'zucker',
			'honig',
			'kaffee',
			'tee',
			'saft',
			'wasser',
			'sahne',
			'quark',
		];

		const hasFoodKeyword = foodKeywords.some((keyword) => lowerMessage.includes(keyword));

		return hasNumbers || hasFoodKeyword;
	}

	/**
	 * Auto-analyze a text message as a meal description
	 */
	private async autoAnalyzeText(roomId: string, sender: string, description: string) {
		let token = await this.sessionService.getToken(sender);

		// If not logged in, prompt for login
		if (!token) {
			await this.sendMessage(
				roomId,
				`Das sieht nach einer Mahlzeit aus! Melde dich an, um sie zu analysieren:\n\n\`!login email passwort\``
			);
			return;
		}

		this.logger.log(`Auto-analyzing text from ${sender}: "${description.substring(0, 50)}..."`);
		await this.sendMessage(
			roomId,
			`Analysiere: "${description.substring(0, 80)}${description.length > 80 ? '...' : ''}"...`
		);
		await this.client.setTyping(roomId, true, 60000);

		try {
			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.analyzeText(description, t)
			);

			await this.client.setTyping(roomId, false);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			const response = this.formatAnalysisResult(apiResult.result);
			await this.sendMessage(roomId, response);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			this.logger.error('Auto-analyze text failed:', error);
			await this.sendMessage(roomId, `Fehler bei der Analyse: ${errorMsg}`);
		}
	}

	private async handleCommand(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		body: string
	) {
		const [command, ...args] = body.slice(1).split(' ');
		const argString = args.join(' ');

		// Handle credit commands first (credits, packages, buy)
		if (await handleCreditCommand(this, roomId, event, sender, command.toLowerCase(), argString)) {
			return;
		}

		switch (command.toLowerCase()) {
			case 'help':
			case 'start':
				await this.sendHelp(roomId);
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

	private async handleAnalyze(roomId: string, sender: string, description: string) {
		const token = await this.requireLogin(roomId, sender);
		if (!token) return;

		const pendingImage = await this.sessionService.getSessionData<{
			url: string;
			mimeType: string;
		}>(sender, 'pendingImage');

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
			let apiResult;

			if (pendingImage) {
				// Analyze image
				await this.sendMessage(roomId, 'Analysiere Bild...');
				const imageData = await this.downloadMatrixImage(pendingImage.url);
				apiResult = await this.withTokenRefresh(sender, token, (t) =>
					this.nutriphiService.analyzePhoto(imageData, pendingImage.mimeType, t)
				);
				this.sessionService.setSessionData(sender, 'pendingImage', null);
			} else {
				// Analyze text
				await this.sendMessage(roomId, `Analysiere: "${description}"...`);
				apiResult = await this.withTokenRefresh(sender, token, (t) =>
					this.nutriphiService.analyzeText(description, t)
				);
			}

			await this.client.setTyping(roomId, false);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			// Format and send result
			const response = this.formatAnalysisResult(apiResult.result);
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

		text += `**Nährwerte:**\n`;
		text += `- Kalorien: ${Math.round(totalNutrition.calories)} kcal\n`;
		text += `- Protein: ${Math.round(totalNutrition.protein)}g\n`;
		text += `- Kohlenhydrate: ${Math.round(totalNutrition.carbohydrates)}g\n`;
		text += `- Fett: ${Math.round(totalNutrition.fat)}g\n`;
		text += `- Ballaststoffe: ${Math.round(totalNutrition.fiber)}g\n`;

		// Generate smart feedback based on nutrition values
		const feedback = this.generateMealFeedback(totalNutrition, foods);
		if (feedback.positives.length > 0 || feedback.improvements.length > 0) {
			text += '\n---\n';

			if (feedback.positives.length > 0) {
				text += `\n**👍 Positiv:**\n`;
				for (const positive of feedback.positives) {
					text += `- ${positive}\n`;
				}
			}

			if (feedback.improvements.length > 0) {
				text += `\n**💡 Verbesserungsvorschläge:**\n`;
				for (const improvement of feedback.improvements) {
					text += `- ${improvement}\n`;
				}
			}
		}

		// Add backend warnings if present
		if (warnings && warnings.length > 0) {
			text += `\n**⚠️ Hinweise:**\n`;
			for (const warning of warnings) {
				text += `- ${warning}\n`;
			}
		}

		// Add backend suggestions if present
		if (suggestions && suggestions.length > 0) {
			text += `\n**📝 Weitere Tipps:**\n`;
			for (const suggestion of suggestions) {
				text += `- ${suggestion}\n`;
			}
		}

		return text;
	}

	/**
	 * Generate smart feedback based on nutritional values
	 */
	private generateMealFeedback(
		nutrition: AIAnalysisResult['totalNutrition'],
		foods: AIAnalysisResult['foods']
	): { positives: string[]; improvements: string[] } {
		const positives: string[] = [];
		const improvements: string[] = [];

		const { calories, protein, carbohydrates, fat, fiber } = nutrition;

		// Calculate macros as percentage of calories
		const proteinCals = protein * 4;
		const carbCals = carbohydrates * 4;
		const fatCals = fat * 9;
		const totalMacroCals = proteinCals + carbCals + fatCals;

		const proteinPct = totalMacroCals > 0 ? (proteinCals / totalMacroCals) * 100 : 0;
		const carbPct = totalMacroCals > 0 ? (carbCals / totalMacroCals) * 100 : 0;
		const fatPct = totalMacroCals > 0 ? (fatCals / totalMacroCals) * 100 : 0;

		// Check for food variety
		const foodNames = foods.map((f) => f.name.toLowerCase());
		const hasNuts = foodNames.some(
			(n) =>
				n.includes('nuss') || n.includes('mandel') || n.includes('cashew') || n.includes('walnuss')
		);
		const hasFruit = foodNames.some(
			(n) =>
				n.includes('apfel') ||
				n.includes('banane') ||
				n.includes('beere') ||
				n.includes('orange') ||
				n.includes('mandarine')
		);
		const hasVegetables = foodNames.some(
			(n) =>
				n.includes('salat') ||
				n.includes('gemüse') ||
				n.includes('karotte') ||
				n.includes('tomate') ||
				n.includes('gurke') ||
				n.includes('brokkoli') ||
				n.includes('spinat') ||
				n.includes('pastinake')
		);
		const hasWholeGrains = foodNames.some(
			(n) =>
				n.includes('haferflocken') ||
				n.includes('vollkorn') ||
				n.includes('quinoa') ||
				n.includes('dinkel')
		);
		const hasProteinSource = foodNames.some(
			(n) =>
				n.includes('ei') ||
				n.includes('fleisch') ||
				n.includes('fisch') ||
				n.includes('huhn') ||
				n.includes('lachs') ||
				n.includes('thunfisch') ||
				n.includes('tofu') ||
				n.includes('quark') ||
				n.includes('joghurt')
		);

		// Positive feedback
		if (fiber >= 8) {
			positives.push('Sehr guter Ballaststoffgehalt - fördert die Verdauung und hält länger satt');
		} else if (fiber >= 5) {
			positives.push('Guter Ballaststoffgehalt');
		}

		if (proteinPct >= 20 && proteinPct <= 35) {
			positives.push('Ausgewogener Proteinanteil für Muskelerhalt und Sättigung');
		} else if (protein >= 20) {
			positives.push('Proteinreiche Mahlzeit - gut für Muskelaufbau');
		}

		if (hasWholeGrains) {
			positives.push('Vollkornprodukte liefern langanhaltende Energie');
		}

		if (hasNuts) {
			positives.push('Nüsse liefern gesunde Fette und wichtige Mineralstoffe');
		}

		if (hasFruit && hasVegetables) {
			positives.push('Gute Mischung aus Obst und Gemüse für Vitamine');
		} else if (hasFruit) {
			positives.push('Obst liefert natürliche Vitamine und Antioxidantien');
		} else if (hasVegetables) {
			positives.push('Gemüse liefert wichtige Vitamine und Mineralstoffe');
		}

		// Improvement suggestions
		if (calories > 800 && calories <= 1200) {
			improvements.push(
				'Diese Mahlzeit ist recht kalorienreich - ideal als Hauptmahlzeit, weniger als Snack'
			);
		} else if (calories > 1200) {
			improvements.push(
				'Sehr kalorienreiche Mahlzeit - evtl. Portionsgröße reduzieren oder über den Tag verteilen'
			);
		}

		if (fatPct > 45) {
			improvements.push(
				'Hoher Fettanteil - evtl. Ölmenge reduzieren oder fettärmere Alternativen wählen'
			);
		}

		if (fiber < 3 && calories > 300) {
			improvements.push('Mehr Ballaststoffe durch Gemüse, Vollkorn oder Hülsenfrüchte ergänzen');
		}

		if (proteinPct < 15 && calories > 400) {
			improvements.push(
				'Proteinquelle ergänzen (z.B. Quark, Joghurt, Nüsse oder Samen) für bessere Sättigung'
			);
		}

		if (!hasFruit && !hasVegetables && calories > 300) {
			improvements.push('Obst oder Gemüse ergänzen für mehr Vitamine und Mineralstoffe');
		}

		if (carbPct > 60 && protein < 15) {
			improvements.push(
				'Sehr kohlenhydratreich - Proteinquelle ergänzen für stabileren Blutzucker'
			);
		}

		// Specific food-based suggestions
		const hasMultipleOils = foodNames.filter((n) => n.includes('öl')).length > 2;
		if (hasMultipleOils) {
			improvements.push('Mehrere Ölsorten - ein hochwertiges Öl (z.B. Olivenöl) reicht meist aus');
		}

		return { positives, improvements };
	}

	private async handleToday(roomId: string, sender: string) {
		const token = await this.requireLogin(roomId, sender);
		if (!token) return;

		await this.client.setTyping(roomId, true, 10000);

		try {
			const today = new Date().toISOString().split('T')[0];
			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.getDailySummary(today, t)
			);

			await this.client.setTyping(roomId, false);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			await this.sendMessage(roomId, this.formatDailySummary(apiResult.result));
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
		const token = await this.requireLogin(roomId, sender);
		if (!token) return;

		await this.client.setTyping(roomId, true, 10000);

		try {
			const today = new Date().toISOString().split('T')[0];
			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.getWeeklyStats(today, t)
			);

			await this.client.setTyping(roomId, false);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			await this.sendMessage(roomId, this.formatWeeklyStats(apiResult.result));
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
		const token = await this.requireLogin(roomId, sender);
		if (!token) return;

		try {
			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.getGoals(t)
			);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			const goals = apiResult.result;

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
		const token = await this.requireLogin(roomId, sender);
		if (!token) return;

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
			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.setGoals(
					{
						dailyCalories: calories,
						dailyProtein: protein,
						dailyCarbs: carbs,
						dailyFat: fat,
					},
					t
				)
			);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

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
		const token = await this.requireLogin(roomId, sender);
		if (!token) return;

		try {
			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.getFavorites(t)
			);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			const favorites = apiResult.result;

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
		const token = await this.requireLogin(roomId, sender);
		if (!token) return;

		try {
			const apiResult = await this.withTokenRefresh(sender, token, (t) =>
				this.nutriphiService.getRecommendations(t)
			);

			if ('error' in apiResult) {
				await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
				return;
			}

			const recommendations = apiResult.result;

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

	/**
	 * Require login - returns token or sends login prompt and returns null
	 */
	private async requireLogin(roomId: string, userId: string): Promise<string | null> {
		const token = await this.sessionService.getToken(userId);
		if (!token) {
			await this.sendMessage(roomId, LOGIN_MESSAGES.nutriphi);
			return null;
		}
		return token;
	}

	/**
	 * Check if an error is a token expiration error (JWT exp claim failed)
	 */
	private isTokenExpiredError(error: unknown): boolean {
		if (error instanceof Error) {
			const message = error.message.toLowerCase();
			return (
				(message.includes('401') || message.includes('unauthorized')) &&
				(message.includes('exp') || message.includes('expired') || message.includes('token'))
			);
		}
		return false;
	}

	/**
	 * Refresh token by clearing session and fetching new one via Matrix-SSO-Link
	 */
	private async refreshToken(userId: string): Promise<string | null> {
		this.logger.log(`Token expired for ${userId}, attempting refresh via Matrix-SSO-Link...`);
		// Clear the expired session
		await this.sessionService.logout(userId);
		// Try to get a new token via Matrix-SSO-Link
		const newToken = await this.sessionService.getToken(userId);
		if (newToken) {
			this.logger.log(`Token refreshed successfully for ${userId}`);
		} else {
			this.logger.warn(`Token refresh failed for ${userId} - user needs to re-login`);
		}
		return newToken;
	}

	/**
	 * Execute an API operation with automatic token refresh on expiration
	 */
	private async withTokenRefresh<T>(
		userId: string,
		token: string,
		operation: (token: string) => Promise<T>
	): Promise<{ result: T; newToken?: string } | { error: 'token_refresh_failed' }> {
		try {
			const result = await operation(token);
			return { result };
		} catch (error) {
			if (this.isTokenExpiredError(error)) {
				const newToken = await this.refreshToken(userId);
				if (!newToken) {
					return { error: 'token_refresh_failed' };
				}
				const result = await operation(newToken);
				return { result, newToken };
			}
			throw error;
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendHealthy = await this.nutriphiService.checkHealth();
		const isLoggedIn = await this.sessionService.isLoggedIn(sender);
		const sessionCount = this.sessionService.getSessionCount();
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let statusText = `**NutriPhi Bot Status**\n\n`;
		statusText += `**Backend:** ${backendHealthy ? '✅ Online' : '❌ Offline'}\n`;
		statusText += `**Aktive Sessions:** ${sessionCount}\n\n`;

		if (isLoggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			statusText += `👤 Angemeldet als: ${session.email}\n`;
			statusText += `⚡ Credits: ${balance.balance.toFixed(2)}\n`;
		} else {
			statusText += `👤 Nicht angemeldet\n`;
			statusText += `💡 Login: \`!login email passwort\``;
		}

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
		this.logger.log(`Downloading image from ${mxcUrl}`);

		// Use the authenticated download method from BaseMatrixService
		const buffer = await this.downloadMedia(mxcUrl);
		return buffer.toString('base64');
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
