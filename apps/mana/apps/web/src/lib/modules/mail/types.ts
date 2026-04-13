/**
 * Mail module types.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── API Response Types ─────────────────────────────────────

export interface ThreadSummary {
	id: string;
	subject: string;
	snippet: string;
	from: EmailAddress[];
	lastMessageAt: string;
	messageCount: number;
	isRead: boolean;
	isFlagged: boolean;
	hasAttachment: boolean;
}

export interface ThreadDetail {
	id: string;
	subject: string;
	messages: MessageDetail[];
}

export interface MessageDetail {
	id: string;
	from: EmailAddress[] | null;
	to: EmailAddress[] | null;
	cc: EmailAddress[] | null;
	subject: string;
	date: string;
	preview: string;
	bodyText?: string;
	bodyHtml?: string;
	isRead: boolean;
	isFlagged: boolean;
	hasAttachment: boolean;
}

export interface EmailAddress {
	name: string | null;
	email: string;
}

export interface MailboxInfo {
	id: string;
	name: string;
	role: string | null;
	totalEmails: number;
	unreadEmails: number;
}

export interface MailAccount {
	id: string;
	userId: string;
	email: string;
	displayName: string | null;
	provider: string;
	isDefault: boolean;
	signature: string | null;
}

// ─── Local Cache Types (Dexie) ──────────────────────────────

export interface LocalMailDraft extends BaseRecord {
	accountId: string;
	to: string;
	cc: string;
	subject: string;
	body: string;
	htmlBody: string;
	replyToMessageId: string | null;
}

export interface MailDraft {
	id: string;
	accountId: string;
	to: string;
	cc: string;
	subject: string;
	body: string;
	htmlBody: string;
	replyToMessageId: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ──────────────────────────────────────────────

export const SYSTEM_MAILBOXES: Record<string, { label: string; icon: string }> = {
	inbox: { label: 'Posteingang', icon: 'tray' },
	sent: { label: 'Gesendet', icon: 'paper-plane-tilt' },
	drafts: { label: 'Entwürfe', icon: 'note-pencil' },
	trash: { label: 'Papierkorb', icon: 'trash' },
	junk: { label: 'Spam', icon: 'warning' },
	archive: { label: 'Archiv', icon: 'archive-box' },
};
