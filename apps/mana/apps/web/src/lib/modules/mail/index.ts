/**
 * Mail module — barrel exports.
 */

export { mailStore } from './stores/mail.svelte';
export { draftsStore } from './stores/drafts.svelte';
export { useAllDrafts, toMailDraft, formatSender, formatDate } from './queries';
export { mailDraftTable } from './collections';
export { mailApi } from './api';
export { SYSTEM_MAILBOXES } from './types';
export type {
	ThreadSummary,
	ThreadDetail,
	MessageDetail,
	EmailAddress,
	MailboxInfo,
	MailAccount,
	LocalMailDraft,
	MailDraft,
} from './types';
