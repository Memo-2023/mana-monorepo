import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { QuotesService } from '../quotes/quotes.service';
import { UserService } from '../user/user.service';

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);

	// Track last shown quote per user for /favorite command
	private lastQuote: Map<number, string> = new Map();

	constructor(
		private readonly quotesService: QuotesService,
		private readonly userService: UserService
	) {}

	private formatHelp(): string {
		return `<b>✨ Zitare Bot</b>

Deine tägliche Dosis Inspiration mit deutschen Zitaten.

<b>Zitate:</b>
/quote oder /zitat - Zufälliges Zitat
/search [Begriff] - Zitate suchen
/author [Name] - Zitate eines Autors

<b>Favoriten:</b>
/favorite - Aktuelles Zitat speichern
/favorites - Deine Favoriten anzeigen
/removefav [Nr] - Favorit entfernen

<b>Täglich:</b>
/daily - Tägliches Zitat an/aus

<b>Tipp:</b> Starte mit /quote für ein erstes Zitat!`;
	}

	@Start()
	async start(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		const username = ctx.from?.username;

		if (!userId) return;

		// Ensure user exists in database
		await this.userService.ensureUser(userId, username);

		this.logger.log(`/start from user ${userId} (@${username})`);
		await ctx.replyWithHTML(this.formatHelp());
	}

	@Help()
	async help(@Ctx() ctx: Context) {
		await ctx.replyWithHTML(this.formatHelp());
	}

	@Command('quote')
	async quote(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		await this.userService.ensureUser(userId, ctx.from?.username);

		const quote = this.quotesService.getRandomQuote();
		this.lastQuote.set(userId, quote.id);

		const formatted = this.quotesService.formatQuote(quote);
		await ctx.reply(formatted);
	}

	@Command('zitat')
	async zitat(@Ctx() ctx: Context) {
		await this.quote(ctx);
	}

	@Command('search')
	async search(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const term = text.replace('/search', '').trim();
		if (!term) {
			await ctx.reply('Verwendung: /search [Begriff]\n\nBeispiel: /search Leben');
			return;
		}

		const results = this.quotesService.search(term);

		if (results.length === 0) {
			await ctx.reply(`Keine Zitate gefunden für "${term}".`);
			return;
		}

		let response = `<b>🔍 Suchergebnisse für "${term}":</b>\n\n`;
		results.forEach((quote, index) => {
			response += `<b>${index + 1}.</b> „${quote.text}"\n— ${quote.author.name}\n\n`;
		});

		// Store last quote for /favorite
		if (results.length > 0) {
			this.lastQuote.set(userId, results[0].id);
		}

		await ctx.replyWithHTML(response);
	}

	@Command('author')
	async author(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const authorName = text.replace('/author', '').trim();
		if (!authorName) {
			await ctx.reply('Verwendung: /author [Name]\n\nBeispiel: /author Einstein');
			return;
		}

		const results = this.quotesService.getByAuthor(authorName);

		if (results.length === 0) {
			await ctx.reply(`Keine Zitate gefunden von "${authorName}".`);
			return;
		}

		let response = `<b>📚 Zitate von ${results[0].author.name}:</b>\n\n`;
		results.forEach((quote, index) => {
			response += `<b>${index + 1}.</b> „${quote.text}"\n\n`;
		});

		// Store last quote for /favorite
		if (results.length > 0) {
			this.lastQuote.set(userId, results[0].id);
		}

		await ctx.replyWithHTML(response);
	}

	@Command('favorite')
	async favorite(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		await this.userService.ensureUser(userId, ctx.from?.username);

		const lastQuoteId = this.lastQuote.get(userId);
		if (!lastQuoteId) {
			await ctx.reply('Kein aktuelles Zitat zum Speichern.\n\nHole dir erst ein Zitat mit /quote');
			return;
		}

		const added = await this.userService.addFavorite(userId, lastQuoteId);

		if (added) {
			await ctx.reply('⭐ Zitat zu Favoriten hinzugefügt!');
		} else {
			await ctx.reply('ℹ️ Dieses Zitat ist bereits in deinen Favoriten.');
		}
	}

	@Command('favorites')
	async favorites(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		await this.userService.ensureUser(userId, ctx.from?.username);

		const favoriteIds = await this.userService.getFavoriteQuoteIds(userId);

		if (favoriteIds.length === 0) {
			await ctx.reply(
				'Du hast noch keine Favoriten.\n\nSpeichere Zitate mit /favorite nach /quote'
			);
			return;
		}

		const quotes = this.quotesService.getQuotesByIds(favoriteIds);

		let response = `<b>⭐ Deine Favoriten (${quotes.length}):</b>\n\n`;
		quotes.forEach((quote, index) => {
			response += `<b>${index + 1}.</b> „${quote.text}"\n— ${quote.author.name}\n\n`;
		});

		response += `\nEntfernen mit /removefav [Nr]`;

		await ctx.replyWithHTML(response);
	}

	@Command('removefav')
	async removeFavorite(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const indexStr = text.replace('/removefav', '').trim();
		const index = parseInt(indexStr, 10);

		if (!indexStr || isNaN(index) || index < 1) {
			await ctx.reply(
				'Verwendung: /removefav [Nr]\n\nZeige deine Favoriten mit /favorites um die Nummer zu sehen.'
			);
			return;
		}

		const favoriteIds = await this.userService.getFavoriteQuoteIds(userId);

		if (index > favoriteIds.length) {
			await ctx.reply(`Ungültige Nummer. Du hast ${favoriteIds.length} Favoriten.`);
			return;
		}

		const quoteId = favoriteIds[index - 1];
		const removed = await this.userService.removeFavorite(userId, quoteId);

		if (removed) {
			await ctx.reply(`✅ Favorit #${index} entfernt.`);
		} else {
			await ctx.reply('Fehler beim Entfernen.');
		}
	}

	@Command('daily')
	async daily(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		await this.userService.ensureUser(userId, ctx.from?.username);

		const newState = await this.userService.toggleDaily(userId);
		const settings = await this.userService.getDailySettings(userId);

		if (newState) {
			await ctx.replyWithHTML(
				`✅ <b>Tägliches Zitat aktiviert!</b>\n\n` +
					`Du erhältst jeden Tag um ${settings?.time || '08:00'} Uhr ein inspirierendes Zitat.\n\n` +
					`Mit /daily wieder deaktivieren.`
			);
		} else {
			await ctx.reply('❌ Tägliches Zitat deaktiviert.');
		}
	}
}
