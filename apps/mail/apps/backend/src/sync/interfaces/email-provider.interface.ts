import { type EmailAccount, type Email, type Folder } from '../../db/schema';

export interface SyncState {
	lastSyncAt?: Date;
	lastMessageId?: string;
	historyId?: string; // Gmail specific
	deltaLink?: string; // Outlook specific
	uidValidity?: number; // IMAP specific
	highestModSeq?: string; // IMAP specific
}

export interface SyncResult {
	success: boolean;
	newEmails: number;
	updatedEmails: number;
	deletedEmails: number;
	newFolders: number;
	error?: string;
	newSyncState: SyncState;
}

export interface FetchedEmail {
	messageId: string;
	externalId?: string;
	subject?: string;
	fromAddress?: string;
	fromName?: string;
	toAddresses: { email: string; name?: string }[];
	ccAddresses?: { email: string; name?: string }[];
	bccAddresses?: { email: string; name?: string }[];
	snippet?: string;
	bodyPlain?: string;
	bodyHtml?: string;
	sentAt?: Date;
	receivedAt?: Date;
	isRead: boolean;
	isStarred: boolean;
	hasAttachments: boolean;
	threadId?: string;
	inReplyTo?: string;
	references?: string[];
	headers?: Record<string, string>;
	attachments?: {
		filename: string;
		mimeType: string;
		size: number;
		contentId?: string;
		content?: Buffer;
	}[];
}

export interface FetchedFolder {
	name: string;
	path: string;
	type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
	delimiter?: string;
	flags?: string[];
}

export interface EmailProvider {
	/**
	 * Connect to the email provider
	 */
	connect(account: EmailAccount, password?: string): Promise<void>;

	/**
	 * Disconnect from the email provider
	 */
	disconnect(): Promise<void>;

	/**
	 * Sync folders from the provider
	 */
	syncFolders(account: EmailAccount): Promise<FetchedFolder[]>;

	/**
	 * Perform delta sync to get new/updated/deleted emails
	 */
	sync(account: EmailAccount, state: SyncState): Promise<SyncResult>;

	/**
	 * Fetch a single email by ID
	 */
	fetchEmail(account: EmailAccount, externalId: string): Promise<FetchedEmail | null>;

	/**
	 * Fetch emails from a folder
	 */
	fetchEmails(
		account: EmailAccount,
		folderPath: string,
		options?: { limit?: number; since?: Date }
	): Promise<FetchedEmail[]>;

	/**
	 * Update email flags (read, starred)
	 */
	updateFlags(
		account: EmailAccount,
		externalId: string,
		flags: { isRead?: boolean; isStarred?: boolean }
	): Promise<void>;

	/**
	 * Move email to a different folder
	 */
	moveEmail(account: EmailAccount, externalId: string, targetFolderPath: string): Promise<void>;

	/**
	 * Delete an email
	 */
	deleteEmail(account: EmailAccount, externalId: string): Promise<void>;
}
