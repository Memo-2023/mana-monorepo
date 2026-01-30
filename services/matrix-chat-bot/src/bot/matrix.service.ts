import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichReply,
} from 'matrix-bot-sdk';
import { ChatService, Model, Conversation, Message } from '../chat/chat.service';
import { SessionService } from '../session/session.service';
import { HELP_MESSAGE, BRANCH_ICONS } from '../config/configuration';

@Injectable()
export class MatrixService implements OnModuleInit {
	private readonly logger = new Logger(MatrixService.name);
	private client: MatrixClient;
	private allowedRooms: string[];

	constructor(
		private configService: ConfigService,
		private chatService: ChatService,
		private sessionService: SessionService
	) {}

	async onModuleInit() {
		const homeserverUrl = this.configService.get<string>('matrix.homeserverUrl');
		const accessToken = this.configService.get<string>('matrix.accessToken');
		const storagePath = this.configService.get<string>('matrix.storagePath');
		this.allowedRooms = this.configService.get<string[]>('matrix.allowedRooms') || [];

		if (!accessToken) {
			this.logger.warn('No Matrix access token configured, bot disabled');
			return;
		}

		const storage = new SimpleFsStorageProvider(storagePath);
		this.client = new MatrixClient(homeserverUrl, accessToken, storage);
		AutojoinRoomsMixin.setupOnClient(this.client);

		this.client.on('room.message', this.handleMessage.bind(this));

		await this.client.start();
		this.logger.log('Matrix Chat Bot started');
	}

	private async handleMessage(roomId: string, event: any) {
		if (event.sender === (await this.client.getUserId())) return;
		if (event.content?.msgtype !== 'm.text') return;

		const body = event.content.body?.trim();
		if (!body?.startsWith('!')) return;

		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			return;
		}

		const sender = event.sender;
		const [command, ...args] = body.slice(1).split(/\s+/);
		const argString = args.join(' ');

		try {
			let response: string;

			switch (command.toLowerCase()) {
				case 'help':
				case 'hilfe':
					response = HELP_MESSAGE;
					break;

				case 'login':
					response = await this.handleLogin(sender, args);
					break;

				case 'logout':
					response = this.handleLogout(sender);
					break;

				case 'status':
					response = this.handleStatus(sender);
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
		} catch (error) {
			this.logger.error(`Error handling command ${command}:`, error);
			await this.sendReply(roomId, event, 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
		}
	}

	private async sendReply(roomId: string, event: any, message: string) {
		const reply = RichReply.createFor(roomId, event, message, message);
		reply.msgtype = 'm.text';
		await this.client.sendMessage(roomId, reply);
	}

	// Auth handlers
	private async handleLogin(sender: string, args: string[]): Promise<string> {
		if (args.length < 2) {
			return 'Verwendung: `!login email passwort`';
		}

		const [email, password] = args;
		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			return `Erfolgreich angemeldet als **${email}**`;
		}
		return `Anmeldung fehlgeschlagen: ${result.error}`;
	}

	private handleLogout(sender: string): string {
		this.sessionService.logout(sender);
		return 'Erfolgreich abgemeldet.';
	}

	private handleStatus(sender: string): string {
		const isLoggedIn = this.sessionService.isLoggedIn(sender);
		const currentConv = this.sessionService.getCurrentConversation(sender);
		const selectedModel = this.sessionService.getSelectedModel(sender);

		let status = `**Bot Status**\n`;
		status += `- Angemeldet: ${isLoggedIn ? 'Ja' : 'Nein'}\n`;
		if (currentConv) {
			status += `- Aktuelles Gespraech: ${currentConv.substring(0, 8)}...\n`;
		}
		if (selectedModel) {
			status += `- Gewaehltes Modell: ${selectedModel.substring(0, 8)}...\n`;
		}
		status += `- Aktive Sessions: ${this.sessionService.getSessionCount()}`;
		return status;
	}

	// Quick chat (stateless)
	private async handleQuickChat(sender: string, message: string): Promise<string> {
		if (!message) {
			return 'Verwendung: `!chat [deine nachricht]`';
		}

		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		// Get models to find default
		const modelsResult = await this.chatService.getModels();
		if (modelsResult.error || !modelsResult.data?.length) {
			return 'Keine AI-Modelle verfuegbar.';
		}

		const selectedModelId = this.sessionService.getSelectedModel(sender);
		const modelId = selectedModelId || modelsResult.data.find((m) => m.isDefault)?.id || modelsResult.data[0].id;

		const result = await this.chatService.createCompletion(
			token,
			[{ role: 'user', content: message }],
			modelId
		);

		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		let response = result.data.content;
		if (result.data.usage) {
			response += `\n\n_Tokens: ${result.data.usage.total_tokens}_`;
		}
		return response;
	}

	// Conversation management
	private async handleNewConversation(sender: string, title: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		// Get models to find default
		const modelsResult = await this.chatService.getModels();
		if (modelsResult.error || !modelsResult.data?.length) {
			return 'Keine AI-Modelle verfuegbar.';
		}

		const selectedModelId = this.sessionService.getSelectedModel(sender);
		const modelId = selectedModelId || modelsResult.data.find((m) => m.isDefault)?.id || modelsResult.data[0].id;

		const convTitle = title || `Matrix Chat ${new Date().toLocaleDateString('de-DE')}`;
		const result = await this.chatService.createConversation(token, {
			title: convTitle,
			modelId,
			conversationMode: 'free',
		});

		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		this.sessionService.setCurrentConversation(sender, result.data.id);
		return `Neues Gespraech erstellt: **${result.data.title}**\nNutze \`!senden [nachricht]\` um zu chatten.`;
	}

	private async handleListConversations(sender: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
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
		this.sessionService.setConversationMapping(
			sender,
			sorted.map((c) => c.id)
		);

		const currentId = this.sessionService.getCurrentConversation(sender);

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
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		if (!numberStr) {
			// Show current conversation
			const currentId = this.sessionService.getCurrentConversation(sender);
			if (!currentId) {
				return 'Kein Gespraech ausgewaehlt. Nutze `!gespraeche` und dann `!gespraech [nr]`';
			}

			const result = await this.chatService.getConversation(token, currentId);
			if (result.error) {
				return `Fehler: ${result.error}`;
			}

			return this.formatConversationDetails(result.data);
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = this.sessionService.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.getConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		this.sessionService.setCurrentConversation(sender, conversationId);
		return `Gespraech ausgewaehlt: **${result.data.title}**\n\n${this.formatConversationDetails(result.data)}`;
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

		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		const conversationId = this.sessionService.getCurrentConversation(sender);
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
		const completionResult = await this.chatService.createCompletion(token, messages, convResult.data.modelId);
		if (completionResult.error) {
			return `Fehler bei AI-Antwort: ${completionResult.error}`;
		}

		// Save assistant response
		await this.chatService.addMessage(token, conversationId, completionResult.data.content, 'assistant');

		let response = completionResult.data.content;
		if (completionResult.data.usage) {
			response += `\n\n_Tokens: ${completionResult.data.usage.total_tokens}_`;
		}
		return response;
	}

	private async handleShowHistory(sender: string, numberStr?: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		let conversationId = this.sessionService.getCurrentConversation(sender);

		if (numberStr) {
			const number = parseInt(numberStr, 10);
			if (!isNaN(number)) {
				const id = this.sessionService.getConversationId(sender, number);
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
			const text = msg.messageText.length > 200 ? msg.messageText.substring(0, 200) + '...' : msg.messageText;
			response += `${icon} **${msg.sender}:**\n${text}\n\n`;
		});

		if (result.data.length > 10) {
			response += `_...und ${result.data.length - 10} weitere Nachrichten_`;
		}

		return response;
	}

	// Conversation management actions
	private async handleUpdateTitle(sender: string, numberStr: string, title: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		if (!numberStr || !title) {
			return 'Verwendung: `!titel [nr] [neuer titel]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = this.sessionService.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.updateTitle(token, conversationId, title);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Titel geaendert zu: **${result.data.title}**`;
	}

	private async handleArchive(sender: string, numberStr: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		if (!numberStr) {
			return 'Verwendung: `!archiv [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = this.sessionService.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.archiveConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Gespraech **${result.data.title}** archiviert.`;
	}

	private async handleListArchived(sender: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		const result = await this.chatService.getArchivedConversations(token);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		if (!result.data?.length) {
			return 'Keine archivierten Gespraeche.';
		}

		// Store mapping for restore
		this.sessionService.setConversationMapping(
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
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		if (!numberStr) {
			return 'Verwendung: `!wiederherstellen [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = this.sessionService.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!archiviert` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.unarchiveConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Gespraech **${result.data.title}** wiederhergestellt.`;
	}

	private async handlePin(sender: string, numberStr: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		if (!numberStr) {
			return 'Verwendung: `!pin [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = this.sessionService.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.pinConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Gespraech **${result.data.title}** angepinnt. 📌`;
	}

	private async handleUnpin(sender: string, numberStr: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		if (!numberStr) {
			return 'Verwendung: `!unpin [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = this.sessionService.getConversationId(sender, number);
		if (!conversationId) {
			return 'Ungueltige Nummer. Nutze `!gespraeche` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.unpinConversation(token, conversationId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		return `Pin fuer **${result.data.title}** entfernt.`;
	}

	private async handleDelete(sender: string, numberStr: string): Promise<string> {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			return 'Bitte zuerst anmelden mit `!login email passwort`';
		}

		if (!numberStr) {
			return 'Verwendung: `!loeschen [nr]`';
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const conversationId = this.sessionService.getConversationId(sender, number);
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
		if (this.sessionService.getCurrentConversation(sender) === conversationId) {
			this.sessionService.setCurrentConversation(sender, null);
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
		this.sessionService.setModelMapping(
			sender,
			activeModels.map((m) => m.id)
		);

		const selectedModelId = this.sessionService.getSelectedModel(sender);

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
			const selectedModelId = this.sessionService.getSelectedModel(sender);
			if (!selectedModelId) {
				return 'Kein Modell ausgewaehlt (Standard wird verwendet). Nutze `!modelle` und `!modell [nr]`';
			}

			const result = await this.chatService.getModel(selectedModelId);
			if (result.error) {
				return 'Ausgewaehltes Modell nicht gefunden.';
			}

			const icon = BRANCH_ICONS[result.data.provider] || BRANCH_ICONS.default;
			return `Aktuelles Modell: ${icon} **${result.data.name}**`;
		}

		const number = parseInt(numberStr, 10);
		if (isNaN(number)) {
			return 'Bitte eine gueltige Nummer angeben.';
		}

		const modelId = this.sessionService.getModelId(sender, number);
		if (!modelId) {
			return 'Ungueltige Nummer. Nutze `!modelle` fuer eine aktuelle Liste.';
		}

		const result = await this.chatService.getModel(modelId);
		if (result.error) {
			return `Fehler: ${result.error}`;
		}

		this.sessionService.setSelectedModel(sender, modelId);
		const icon = BRANCH_ICONS[result.data.provider] || BRANCH_ICONS.default;
		return `Modell gewaehlt: ${icon} **${result.data.name}**\nWird fuer neue Gespraeche und Quick-Chat verwendet.`;
	}
}
