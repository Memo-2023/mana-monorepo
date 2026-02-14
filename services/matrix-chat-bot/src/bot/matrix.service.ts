import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { ChatService, Conversation } from '../chat/chat.service';
import {
	SessionService,
	TranscriptionService,
	CreditService,
	CreditErrorCode,
	LOGIN_MESSAGES,
} from '@manacore/bot-services';
import { HELP_MESSAGE, BRANCH_ICONS } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['gespraeche', 'conversations', 'liste', 'chats'], command: 'gespraeche' },
		{ keywords: ['modelle', 'models', 'ki modelle', 'ai models'], command: 'modelle' },
		{ keywords: ['neu', 'new', 'neues gespraech', 'new conversation'], command: 'neu' },
		{ keywords: ['verlauf', 'history', 'nachrichten', 'messages'], command: 'verlauf' },
		{ keywords: ['archiviert', 'archived', 'archiv liste'], command: 'archiviert' },
		{ keywords: ['chat', 'fragen', 'ask', 'frage'], command: 'chat' },
	]);

	constructor(
		configService: ConfigService,
		private readonly transcriptionService: TranscriptionService,
		private chatService: ChatService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {
		super(configService);
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		try {
			const mxcUrl = event.content.url;
			if (!mxcUrl) return;

			const audioBuffer = await this.downloadMedia(mxcUrl);
			const text = await this.transcriptionService.transcribe(audioBuffer);
			if (!text) {
				await this.sendReply(roomId, event, '❌ Sprachnachricht konnte nicht erkannt werden.');
				return;
			}

			await this.sendMessage(roomId, `🎤 *"${text}"*`);
			await this.handleTextMessage(roomId, event, text, sender);
		} catch (error) {
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendReply(roomId, event, '❌ Fehler bei der Spracherkennung.');
		}
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

	// Session data helper methods (wrapping the generic setSessionData/getSessionData)
	private async getCurrentConversation(sender: string): Promise<string | null> {
		return this.sessionService.getSessionData<string>(sender, 'currentConversationId');
	}

	private async setCurrentConversation(
		sender: string,
		conversationId: string | null
	): Promise<void> {
		await this.sessionService.setSessionData(sender, 'currentConversationId', conversationId);
	}

	private async getSelectedModel(sender: string): Promise<string | null> {
		return this.sessionService.getSessionData<string>(sender, 'selectedModelId');
	}

	private async setSelectedModel(sender: string, modelId: string): Promise<void> {
		await this.sessionService.setSessionData(sender, 'selectedModelId', modelId);
	}

	private async setConversationMapping(sender: string, ids: string[]): Promise<void> {
		await this.sessionService.setSessionData(sender, 'conversationMapping', ids);
	}

	private async getConversationId(sender: string, number: number): Promise<string | null> {
		const ids = await this.sessionService.getSessionData<string[]>(sender, 'conversationMapping');
		if (!ids || number < 1 || number > ids.length) return null;
		return ids[number - 1];
	}

	private async setModelMapping(sender: string, ids: string[]): Promise<void> {
		await this.sessionService.setSessionData(sender, 'modelMapping', ids);
	}

	private async getModelId(sender: string, number: number): Promise<string | null> {
		const ids = await this.sessionService.getSessionData<string[]>(sender, 'modelMapping');
		if (!ids || number < 1 || number > ids.length) return null;
		return ids[number - 1];
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Check for keyword commands first
		const keywordCommand = this.keywordDetector.detect(message);
		if (keywordCommand) {
			message = `!${keywordCommand}`;
		}

		if (!message.startsWith('!')) return;

		const [command, ...args] = message.slice(1).split(/\s+/);
		const argString = args.join(' ');

		let response: string;

		switch (command.toLowerCase()) {
			case 'help':
			case 'hilfe':
				response = HELP_MESSAGE;
				break;

			case 'status':
				response = await this.handleStatus(sender);
				break;

			case 'chat':
			case 'fragen':
			case 'ask':
				response = await this.handleQuickChat(sender, argString);
				break;

			case 'neu':
			case 'new':
				response = await this.handleNewConversation(sender, argString);
				break;

			case 'gespraeche':
			case 'gespräche':
			case 'conversations':
			case 'liste':
				response = await this.handleListConversations(sender);
				break;

			case 'gespraech':
			case 'gespräch':
			case 'conversation':
			case 'select':
				response = await this.handleSelectConversation(sender, args[0]);
				break;

			case 'senden':
			case 'send':
			case 's':
				response = await this.handleSendMessage(sender, argString);
				break;

			case 'verlauf':
			case 'history':
			case 'nachrichten':
				response = await this.handleShowHistory(sender, args[0]);
				break;

			case 'titel':
			case 'title':
				response = await this.handleUpdateTitle(sender, args[0], args.slice(1).join(' '));
				break;

			case 'archiv':
			case 'archive':
				response = await this.handleArchive(sender, args[0]);
				break;

			case 'archiviert':
			case 'archived':
				response = await this.handleListArchived(sender);
				break;

			case 'wiederherstellen':
			case 'restore':
			case 'unarchive':
				response = await this.handleUnarchive(sender, args[0]);
				break;

			case 'pin':
				response = await this.handlePin(sender, args[0]);
				break;

			case 'unpin':
				response = await this.handleUnpin(sender, args[0]);
				break;

			case 'loeschen':
			case 'löschen':
			case 'delete':
				response = await this.handleDelete(sender, args[0]);
				break;

			case 'modelle':
			case 'models':
				response = await this.handleListModels(sender);
				break;

			case 'modell':
			case 'model':
				response = await this.handleSelectModel(sender, args[0]);
				break;

			default:
				response = `Unbekannter Befehl: ${command}\nNutze \`!help\` fuer eine Uebersicht.`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleStatus(sender: string): Promise<string> {
		const isLoggedIn = await this.sessionService.isLoggedIn(sender);
		const email = await this.sessionService.getEmail(sender);
		const token = await this.sessionService.getToken(sender);
		const currentConv = await this.getCurrentConversation(sender);
		const selectedModel = await this.getSelectedModel(sender);

		// Get credit balance if logged in
		let creditBalance = { balance: 0, hasCredits: false };
		if (token) {
			creditBalance = await this.creditService.getBalance(token);
		}

		const additionalInfo: Record<string, string> = {};
		if (currentConv) {
			additionalInfo['🗨️ Gespraech'] = `${currentConv.substring(0, 8)}...`;
		}
		if (selectedModel) {
			additionalInfo['🧠 Modell'] = `${selectedModel.substring(0, 8)}...`;
		}

		if (!isLoggedIn) {
			return `🤖 **Bot Status**\n\n❌ Nicht angemeldet.\n\n${LOGIN_MESSAGES.chat}`;
		}

		const statusMessage = this.creditService.formatStatusMessage(
			email || 'Unbekannt',
			creditBalance,
			additionalInfo
		);

		return statusMessage.text;
	}

	// Quick chat (stateless)
	private async handleQuickChat(sender: string, message: string): Promise<string> {
		if (!message) {
			return 'Verwendung: `!chat [deine nachricht]`';
		}

		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		// Get models to find default
		const modelsResult = await this.chatService.getModels();
		if (modelsResult.error || !modelsResult.data?.length) {
			return 'Keine AI-Modelle verfuegbar.';
		}

		const selectedModelId = await this.getSelectedModel(sender);
		const modelId =
			selectedModelId || modelsResult.data.find((m) => m.isDefault)?.id || modelsResult.data[0].id;

		const result = await this.chatService.createCompletion(
			token,
			[{ role: 'user', content: message }],
			modelId
		);

		if (result.error) {
			// Handle 402 Payment Required (insufficient credits)
			if (result.statusCode === 402) {
				const balance = await this.creditService.getBalance(token);
				const errorMsg = this.creditService.formatInsufficientCreditsError(
					2, // AI Chat costs ~2 credits
					balance.balance,
					'AI Chat'
				);
				return errorMsg.text;
			}
			return `Fehler: ${result.error}`;
		}

		let response = result.data!.content;
		if (result.data!.usage) {
			response += `\n\n_Tokens: ${result.data!.usage.total_tokens}_`;
		}
		return response;
	}

	// Conversation management
	private async handleNewConversation(sender: string, title: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		// Get models to find default
		const modelsResult = await this.chatService.getModels();
		if (modelsResult.error || !modelsResult.data?.length) {
			return 'Keine AI-Modelle verfuegbar.';
		}

		const selectedModelId = await this.getSelectedModel(sender);
		const modelId =
			selectedModelId || modelsResult.data.find((m) => m.isDefault)?.id || modelsResult.data[0].id;

		const convTitle = title || `Matrix Chat ${new Date().toLocaleDateString('de-DE')}`;
		const result = await this.chatService.createConversation(token, {
			title: convTitle,
			modelId,
			conversationMode: 'free',
		});

		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		await this.setCurrentConversation(sender, result.data!.id);
		return `Neues Gespraech erstellt: **${result.data!.title}**\nNutze \`!senden [nachricht]\` um zu chatten.`;
	}

	private async handleListConversations(sender: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		const result = await this.chatService.getConversations(token);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		if (!result.data?.length) {
			return 'Keine Gespraeche vorhanden. Erstelle eines mit `!neu [titel]`';
		}

		// Sort: pinned first, then by date
		const sorted = result.data.sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		});

		// Store mapping
		await this.setConversationMapping(
			sender,
			sorted.map((c) => c.id)
		);

		const currentId = await this.getCurrentConversation(sender);

		let response = '**Deine Gespraeche:**\n\n';
		sorted.forEach((conv, index) => {
			const pin = conv.isPinned ? '📌 ' : '';
			const current = conv.id === currentId ? ' ◀️' : '';
			const date = new Date(conv.updatedAt).toLocaleDateString('de-DE');
			response += `${index + 1}. ${pin}**${conv.title}**${current}\n   _${date}_\n`;
		});

		response += '\nNutze `!gespraech [nr]` zum Auswaehlen.';
		return response;
	}

	private async handleSelectConversation(sender: string, numberStr: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		if (!numberStr) {
			// Show current conversation
			const currentId = await this.getCurrentConversation(sender);
			if (!currentId) {
				return 'Kein Gespraech ausgewaehlt. Nutze `!gespraeche` und dann `!gespraech [nr]`';
			}

			const result = await this.chatService.getConversation(token, currentId);
			if (result.error) {
				return `Fehler: ${result.error}`;
			}

			return this.formatConversationDetails(result.data!);
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = await this.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.getConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		await this.setCurrentConversation(sender, conversationId);
		return `Gespraech ausgewaehlt: **${result.data!.title}**\n\n${this.formatConversationDetails(result.data!)}`;
	}

	private formatConversationDetails(conv: Conversation): string {
		const pin = conv.isPinned ? '📌 Angepinnt' : '';
		const created = new Date(conv.createdAt).toLocaleDateString('de-DE');
		const updated = new Date(conv.updatedAt).toLocaleDateString('de-DE');

		return `**${conv.title}** ${pin}
- Modus: ${conv.conversationMode}
- Dokument-Modus: ${conv.documentMode ? 'Ja' : 'Nein'}
- Erstellt: ${created}
- Aktualisiert: ${updated}

Nutze \`!senden [nachricht]\` um zu chatten oder \`!verlauf\` fuer den Nachrichtenverlauf.`;
	}

	private async handleSendMessage(sender: string, message: string): Promise<string> {
		if (!message) {
			return 'Verwendung: `!senden [deine nachricht]`';
		}

		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		const conversationId = await this.getCurrentConversation(sender);
		if (!conversationId) {
			return 'Kein Gespraech ausgewaehlt. Nutze `!gespraeche` und `!gespraech [nr]` oder `!neu [titel]`';
		}

		// Add user message
		const userMsgResult = await this.chatService.addMessage(token, conversationId, message, 'user');
		if (userMsgResult.error) {
			return `Fehler: ${userMsgResult.error}`;
		}

		// Get conversation for model ID
		const convResult = await this.chatService.getConversation(token, conversationId);
		if (convResult.error) {
			return `Fehler: ${convResult.error}`;
		}

		// Get message history for context
		const historyResult = await this.chatService.getMessages(token, conversationId);
		const messages = (historyResult.data || []).map((m) => ({
			role: m.sender as 'user' | 'assistant' | 'system',
			content: m.messageText,
		}));

		// Get AI response
		const completionResult = await this.chatService.createCompletion(
			token,
			messages,
			convResult.data!.modelId
		);
		if (completionResult.error) {
			// Handle 402 Payment Required (insufficient credits)
			if (completionResult.statusCode === 402) {
				const balance = await this.creditService.getBalance(token);
				const errorMsg = this.creditService.formatInsufficientCreditsError(
					2, // AI Chat costs ~2 credits
					balance.balance,
					'AI Chat'
				);
				return errorMsg.text;
			}
			return `Fehler bei AI-Antwort: ${completionResult.error}`;
		}

		// Save assistant response
		await this.chatService.addMessage(
			token,
			conversationId,
			completionResult.data!.content,
			'assistant'
		);

		let response = completionResult.data!.content;
		if (completionResult.data!.usage) {
			response += `\n\n_Tokens: ${completionResult.data!.usage.total_tokens}_`;
		}
		return response;
	}

	private async handleShowHistory(sender: string, numberStr?: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		let conversationId = await this.getCurrentConversation(sender);

		if (numberStr) {
			const number = parseInt(numberStr, 10);
			if (!isNaN(number)) {
				const id = await this.getConversationId(sender, number);
				if (id) conversationId = id;
			}
		}

		if (!conversationId) {
			return 'Kein Gespraech ausgewaehlt. Nutze `!gespraeche` und `!gespraech [nr]`';
		}

		const result = await this.chatService.getMessages(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		if (!result.data?.length) {
			return 'Noch keine Nachrichten in diesem Gespraech.';
		}

		let response = '**Nachrichtenverlauf:**\n\n';
		const recentMessages = result.data.slice(-10); // Last 10 messages

		recentMessages.forEach((msg) => {
			const icon = msg.sender === 'user' ? '👤' : msg.sender === 'assistant' ? '🤖' : '⚙️';
			const text =
				msg.messageText.length > 200 ? msg.messageText.substring(0, 200) + '...' : msg.messageText;
			response += `${icon} **${msg.sender}:**\n${text}\n\n`;
		});

		if (result.data.length > 10) {
			response += `_...und ${result.data.length - 10} weitere Nachrichten_`;
		}

		return response;
	}

	// Conversation management actions
	private async handleUpdateTitle(
		sender: string,
		numberStr: string,
		title: string
	): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		if (!numberStr || !title) {
			return 'Verwendung: `!titel [nr] [neuer titel]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = await this.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.updateTitle(token, conversationId, title);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Titel geaendert zu: **${result.data!.title}**`;
	}

	private async handleArchive(sender: string, numberStr: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		if (!numberStr) {
			return 'Verwendung: `!archiv [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = await this.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.archiveConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Gespraech **${result.data!.title}** archiviert.`;
	}

	private async handleListArchived(sender: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		const result = await this.chatService.getArchivedConversations(token);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		if (!result.data?.length) {
			return 'Keine archivierten Gespraeche.';
		}

		// Store mapping for restore
		await this.setConversationMapping(
			sender,
			result.data.map((c) => c.id)
		);

		let response = '**Archivierte Gespraeche:**\n\n';
		result.data.forEach((conv, index) => {
			const date = new Date(conv.updatedAt).toLocaleDateString('de-DE');
			response += `${index + 1}. **${conv.title}**\n   _${date}_\n`;
		});

		response += '\nNutze `!wiederherstellen [nr]` zum Wiederherstellen.';
		return response;
	}

	private async handleUnarchive(sender: string, numberStr: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		if (!numberStr) {
			return 'Verwendung: `!wiederherstellen [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = await this.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!archiviert` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.unarchiveConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Gespraech **${result.data!.title}** wiederhergestellt.`;
	}

	private async handlePin(sender: string, numberStr: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		if (!numberStr) {
			return 'Verwendung: `!pin [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = await this.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.pinConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Gespraech **${result.data!.title}** angepinnt. 📌`;
	}

	private async handleUnpin(sender: string, numberStr: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		if (!numberStr) {
			return 'Verwendung: `!unpin [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = await this.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.unpinConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Pin fuer **${result.data!.title}** entfernt.`;
	}

	private async handleDelete(sender: string, numberStr: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			return LOGIN_MESSAGES.chat;
		}

		if (!numberStr) {
			return 'Verwendung: `!loeschen [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = await this.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		// Get title before deletion
		const convResult = await this.chatService.getConversation(token, conversationId);
		const title = convResult.data?.title || 'Gespraech';

		const result = await this.chatService.deleteConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		// Clear current conversation if it was the deleted one
		if ((await this.getCurrentConversation(sender)) === conversationId) {
			await this.setCurrentConversation(sender, null);
		}

		return `Gespraech **${title}** geloescht.`;
	}

	// Model management
	private async handleListModels(sender: string): Promise<string> {
		const result = await this.chatService.getModels();
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		if (!result.data?.length) {
			return 'Keine AI-Modelle verfuegbar.';
		}

		const activeModels = result.data.filter((m) => m.isActive);

		// Store mapping
		await this.setModelMapping(
			sender,
			activeModels.map((m) => m.id)
		);

		const selectedModelId = await this.getSelectedModel(sender);

		let response = '**Verfuegbare AI-Modelle:**\n\n';
		activeModels.forEach((model, index) => {
			const icon = BRANCH_ICONS[model.provider] || BRANCH_ICONS.default;
			const isDefault = model.isDefault ? ' (Standard)' : '';
			const selected = model.id === selectedModelId ? ' ◀️' : '';
			const desc = model.description ? `\n   _${model.description}_` : '';
			response += `${index + 1}. ${icon} **${model.name}**${isDefault}${selected}${desc}\n`;
		});

		response += '\nNutze `!modell [nr]` zum Auswaehlen.';
		return response;
	}

	private async handleSelectModel(sender: string, numberStr: string): Promise<string> {
		if (!numberStr) {
			const selectedModelId = await this.getSelectedModel(sender);
			if (!selectedModelId) {
				return 'Kein Modell ausgewaehlt (Standard wird verwendet). Nutze `!modelle` und `!modell [nr]`';
			}

			const result = await this.chatService.getModel(selectedModelId);
			if (result.error) {
				return 'Ausgewaehltes Modell nicht gefunden.';
			}

			const icon = BRANCH_ICONS[result.data!.provider] || BRANCH_ICONS.default;
			return `Aktuelles Modell: ${icon} **${result.data!.name}**`;
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const modelId = await this.getModelId(sender, number);
		if (!modelId) {
			return 'Ungueltige Nummer. Nutze `!modelle` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.getModel(modelId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		await this.setSelectedModel(sender, modelId);
		const icon = BRANCH_ICONS[result.data!.provider] || BRANCH_ICONS.default;
		return `Modell gewaehlt: ${icon} **${result.data!.name}**\nWird fuer neue Gespraeche und Quick-Chat verwendet.`;
	}
}
