/**
 * Conversation Service - CRUD operations via Backend API
 */
import {
	conversationApi,
	chatApi,
	modelApi,
	templateApi,
	usageApi,
	type Conversation as ApiConversation,
	type Message as ApiMessage,
	type ChatMessage,
	type TokenUsage,
} from './api';

// Re-export types with backwards-compatible naming (snake_case for mobile)
export type Conversation = {
	id: string;
	user_id: string;
	model_id: string;
	template_id?: string;
	space_id?: string;
	conversation_mode: 'free' | 'guided' | 'template';
	document_mode: boolean;
	title?: string;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
};

export type Message = {
	id: string;
	conversation_id: string;
	sender: 'user' | 'assistant' | 'system';
	message_text: string;
	created_at: string;
	updated_at: string;
};

export type TokenUsageType = {
	id: string;
	conversation_id: string;
	message_id: string;
	user_id: string;
	model_id: string;
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
	estimated_cost: number;
	created_at: string;
};

// Helper to convert API response to local format
function toLocalConversation(conv: ApiConversation): Conversation {
	return {
		id: conv.id,
		user_id: conv.userId,
		model_id: conv.modelId,
		template_id: conv.templateId,
		space_id: conv.spaceId,
		conversation_mode: conv.conversationMode,
		document_mode: conv.documentMode,
		title: conv.title,
		is_archived: conv.isArchived,
		created_at: conv.createdAt,
		updated_at: conv.updatedAt,
	};
}

function toLocalMessage(msg: ApiMessage): Message {
	return {
		id: msg.id,
		conversation_id: msg.conversationId,
		sender: msg.sender,
		message_text: msg.messageText,
		created_at: msg.createdAt,
		updated_at: msg.updatedAt,
	};
}

/**
 * Erstellt eine neue Konversation in der Datenbank
 */
export async function createConversation(
	userId: string,
	modelId: string,
	mode: 'free' | 'guided' | 'template' = 'free',
	templateId?: string,
	documentMode: boolean = false,
	spaceId?: string
): Promise<string | null> {
	try {
		console.log('🔵 Erstelle Konversation mit Space ID:', spaceId || 'keine');

		const conversation = await conversationApi.createConversation({
			modelId,
			conversationMode: mode,
			templateId,
			documentMode,
			spaceId,
		});

		if (!conversation) {
			console.error('Fehler beim Erstellen der Konversation');
			return null;
		}

		return conversation.id;
	} catch (error) {
		console.error('Fehler beim Erstellen der Konversation:', error);
		return null;
	}
}

/**
 * Fügt eine neue Nachricht zur Konversation hinzu
 */
export async function addMessage(
	conversationId: string,
	sender: 'user' | 'assistant' | 'system',
	messageText: string
): Promise<string | null> {
	try {
		// Validate sender
		let validSender = sender;
		if (!['user', 'assistant', 'system'].includes(validSender)) {
			console.error('Ungültiger Sender-Wert:', sender);
			validSender = 'user';
		}

		console.log('Füge Nachricht hinzu mit Sender:', validSender);

		const message = await conversationApi.addMessage(conversationId, validSender, messageText);

		if (!message) {
			console.error('Fehler beim Hinzufügen der Nachricht');
			return null;
		}

		return message.id;
	} catch (error) {
		console.error('Fehler beim Hinzufügen der Nachricht:', error);
		return null;
	}
}

/**
 * Lädt alle Nachrichten einer Konversation
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
	try {
		const messages = await conversationApi.getMessages(conversationId);
		return messages.map(toLocalMessage);
	} catch (error) {
		console.error('Fehler beim Laden der Nachrichten:', error);
		return [];
	}
}

/**
 * Generiert einen Titel für die Konversation basierend auf der ersten Benutzeranfrage
 */
export async function generateConversationTitle(userQuestion: string): Promise<string> {
	try {
		console.log(
			'Generiere Titel für Konversation basierend auf:',
			userQuestion.substring(0, 50) + (userQuestion.length > 50 ? '...' : '')
		);

		const titlePrompt = `Schreibe eine kurze, prägnante Überschrift (maximal 5 Wörter) für unseren Chat mit dieser Frage: "${userQuestion}"`;

		const response = await chatApi.createCompletion({
			messages: [{ role: 'user', content: titlePrompt }],
			modelId: '550e8400-e29b-41d4-a716-446655440004', // GPT-4o-Mini
			temperature: 0.3,
			maxTokens: 50,
		});

		if (!response) {
			return 'Neue Konversation';
		}

		// Clean up title
		let cleanTitle = response.content
			.trim()
			.replace(/^["']|["']$/g, '')
			.replace(/\.$/g, '');

		if (cleanTitle.length > 100) {
			cleanTitle = cleanTitle.substring(0, 97) + '...';
		}

		console.log('Generierter Titel:', cleanTitle);
		return cleanTitle;
	} catch (error) {
		console.error('Fehler bei der Titelgenerierung:', error);
		return 'Neue Konversation';
	}
}

/**
 * Aktualisiert den Titel einer Konversation
 */
export async function updateConversationTitle(
	conversationId: string,
	title: string
): Promise<boolean> {
	try {
		const success = await conversationApi.updateTitle(conversationId, title);

		if (!success) {
			console.error('Fehler beim Aktualisieren des Konversationstitels');
			return false;
		}

		return true;
	} catch (error) {
		console.error('Fehler beim Aktualisieren des Konversationstitels:', error);
		return false;
	}
}

/**
 * Lädt einen System-Prompt aus einer Vorlage
 */
export async function getSystemPromptFromTemplate(templateId: string): Promise<string | null> {
	try {
		const template = await templateApi.getTemplate(templateId);

		if (!template) {
			console.error('Fehler beim Laden der Vorlage');
			return null;
		}

		return template.systemPrompt;
	} catch (error) {
		console.error('Fehler beim Laden der Vorlage:', error);
		return null;
	}
}

/**
 * Sendet eine Benutzeranfrage an das LLM-Modell und speichert die Antwort
 */
export async function sendMessageAndGetResponse(
	conversationId: string,
	userMessage: string,
	modelId: string,
	templateId?: string,
	documentMode: boolean = false
): Promise<{
	userMessageId: string | null;
	assistantMessageId: string | null;
	assistantResponse: string;
	title?: string;
	documentContent?: string;
}> {
	try {
		console.log('Starte sendMessageAndGetResponse mit:', {
			conversationId,
			userMessage: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
			modelId,
		});

		// Load the model from API
		const modelData = await modelApi.getModel(modelId);

		if (!modelData) {
			console.log('Verwende Standard-Parameter, da Modell nicht geladen werden konnte');
		} else {
			console.log('Modell geladen:', {
				id: modelData.id,
				name: modelData.name,
				parameters: modelData.parameters,
				deployment: modelData.parameters?.deployment,
			});
		}

		// Save the user message
		const userMessageId = await addMessage(conversationId, 'user', userMessage);
		console.log('Benutzernachricht gespeichert mit ID:', userMessageId);

		// Load all messages for context
		const messages = await getMessages(conversationId);
		console.log(`${messages.length} Nachrichten für Kontext geladen`);

		// Build chat messages for API
		const chatMessages: ChatMessage[] = [];

		// Load system prompt from template if available
		let systemPrompt: string | null = null;
		if (templateId) {
			systemPrompt = await getSystemPromptFromTemplate(templateId);
			if (systemPrompt) {
				console.log('System-Prompt aus Vorlage geladen');

				if (documentMode) {
					const documentModePrompt = `
${systemPrompt}

WICHTIG: Du befindest dich im Dokumentmodus. Deine Aufgabe ist es, dem Benutzer zu helfen, ein Dokument zu erstellen und zu verbessern.

1. Das Dokument wird in einem separaten Bereich neben dem Chat angezeigt.
2. Wenn der Benutzer Feedback zu dem Dokument gibt, sollst du eine Überarbeitung des Dokuments vorschlagen.
3. Formatiere deine Vorschläge für das Dokument in gut strukturiertem Markdown-Format.
4. Verwende bei längeren Dokumenten Überschriften, Listen und andere Markdown-Elemente zur besseren Gliederung.
5. Antworte IMMER in diesem Format:

CHAT: Hier antwortest du auf die Frage oder das Feedback des Nutzers.

DOKUMENT:
Hier steht dein Vorschlag für das Dokument in Markdown-Format, ohne Codeblock-Markierungen.
`;
					chatMessages.push({ role: 'system', content: documentModePrompt });
					console.log('Dokumentmodus-Prompt hinzugefügt');
				} else {
					chatMessages.push({ role: 'system', content: systemPrompt });
				}
			}
		} else if (documentMode) {
			const documentModePrompt = `
Du befindest dich im Dokumentmodus. Deine Aufgabe ist es, dem Benutzer zu helfen, ein Dokument zu erstellen und zu verbessern.

1. Das Dokument wird in einem separaten Bereich neben dem Chat angezeigt.
2. Wenn der Benutzer Feedback zu dem Dokument gibt, sollst du eine Überarbeitung des Dokuments vorschlagen.
3. Formatiere deine Vorschläge für das Dokument in gut strukturiertem Markdown-Format.
4. Verwende bei längeren Dokumenten Überschriften, Listen und andere Markdown-Elemente zur besseren Gliederung.
5. Antworte IMMER in diesem Format:

CHAT: Hier antwortest du auf die Frage oder das Feedback des Nutzers.

DOKUMENT:
Hier steht dein Vorschlag für das Dokument in Markdown-Format, ohne Codeblock-Markierungen.
`;
			chatMessages.push({ role: 'system', content: documentModePrompt });
			console.log('Standard-Dokumentmodus-Prompt hinzugefügt');
		}

		// Add all conversation messages
		chatMessages.push(
			...(messages.map((msg) => ({
				role: msg.sender === 'user' ? 'user' : msg.sender === 'assistant' ? 'assistant' : 'system',
				content: msg.message_text,
			})) as ChatMessage[])
		);

		console.log('Nachrichten für OpenAI konvertiert:', chatMessages.length, 'Nachrichten');

		// Send request to AI
		console.log('Sende Anfrage an LLM-Modell mit Parametern:', {
			temperature: modelData?.parameters?.temperature || 0.7,
			maxTokens: modelData?.parameters?.max_tokens || 800,
		});

		const result = await chatApi.createCompletion({
			messages: chatMessages,
			modelId,
			temperature: modelData?.parameters?.temperature || 0.7,
			maxTokens: modelData?.parameters?.max_tokens || 800,
		});

		let assistantResponse: string;
		let tokenUsage: TokenUsage | undefined;

		if (!result) {
			assistantResponse =
				'Es konnte keine Antwort generiert werden. Bitte stelle sicher, dass das Backend läuft.';
		} else {
			assistantResponse = result.content;
			tokenUsage = result.usage;

			console.log('Antwort vom LLM-Modell erhalten:', {
				length: assistantResponse.length,
				preview: assistantResponse.substring(0, 50) + (assistantResponse.length > 50 ? '...' : ''),
				tokenUsage,
			});
		}

		// Extract document content if in document mode
		let documentContent: string | undefined;
		let chatResponse = assistantResponse;

		if (documentMode) {
			console.log(
				'Analysiere LLM-Antwort für Dokumentextraktion:',
				assistantResponse.substring(0, 200) + '...'
			);

			const chatMatch = assistantResponse.match(/CHAT:(.*?)(?=DOKUMENT:|$)/s);
			const documentMatch = assistantResponse.match(
				/DOKUMENT:[\s\n]*(```markdown|```|`markdown)?([^`].*?)(?:```|`+)?$/s
			);

			console.log('Dokument-Regex Match:', documentMatch ? 'Ja' : 'Nein');

			if (chatMatch && chatMatch[1]) {
				chatResponse = chatMatch[1].trim();
				console.log('Chat-Antwort extrahiert:', chatResponse.substring(0, 50) + '...');
			}

			if (documentMatch && documentMatch[2]) {
				documentContent = documentMatch[2].trim();
				console.log(
					'Dokument-Inhalt extrahiert:',
					(documentContent?.substring(0, 50) || '') + '...'
				);
			}
		}

		// Save assistant message
		const assistantMessageId = await addMessage(conversationId, 'assistant', chatResponse);
		console.log('Assistentenantwort gespeichert mit ID:', assistantMessageId);

		// Log token usage if available
		if (tokenUsage && assistantMessageId && userMessageId) {
			try {
				const estimatedCost = calculateTokenCost(
					tokenUsage.prompt_tokens,
					tokenUsage.completion_tokens,
					modelData?.costSettings
				);

				await usageApi.logTokenUsage({
					conversationId,
					messageId: assistantMessageId,
					modelId,
					promptTokens: tokenUsage.prompt_tokens,
					completionTokens: tokenUsage.completion_tokens,
					totalTokens: tokenUsage.total_tokens,
					estimatedCost,
				});
				console.log('Token-Nutzung erfolgreich geloggt');
			} catch (error) {
				console.error('Fehler beim Loggen der Token-Nutzung:', error);
			}
		}

		// Generate title for new conversations
		const allMessages = await getMessages(conversationId);
		let title: string | undefined;

		if (allMessages.length <= 2) {
			title = await generateConversationTitle(userMessage);

			if (title) {
				const success = await updateConversationTitle(conversationId, title);
				console.log('Konversationstitel aktualisiert:', success ? 'erfolgreich' : 'fehlgeschlagen');
			}
		}

		return {
			userMessageId,
			assistantMessageId,
			assistantResponse: chatResponse,
			title,
			documentContent,
		};
	} catch (error) {
		console.error('Fehler beim Senden der Nachricht:', error);

		if (error instanceof Error) {
			console.error('Fehlerdetails:', {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});
		}

		return {
			userMessageId: null,
			assistantMessageId: null,
			assistantResponse: `Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}. Bitte versuche es später erneut.`,
		};
	}
}

// Helper function to calculate token cost
function calculateTokenCost(
	promptTokens: number,
	completionTokens: number,
	costSettings?: { prompt_per_1k_tokens?: number; completion_per_1k_tokens?: number }
): number {
	const promptCost = costSettings?.prompt_per_1k_tokens || 0.0001;
	const completionCost = costSettings?.completion_per_1k_tokens || 0.0002;

	const cost = (promptTokens * promptCost + completionTokens * completionCost) / 1000;
	return Number(cost.toFixed(6));
}

/**
 * Lädt alle aktiven (nicht archivierten) Konversationen eines Benutzers
 */
export async function getConversations(userId: string, spaceId?: string): Promise<Conversation[]> {
	try {
		const conversations = await conversationApi.getConversations(spaceId);
		return conversations.map(toLocalConversation);
	} catch (error) {
		console.error('Fehler beim Laden der Konversationen:', error);
		return [];
	}
}

/**
 * Lädt alle archivierten Konversationen eines Benutzers
 */
export async function getArchivedConversations(userId: string): Promise<Conversation[]> {
	try {
		const conversations = await conversationApi.getArchivedConversations();
		return conversations.map(toLocalConversation);
	} catch (error) {
		console.error('Fehler beim Laden der archivierten Konversationen:', error);
		return [];
	}
}

/**
 * Archiviert eine Konversation
 */
export async function archiveConversation(conversationId: string): Promise<boolean> {
	try {
		return await conversationApi.archiveConversation(conversationId);
	} catch (error) {
		console.error('Fehler beim Archivieren der Konversation:', error);
		return false;
	}
}

/**
 * Stellt eine archivierte Konversation wieder her
 */
export async function unarchiveConversation(conversationId: string): Promise<boolean> {
	try {
		return await conversationApi.unarchiveConversation(conversationId);
	} catch (error) {
		console.error('Fehler beim Wiederherstellen der Konversation:', error);
		return false;
	}
}

/**
 * Löscht eine Konversation dauerhaft
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
	try {
		return await conversationApi.deleteConversation(conversationId);
	} catch (error) {
		console.error('Fehler beim Löschen der Konversation:', error);
		return false;
	}
}
