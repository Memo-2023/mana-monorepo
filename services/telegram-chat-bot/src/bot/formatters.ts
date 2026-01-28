import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AIModel, Conversation, Message } from '../chat/chat.client';
import { MODEL_DISPLAY_NAMES } from '../config/configuration';

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Get model display name
 */
function getModelDisplayName(modelId: string, models?: AIModel[]): string {
	// Check predefined names
	if (MODEL_DISPLAY_NAMES[modelId]) {
		return MODEL_DISPLAY_NAMES[modelId];
	}

	// Check from models list
	const model = models?.find((m) => m.id === modelId);
	if (model) {
		const emoji = model.isLocal ? '🏠' : '☁️';
		return `${emoji} ${model.name}`;
	}

	// Fallback: extract name from ID
	const parts = modelId.split('/');
	const name = parts[parts.length - 1].replace(/:.*$/, '');
	return `🤖 ${name}`;
}

/**
 * Format models list
 */
export function formatModels(models: AIModel[], currentModel?: string | null): string {
	if (models.length === 0) {
		return '🤖 <b>AI-Modelle</b>\n\nKeine Modelle verfügbar.';
	}

	let text = '🤖 <b>Verfügbare AI-Modelle</b>\n\n';

	// Group by local/cloud
	const localModels = models.filter((m) => m.isLocal);
	const cloudModels = models.filter((m) => !m.isLocal);

	if (localModels.length > 0) {
		text += '<b>🏠 Lokal (kostenlos)</b>\n';
		for (const model of localModels) {
			const current = model.id === currentModel ? ' ✓' : '';
			const isDefault = model.isDefault ? ' (Standard)' : '';
			text += `• ${escapeHtml(model.name)}${isDefault}${current}\n`;
		}
		text += '\n';
	}

	if (cloudModels.length > 0) {
		text += '<b>☁️ Cloud</b>\n';
		for (const model of cloudModels) {
			const current = model.id === currentModel ? ' ✓' : '';
			text += `• ${escapeHtml(model.name)}${current}\n`;
		}
		text += '\n';
	}

	text += '───────────────\n';
	text += 'Wechseln mit: /model [name]';

	return text;
}

/**
 * Format model changed message
 */
export function formatModelChanged(model: AIModel): string {
	const emoji = model.isLocal ? '🏠' : '☁️';
	return `✅ Modell gewechselt zu:\n\n${emoji} <b>${escapeHtml(model.name)}</b>\n\nDeine nächste Nachricht wird mit diesem Modell beantwortet.`;
}

/**
 * Format conversations list
 */
export function formatConversations(
	conversations: Conversation[],
	currentId?: string | null
): string {
	if (conversations.length === 0) {
		return '💬 <b>Deine Konversationen</b>\n\nKeine Konversationen vorhanden.\n\nStarte eine mit /new oder sende einfach eine Nachricht!';
	}

	let text = '💬 <b>Deine Konversationen</b>\n\n';

	for (const convo of conversations.slice(0, 10)) {
		const current = convo.id === currentId ? ' 📍' : '';
		const date = format(new Date(convo.updatedAt), 'd. MMM', { locale: de });
		const title =
			convo.title.length > 30 ? convo.title.substring(0, 30) + '...' : convo.title;
		text += `• <b>${escapeHtml(title)}</b>${current}\n  ${date}\n\n`;
	}

	text += '───────────────\n';
	text += '/new [titel] - Neue Konversation\n';
	text += '/clear - Kontext löschen';

	return text;
}

/**
 * Format new conversation created message
 */
export function formatNewConversation(conversation: Conversation): string {
	return `✅ <b>Neue Konversation gestartet</b>

📝 ${escapeHtml(conversation.title)}

Du kannst jetzt chatten! Sende einfach eine Nachricht.`;
}

/**
 * Format messages history
 */
export function formatMessages(messages: Message[]): string {
	if (messages.length === 0) {
		return '📜 <b>Verlauf</b>\n\nKeine Nachrichten in dieser Konversation.';
	}

	let text = '📜 <b>Letzte Nachrichten</b>\n\n';

	// Reverse to show oldest first
	const sorted = [...messages].reverse().slice(-10);

	for (const msg of sorted) {
		const role = msg.role === 'user' ? '👤' : '🤖';
		const content =
			msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content;
		text += `${role} ${escapeHtml(content)}\n\n`;
	}

	return text;
}

/**
 * Format status message
 */
export function formatStatusMessage(
	isLinked: boolean,
	username?: string | null,
	currentModel?: string | null,
	lastActive?: Date
): string {
	if (!isLinked) {
		return `📊 <b>Status</b>

❌ Nicht mit ManaCore verknüpft

Nutze /link um deinen Account zu verknüpfen.`;
	}

	const lastActiveText = lastActive ? format(lastActive, 'd. MMM HH:mm', { locale: de }) : 'Nie';
	const modelName = currentModel ? getModelDisplayName(currentModel) : '🏠 Gemma 3 4B (Standard)';

	return `📊 <b>Status</b>

✅ Verknüpft mit ManaCore
👤 ${username || 'Unbekannt'}
🤖 Modell: ${modelName}
🕐 Letzte Aktivität: ${lastActiveText}

───────────────
/models - Modell wechseln
/unlink - Verknüpfung trennen`;
}

/**
 * Format help message
 */
export function formatHelpMessage(): string {
	return `🤖 <b>Chat Bot - Hilfe</b>

Chatte mit verschiedenen AI-Modellen direkt in Telegram!

<b>Chatten:</b>
Sende einfach eine Nachricht - der Bot antwortet mit AI.

<b>Modelle:</b>
/models - Verfügbare Modelle anzeigen
/model [name] - Modell wechseln
  z.B. /model claude, /model gpt

<b>Konversationen:</b>
/new [titel] - Neue Konversation
/convos - Konversationen auflisten
/history - Letzte Nachrichten
/clear - Neuer Kontext

<b>Account:</b>
/status - Verbindungsstatus
/link - ManaCore Account verknüpfen
/unlink - Verknüpfung trennen

───────────────
🏠 Lokal: Gemma 3 (kostenlos, schnell)
☁️ Cloud: Claude, GPT-4, DeepSeek, etc.`;
}
