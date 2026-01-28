import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../analysis/gemini.service';
import { MealsService } from '../meals/meals.service';
import { GoalsService } from '../goals/goals.service';
import { StatsService } from '../stats/stats.service';
import { MEAL_TYPES, MealType } from '../config/configuration';
import { Meal, NutritionData } from '../database/schema';

interface PhotoSize {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	file_size?: number;
}

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);
	private readonly allowedUsers: number[];
	private readonly telegramApiUrl: string;

	// Track last meal for /favorit command
	private lastMeal: Map<number, Meal> = new Map();

	constructor(
		private readonly geminiService: GeminiService,
		private readonly mealsService: MealsService,
		private readonly goalsService: GoalsService,
		private readonly statsService: StatsService,
		private configService: ConfigService
	) {
		this.allowedUsers = this.configService.get<number[]>('telegram.allowedUsers') || [];
		const token = this.configService.get<string>('telegram.token');
		this.telegramApiUrl = `https://api.telegram.org/bot${token}`;
	}

	private isAllowed(userId: number): boolean {
		if (this.allowedUsers.length === 0) return true;
		return this.allowedUsers.includes(userId);
	}

	private formatHelp(): string {
		return `<b>🥗 NutriPhi Bot</b>

Dein KI-gestützter Ernährungs-Tracker.

<b>Mahlzeit erfassen:</b>
📷 Foto senden - Automatische Analyse
💬 Text senden - z.B. "Spaghetti Bolognese"

<b>Übersicht:</b>
/heute - Heutige Mahlzeiten & Fortschritt
/woche - Wochenstatistik

<b>Ziele:</b>
/ziele - Aktuelle Ziele anzeigen
/ziele [kcal] [P] [K] [F] - Ziele setzen
  Beispiel: /ziele 2000 100 200 70

<b>Favoriten:</b>
/favorit [Name] - Letzte Mahlzeit speichern
/favoriten - Gespeicherte Mahlzeiten anzeigen
/essen [Nr] - Favorit als Mahlzeit eintragen
/delfav [Nr] - Favorit löschen

<b>Sonstiges:</b>
/loeschen - Letzte Mahlzeit löschen
/hilfe - Diese Hilfe anzeigen

<b>Tipp:</b> Starte mit einem Foto deiner Mahlzeit!`;
	}

	@Start()
	async start(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		// Ensure user has goals
		await this.goalsService.ensureGoals(userId);

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

	@Command('hilfe')
	async hilfe(@Ctx() ctx: Context) {
		await this.help(ctx);
	}

	@Command('heute')
	async today(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const summary = await this.statsService.getDailySummary(userId);

		if (summary.meals.length === 0) {
			await ctx.reply(
				'📭 Noch keine Mahlzeiten heute.\n\nSende ein Foto oder beschreibe deine Mahlzeit!'
			);
			return;
		}

		// Format meals list
		const mealsList = summary.meals
			.map((m, i) => {
				const type = MEAL_TYPES[m.mealType as MealType] || m.mealType;
				const time = new Date(m.createdAt).toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit',
				});
				return `${i + 1}. <b>${type}</b> (${time})\n   ${m.description}\n   ${m.calories} kcal`;
			})
			.join('\n\n');

		// Format totals and progress
		let response =
			`<b>📊 Heute (${new Date().toLocaleDateString('de-DE')})</b>\n\n` +
			`${mealsList}\n\n` +
			`<b>─────────────────</b>\n` +
			`<b>Gesamt:</b> ${summary.totals.calories} kcal\n\n`;

		if (summary.goals) {
			response +=
				`<b>Fortschritt:</b>\n` +
				`Kalorien: ${StatsService.formatProgressBar(summary.progress.calories)}\n` +
				`Protein: ${StatsService.formatProgressBar(summary.progress.protein)}\n` +
				`Kohlenhydr.: ${StatsService.formatProgressBar(summary.progress.carbohydrates)}\n` +
				`Fett: ${StatsService.formatProgressBar(summary.progress.fat)}\n\n` +
				`<b>Verbleibend:</b> ${Math.max(0, summary.goals.dailyCalories - summary.totals.calories)} kcal`;
		}

		await ctx.replyWithHTML(response);
	}

	@Command('woche')
	async week(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const summary = await this.statsService.getWeeklySummary(userId);

		if (summary.totalMeals === 0) {
			await ctx.reply('📭 Keine Mahlzeiten in den letzten 7 Tagen.');
			return;
		}

		// Format days chart
		const maxCal = Math.max(...summary.days.map((d) => d.calories), 1);
		const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

		const chart = summary.days
			.map((d) => {
				const date = new Date(d.date);
				const dayName = dayNames[date.getDay()];
				const barLen = Math.round((d.calories / maxCal) * 8);
				const bar = '█'.repeat(barLen) + '░'.repeat(8 - barLen);
				return `${dayName} ${bar} ${d.calories}`;
			})
			.join('\n');

		const response =
			`<b>📈 Wochenübersicht</b>\n\n` +
			`<code>${chart}</code>\n\n` +
			`<b>Durchschnitt:</b>\n` +
			`Kalorien: ${summary.averages.calories} kcal\n` +
			`Protein: ${summary.averages.protein}g\n` +
			`Kohlenhydrate: ${summary.averages.carbohydrates}g\n` +
			`Fett: ${summary.averages.fat}g\n\n` +
			`<b>Gesamt:</b> ${summary.totalMeals} Mahlzeiten`;

		await ctx.replyWithHTML(response);
	}

	@Command('ziele')
	async goals(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const args = text.replace('/ziele', '').trim();

		// If no args, show current goals
		if (!args) {
			const goals = await this.goalsService.ensureGoals(userId);
			await ctx.replyWithHTML(
				`<b>🎯 Deine Tagesziele</b>\n\n` +
					`Kalorien: ${goals.dailyCalories} kcal\n` +
					`Protein: ${goals.dailyProtein}g\n` +
					`Kohlenhydrate: ${goals.dailyCarbs}g\n` +
					`Fett: ${goals.dailyFat}g\n` +
					`Ballaststoffe: ${goals.dailyFiber}g\n\n` +
					`<b>Ändern:</b>\n/ziele [kcal] [Protein] [Kohlenhydrate] [Fett]\nBeispiel: /ziele 2000 100 200 70`
			);
			return;
		}

		// Parse new goals
		const parts = args.split(/\s+/).map((n) => parseInt(n, 10));
		if (parts.length < 4 || parts.some(isNaN)) {
			await ctx.reply(
				'Verwendung: /ziele [kcal] [Protein] [Kohlenhydrate] [Fett]\n\n' +
					'Beispiel: /ziele 2000 100 200 70'
			);
			return;
		}

		const [calories, protein, carbs, fat] = parts;
		const fiber = parts[4] || 30; // Optional 5th parameter

		await this.goalsService.setGoals(userId, {
			dailyCalories: calories,
			dailyProtein: protein,
			dailyCarbs: carbs,
			dailyFat: fat,
			dailyFiber: fiber,
		});

		await ctx.replyWithHTML(
			`✅ <b>Ziele aktualisiert!</b>\n\n` +
				`Kalorien: ${calories} kcal\n` +
				`Protein: ${protein}g\n` +
				`Kohlenhydrate: ${carbs}g\n` +
				`Fett: ${fat}g\n` +
				`Ballaststoffe: ${fiber}g`
		);
	}

	@Command('favorit')
	async saveFavorite(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const name = text.replace('/favorit', '').trim();
		if (!name) {
			await ctx.reply('Verwendung: /favorit [Name]\n\nBeispiel: /favorit Morgenmüsli');
			return;
		}

		const lastMeal = this.lastMeal.get(userId);
		if (!lastMeal) {
			await ctx.reply('Keine aktuelle Mahlzeit zum Speichern.\n\nErfasse erst eine Mahlzeit.');
			return;
		}

		await this.mealsService.saveAsFavorite(userId, lastMeal, name);
		await ctx.reply(`⭐ "${name}" als Favorit gespeichert!`);
	}

	@Command('favoriten')
	async listFavorites(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const favorites = await this.mealsService.getFavorites(userId);

		if (favorites.length === 0) {
			await ctx.reply(
				'Keine Favoriten gespeichert.\n\n' + 'Speichere eine Mahlzeit mit /favorit [Name]'
			);
			return;
		}

		const list = favorites
			.map((f, i) => {
				const nutrition = f.nutrition as NutritionData;
				return `<b>${i + 1}.</b> ${f.name}\n   ${nutrition.calories} kcal | ${nutrition.protein}g P | ${nutrition.carbohydrates}g K | ${nutrition.fat}g F`;
			})
			.join('\n\n');

		await ctx.replyWithHTML(
			`<b>⭐ Deine Favoriten</b>\n\n${list}\n\n` + `Verwenden: /essen [Nr]\nLöschen: /delfav [Nr]`
		);
	}

	@Command('essen')
	async useFavorite(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const indexStr = text.replace('/essen', '').trim();
		const index = parseInt(indexStr, 10);

		if (!indexStr || isNaN(index)) {
			await ctx.reply('Verwendung: /essen [Nr]\n\nZeige Favoriten mit /favoriten');
			return;
		}

		const favorite = await this.mealsService.getFavoriteByIndex(userId, index);
		if (!favorite) {
			await ctx.reply(`Favorit #${index} nicht gefunden.`);
			return;
		}

		const meal = await this.mealsService.createFromFavorite(userId, favorite);
		this.lastMeal.set(userId, meal);

		const nutrition = favorite.nutrition as NutritionData;
		await ctx.replyWithHTML(
			`✅ <b>${favorite.name}</b> eingetragen!\n\n` +
				`${nutrition.calories} kcal | ${nutrition.protein}g P | ${nutrition.carbohydrates}g K | ${nutrition.fat}g F\n\n` +
				`Übersicht: /heute`
		);
	}

	@Command('delfav')
	async deleteFavorite(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const indexStr = text.replace('/delfav', '').trim();
		const index = parseInt(indexStr, 10);

		if (!indexStr || isNaN(index)) {
			await ctx.reply('Verwendung: /delfav [Nr]\n\nZeige Favoriten mit /favoriten');
			return;
		}

		const favorite = await this.mealsService.getFavoriteByIndex(userId, index);
		if (!favorite) {
			await ctx.reply(`Favorit #${index} nicht gefunden.`);
			return;
		}

		await this.mealsService.deleteFavorite(favorite.id);
		await ctx.reply(`✅ "${favorite.name}" gelöscht.`);
	}

	@Command('loeschen')
	async deleteLastMeal(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const deleted = await this.mealsService.deleteLastMeal(userId);
		if (deleted) {
			this.lastMeal.delete(userId);
			await ctx.reply('✅ Letzte Mahlzeit gelöscht.');
		} else {
			await ctx.reply('Keine Mahlzeit zum Löschen gefunden.');
		}
	}

	@On('photo')
	async onPhoto(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		if (!this.geminiService.isAvailable()) {
			await ctx.reply('❌ Analyse nicht verfügbar (API nicht konfiguriert).');
			return;
		}

		const message = ctx.message as { photo?: PhotoSize[]; caption?: string };
		const photos = message.photo;
		if (!photos || photos.length === 0) return;

		// Get largest photo
		const photo = photos[photos.length - 1];

		await ctx.reply('🔍 Analysiere Mahlzeit...');
		await ctx.sendChatAction('typing');

		try {
			// Download photo from Telegram
			const imageBase64 = await this.downloadTelegramFile(photo.file_id);

			// Analyze with Gemini
			const analysis = await this.geminiService.analyzeImage(imageBase64);

			// Save meal
			const meal = await this.mealsService.createFromAnalysis(userId, 'photo', analysis);
			this.lastMeal.set(userId, meal);

			// Format response
			const foodsList = analysis.foods.map((f) => `• ${f.name} (${f.quantity})`).join('\n');

			const n = analysis.totalNutrition;
			const confidence = Math.round(analysis.confidence * 100);

			await ctx.replyWithHTML(
				`<b>🍽️ ${analysis.description}</b>\n\n` +
					`<b>Erkannt:</b>\n${foodsList}\n\n` +
					`<b>Nährwerte:</b>\n` +
					`Kalorien: ${n.calories} kcal\n` +
					`Protein: ${n.protein}g\n` +
					`Kohlenhydrate: ${n.carbohydrates}g\n` +
					`Fett: ${n.fat}g\n` +
					`Ballaststoffe: ${n.fiber}g\n` +
					`Zucker: ${n.sugar}g\n\n` +
					`<i>Genauigkeit: ${confidence}%</i>\n\n` +
					`Als Favorit speichern: /favorit [Name]`
			);
		} catch (error) {
			this.logger.error('Photo analysis failed:', error);
			const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await ctx.reply(`❌ Analyse fehlgeschlagen: ${message}`);
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

		if (!this.geminiService.isAvailable()) {
			await ctx.reply('❌ Analyse nicht verfügbar (API nicht konfiguriert).');
			return;
		}

		// Analyze text as meal description
		await ctx.reply('🔍 Analysiere...');
		await ctx.sendChatAction('typing');

		try {
			const analysis = await this.geminiService.analyzeText(text);

			// Save meal
			const meal = await this.mealsService.createFromAnalysis(userId, 'text', analysis);
			this.lastMeal.set(userId, meal);

			// Format response
			const n = analysis.totalNutrition;
			const confidence = Math.round(analysis.confidence * 100);

			await ctx.replyWithHTML(
				`<b>✅ ${analysis.description}</b>\n\n` +
					`<b>Nährwerte:</b>\n` +
					`Kalorien: ${n.calories} kcal\n` +
					`Protein: ${n.protein}g\n` +
					`Kohlenhydrate: ${n.carbohydrates}g\n` +
					`Fett: ${n.fat}g\n` +
					`Ballaststoffe: ${n.fiber}g\n` +
					`Zucker: ${n.sugar}g\n\n` +
					`<i>Genauigkeit: ${confidence}%</i>\n\n` +
					`Als Favorit speichern: /favorit [Name]`
			);
		} catch (error) {
			this.logger.error('Text analysis failed:', error);
			const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await ctx.reply(`❌ Analyse fehlgeschlagen: ${message}`);
		}
	}

	// Download file from Telegram and return Base64
	private async downloadTelegramFile(fileId: string): Promise<string> {
		// Get file path
		const fileResponse = await fetch(`${this.telegramApiUrl}/getFile?file_id=${fileId}`);
		const fileData = await fileResponse.json();

		if (!fileData.ok) {
			throw new Error(`Telegram API error: ${fileData.description}`);
		}

		// Download file
		const token = this.configService.get<string>('telegram.token');
		const fileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;

		const response = await fetch(fileUrl);
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		return buffer.toString('base64');
	}
}
