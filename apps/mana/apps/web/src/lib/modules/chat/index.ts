/**
 * Chat module — barrel exports.
 */

export { conversationsStore } from './stores/conversations.svelte';
export { messagesStore } from './stores/messages.svelte';
export { templatesStore } from './stores/templates.svelte';
export {
	useAllConversations,
	useArchivedConversations,
	useAllTemplates,
	useConversationMessages,
	toConversation,
	toTemplate,
	toMessage,
	sortConversations,
	filterByContextSpace,
	filterBySearch,
	splitPinned,
} from './queries';
export { conversationTable, messageTable, chatTemplateTable, CHAT_GUEST_SEED } from './collections';
export type {
	LocalConversation,
	LocalMessage,
	LocalTemplate,
	Conversation,
	Message,
	Template,
	AIModel,
	ChatMessage,
} from './types';
