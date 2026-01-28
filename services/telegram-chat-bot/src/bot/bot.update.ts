import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { ChatClient } from '../chat/chat.client';
import { UserService } from '../user/user.service';
import {
	formatHelpMessage,
	formatModels,
	formatConversations,
	formatMessages,
	formatStatusMessage,
	formatModelChanged,
	formatNewConversation,
} from './formatters';
import { MODEL_DISPLAY_NAMES } from '../config/configuration';

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);
	private readonly allowedUsers: number[];

	constructor(
		private readonly configService: ConfigService,
		private readonly chatClient: ChatClient,
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

	@Command('models')
	async models(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/models from user ${userId}`);
		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('🤖 Lade Modelle...');
		const models = await this.chatClient.getModels(accessToken);
		const userSettings = await this.userService.getUserSettings(userId);

		await ctx.replyWithHTML(formatModels(models, userSettings?.currentModel));
	}

	@Command('model')
	async model(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		this.logger.log(`/model from user ${userId}`);
		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const modelName = text.replace(/^\/model\s*/i, '').trim().toLowerCase();

		if (!modelName) {
			const models = await this.chatClient.getModels(accessToken);
			await ctx.replyWithHTML(
				`⚙️ <b>Modell wählen</b>\n\nNutze: /model [name]\n\nBeispiele:\n• /model gemma\n• /model claude\n• /model gpt\n• /model deepseek\n\n${formatModels(models)}`
			);
			return;
		}

		// Find matching model
		const models = await this.chatClient.getModels(accessToken);
		const model = models.find(
			(m) =>
				m.name.toLowerCase().includes(modelName) || m.id.toLowerCase().includes(modelName)
		);

		if (!model) {
			await ctx.reply(`❌ Modell "${modelName}" nicht gefunden.\n\nNutze /models für eine Liste.`);
			return;
		}

		await this.userService.updateUserSettings(userId, { currentModel: model.id });
		await ctx.replyWithHTML(formatModelChanged(model));
	}

	@Command('convos')
	async convos(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/convos from user ${userId}`);
		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const conversations = await this.chatClient.getConversations(accessToken, 10);
		const userSettings = await this.userService.getUserSettings(userId);

		await ctx.replyWithHTML(formatConversations(conversations, userSettings?.currentConversationId));
	}

	@Command('new')
	async newConversation(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		this.logger.log(`/new from user ${userId}`);
		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const title = text.replace(/^\/new\s*/i, '').trim() || 'Telegram Chat';
		const userSettings = await this.userService.getUserSettings(userId);

		const conversation = await this.chatClient.createConversation(
			accessToken,
			title,
			userSettings?.currentModel || undefined
		);

		if (!conversation) {
			await ctx.reply('❌ Fehler beim Erstellen der Konversation.');
			return;
		}

		await this.userService.updateUserSettings(userId, { currentConversationId: conversation.id });
		await ctx.replyWithHTML(formatNewConversation(conversation));
	}

	@Command('history')
	async history(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/history from user ${userId}`);
		if (!userId || !this.isAllowed(userId)) return;

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const userSettings = await this.userService.getUserSettings(userId);
		if (!userSettings?.currentConversationId) {
			await ctx.reply('❌ Keine aktive Konversation. Starte eine mit /new');
			return;
		}

		const messages = await this.chatClient.getMessages(
			accessToken,
			userSettings.currentConversationId,
			10
		);

		await ctx.replyWithHTML(formatMessages(messages));
	}

	@Command('clear')
	async clear(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/clear from user ${userId}`);
		if (!userId || !this.isAllowed(userId)) return;

		await this.userService.updateUserSettings(userId, { currentConversationId: null });
		await ctx.reply('🗑️ Konversation gewechselt. Die nächste Nachricht startet einen neuen Chat.');
	}

	@Command('status')
	async status(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/status from user ${userId}`);
		if (!userId || !this.isAllowed(userId)) return;

		const user = await this.userService.getUserByTelegramId(userId);
		const settings = await this.userService.getUserSettings(userId);

		await ctx.replyWithHTML(
			formatStatusMessage(
				!!user?.isActive && !!user?.accessToken,
				user?.telegramUsername || user?.telegramFirstName,
				settings?.currentModel,
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

1. Öffne die Chat Web-App: <b>chat.mana.how</b>
2. Gehe zu <b>Einstellungen → Telegram</b>
3. Gib deine Telegram User-ID ein: <code>${userId}</code>

Nach der Verknüpfung kannst du direkt chatten!`);
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

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await this.userService.updateLastActive(userId);

		// Get user settings
		const settings = await this.userService.getUserSettings(userId);

		// Send typing indicator
		await ctx.sendChatAction('typing');

		// Send message to Chat API
		const response = await this.chatClient.sendMessage(
			accessToken,
			text,
			settings?.currentConversationId || undefined,
			settings?.currentModel || undefined
		);

		if (!response) {
			await ctx.reply('❌ Fehler bei der AI-Antwort. Versuche es erneut.');
			return;
		}

		// Update current conversation if new
		if (response.conversationId && response.conversationId !== settings?.currentConversationId) {
			await this.userService.updateUserSettings(userId, {
				currentConversationId: response.conversationId,
			});
		}

		// Split long messages (Telegram limit: 4096 chars)
		const maxLength = 4000;
		const message = response.message;

		if (message.length <= maxLength) {
			await ctx.replyWithHTML(message);
		} else {
			// Split into chunks
			const chunks: string[] = [];
			let remaining = message;

			while (remaining.length > 0) {
				if (remaining.length <= maxLength) {
					chunks.push(remaining);
					break;
				}

				// Find a good split point
				let splitAt = remaining.lastIndexOf('\n\n', maxLength);
				if (splitAt === -1 || splitAt < maxLength / 2) {
					splitAt = remaining.lastIndexOf('\n', maxLength);
				}
				if (splitAt === -1 || splitAt < maxLength / 2) {
					splitAt = remaining.lastIndexOf(' ', maxLength);
				}
				if (splitAt === -1) {
					splitAt = maxLength;
				}

				chunks.push(remaining.substring(0, splitAt));
				remaining = remaining.substring(splitAt).trim();
			}

			for (const chunk of chunks) {
				await ctx.reply(chunk, { parse_mode: 'HTML' });
			}
		}
	}
}
