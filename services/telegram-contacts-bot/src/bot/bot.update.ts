import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { ContactsClient } from '../contacts/contacts.client';
import { UserService } from '../user/user.service';
import {
	formatHelpMessage,
	formatSearchResults,
	formatFavorites,
	formatRecentContacts,
	formatUpcomingBirthdays,
	formatTags,
	formatContactsByTag,
	formatStats,
	formatContact,
	formatContactCreated,
	formatStatusMessage,
} from './formatters';

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);
	private readonly allowedUsers: number[];

	constructor(
		private readonly configService: ConfigService,
		private readonly contactsClient: ContactsClient,
		private readonly userService: UserService
	) {
		this.allowedUsers = this.configService.get<number[]>('telegram.allowedUsers') || [];
	}

	private isAllowed(userId: number): boolean {
		if (this.allowedUsers.length === 0) return true;
		return this.allowedUsers.includes(userId);
	}

	private async getAccessToken(telegramUserId: number): Promise<string | null> {
		const user = await this.userService.getUserByTelegramId(telegramUserId);
		if (!user || !user.isActive || !user.accessToken) {
			return null;
		}
		return user.accessToken;
	}

	@Start()
	async start(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/start from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('❌ Du bist nicht berechtigt, diesen Bot zu nutzen.');
			return;
		}

		await ctx.replyWithHTML(formatHelpMessage());
	}

	@Help()
	async help(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) return;

		await ctx.replyWithHTML(formatHelpMessage());
	}

	@Command('search')
	async search(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		this.logger.log(`/search from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const query = text.replace(/^\/search\s*/i, '').trim();

		if (!query) {
			await ctx.reply('❓ Bitte gib einen Suchbegriff ein.\n\nBeispiel: /search Max');
			return;
		}

		await ctx.reply(`🔍 Suche nach "${query}"...`);
		await this.userService.updateLastActive(userId);

		const contacts = await this.contactsClient.searchContacts(accessToken, query);
		await ctx.replyWithHTML(formatSearchResults(contacts, query));
	}

	@Command('favorites')
	async favorites(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/favorites from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('⭐ Lade Favoriten...');
		await this.userService.updateLastActive(userId);

		const contacts = await this.contactsClient.getFavorites(accessToken);
		await ctx.replyWithHTML(formatFavorites(contacts));
	}

	@Command('recent')
	async recent(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/recent from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('🕐 Lade kürzlich hinzugefügte Kontakte...');
		await this.userService.updateLastActive(userId);

		const contacts = await this.contactsClient.getRecentContacts(accessToken, 10);
		await ctx.replyWithHTML(formatRecentContacts(contacts));
	}

	@Command('birthdays')
	async birthdays(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/birthdays from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('🎂 Lade anstehende Geburtstage...');
		await this.userService.updateLastActive(userId);

		const settings = await this.userService.getBotSettings(userId);
		const daysAhead = settings?.birthdayReminderDays || 30;

		const contacts = await this.contactsClient.getUpcomingBirthdays(accessToken, daysAhead);
		await ctx.replyWithHTML(formatUpcomingBirthdays(contacts, daysAhead));
	}

	@Command('tags')
	async tags(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/tags from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await this.userService.updateLastActive(userId);

		const tags = await this.contactsClient.getTags(accessToken);
		await ctx.replyWithHTML(formatTags(tags));
	}

	@Command('tag')
	async tag(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		this.logger.log(`/tag from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const tagName = text.replace(/^\/tag\s*/i, '').trim().replace(/^#/, '');

		if (!tagName) {
			await ctx.reply('❓ Bitte gib einen Tag-Namen ein.\n\nBeispiel: /tag Familie');
			return;
		}

		await ctx.reply(`🏷️ Lade Kontakte mit Tag #${tagName}...`);
		await this.userService.updateLastActive(userId);

		// Find tag ID by name
		const tags = await this.contactsClient.getTags(accessToken);
		const tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());

		if (!tag) {
			await ctx.reply(`❌ Tag "#${tagName}" nicht gefunden.\n\nNutze /tags um alle Tags zu sehen.`);
			return;
		}

		const contacts = await this.contactsClient.getContactsByTag(accessToken, tag.id);
		await ctx.replyWithHTML(formatContactsByTag(contacts, tagName));
	}

	@Command('stats')
	async stats(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/stats from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('📊 Lade Statistiken...');
		await this.userService.updateLastActive(userId);

		const stats = await this.contactsClient.getStats(accessToken);
		await ctx.replyWithHTML(formatStats(stats));
	}

	@Command('add')
	async add(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		this.logger.log(`/add from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const input = text.replace(/^\/add\s*/i, '').trim();

		if (!input) {
			await ctx.replyWithHTML(`📝 <b>Kontakt erstellen</b>

Beispiele:
• /add Max Mustermann
• /add Anna Schmidt 0171-1234567
• /add info@firma.de

Format: /add [Name] [Telefon/Email]`);
			return;
		}

		// Parse input: try to extract name, phone, email
		const parts = input.split(/\s+/);
		const data: {
			firstName?: string;
			lastName?: string;
			phone?: string;
			email?: string;
		} = {};

		for (const part of parts) {
			if (part.includes('@')) {
				data.email = part;
			} else if (/^[\d+\-()]+$/.test(part.replace(/\s/g, ''))) {
				data.phone = part;
			} else if (!data.firstName) {
				data.firstName = part;
			} else if (!data.lastName) {
				data.lastName = part;
			}
		}

		if (!data.firstName && !data.email) {
			await ctx.reply('❌ Bitte gib mindestens einen Namen oder eine E-Mail an.');
			return;
		}

		await ctx.reply('📝 Erstelle Kontakt...');
		await this.userService.updateLastActive(userId);

		const contact = await this.contactsClient.createContact(accessToken, data);

		if (contact) {
			await ctx.replyWithHTML(formatContactCreated(contact));
		} else {
			await ctx.reply('❌ Fehler beim Erstellen des Kontakts.');
		}
	}

	@Command('status')
	async status(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/status from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const user = await this.userService.getUserByTelegramId(userId);

		await ctx.replyWithHTML(
			formatStatusMessage(
				!!user?.isActive && !!user?.accessToken,
				user?.telegramUsername || user?.telegramFirstName,
				user?.lastActiveAt || undefined
			)
		);
	}

	@Command('link')
	async link(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/link from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		await ctx.replyWithHTML(`🔗 <b>Account verknüpfen</b>

Um deinen ManaCore Account zu verknüpfen:

1. Öffne die Contacts Web-App
2. Gehe zu <b>Einstellungen → Integrationen → Telegram</b>
3. Klicke auf "Mit Telegram verknüpfen"
4. Gib deine Telegram User-ID ein: <code>${userId}</code>

Nach der Verknüpfung kannst du alle Bot-Funktionen nutzen.`);
	}

	@Command('unlink')
	async unlink(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/unlink from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) return;

		const success = await this.userService.unlinkUser(userId);

		if (success) {
			await ctx.reply('✅ Account-Verknüpfung wurde aufgehoben.');
		} else {
			await ctx.reply('❌ Fehler beim Aufheben der Verknüpfung.');
		}
	}

	@On('text')
	async onText(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;

		// Ignore commands
		if (text.startsWith('/')) return;

		if (!userId || !this.isAllowed(userId)) return;

		// Check if user is linked
		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) return;

		// Treat any text as a search query
		if (text.length >= 2) {
			this.logger.log(`Search query from ${userId}: ${text.substring(0, 30)}...`);

			await this.userService.updateLastActive(userId);

			const contacts = await this.contactsClient.searchContacts(accessToken, text);

			if (contacts.length === 1) {
				// Show detailed view for single result
				await ctx.replyWithHTML(formatContact(contacts[0], true));
			} else {
				await ctx.replyWithHTML(formatSearchResults(contacts, text));
			}
		}
	}
}
