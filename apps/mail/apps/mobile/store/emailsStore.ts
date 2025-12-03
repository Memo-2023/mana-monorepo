import { create } from 'zustand';
import { emailsApi, foldersApi, accountsApi } from '~/utils/api';

export interface EmailAddress {
	email: string;
	name?: string;
}

export interface Email {
	id: string;
	accountId: string;
	folderId: string;
	threadId?: string;
	messageId: string;
	subject: string;
	fromAddress: string;
	fromName?: string;
	toAddresses: EmailAddress[];
	ccAddresses?: EmailAddress[];
	snippet?: string;
	bodyPlain?: string;
	bodyHtml?: string;
	sentAt: string;
	receivedAt: string;
	isRead: boolean;
	isStarred: boolean;
	isDraft: boolean;
	hasAttachments: boolean;
	aiSummary?: string;
	aiCategory?: string;
}

export interface Folder {
	id: string;
	accountId: string;
	name: string;
	type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
	path: string;
	unreadCount: number;
	totalCount: number;
	isSystem: boolean;
}

export interface Account {
	id: string;
	name: string;
	email: string;
	provider: 'gmail' | 'outlook' | 'imap';
	isDefault: boolean;
	syncEnabled: boolean;
	lastSyncAt?: string;
}

interface EmailsState {
	// Data
	accounts: Account[];
	selectedAccountId: string | null;
	folders: Folder[];
	selectedFolderId: string | null;
	emails: Email[];
	selectedEmail: Email | null;

	// UI state
	loading: boolean;
	syncing: boolean;
	error: string | null;
	page: number;
	hasMore: boolean;

	// Actions
	fetchAccounts: (token: string) => Promise<void>;
	selectAccount: (id: string) => void;
	fetchFolders: (accountId: string, token: string) => Promise<void>;
	selectFolder: (id: string) => void;
	fetchEmails: (token: string, reset?: boolean) => Promise<void>;
	fetchEmail: (id: string, token: string) => Promise<void>;
	markAsRead: (id: string, token: string) => Promise<void>;
	toggleStar: (id: string, token: string) => Promise<void>;
	deleteEmail: (id: string, token: string) => Promise<void>;
	moveEmail: (id: string, folderId: string, token: string) => Promise<void>;
	syncAccount: (accountId: string, token: string) => Promise<void>;
	clearError: () => void;
}

export const useEmailsStore = create<EmailsState>((set, get) => ({
	accounts: [],
	selectedAccountId: null,
	folders: [],
	selectedFolderId: null,
	emails: [],
	selectedEmail: null,
	loading: false,
	syncing: false,
	error: null,
	page: 1,
	hasMore: true,

	fetchAccounts: async (token) => {
		set({ loading: true, error: null });
		const result = await accountsApi.list(token);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		const accounts = result.data?.accounts || [];
		const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];

		set({
			accounts,
			selectedAccountId: defaultAccount?.id || null,
			loading: false,
		});
	},

	selectAccount: (id) => {
		set({
			selectedAccountId: id,
			selectedFolderId: null,
			folders: [],
			emails: [],
			page: 1,
			hasMore: true,
		});
	},

	fetchFolders: async (accountId, token) => {
		set({ loading: true, error: null });
		const result = await foldersApi.list(accountId, token);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		const folders = result.data?.folders || [];
		const inbox = folders.find((f) => f.type === 'inbox');

		set({
			folders,
			selectedFolderId: inbox?.id || folders[0]?.id || null,
			loading: false,
		});
	},

	selectFolder: (id) => {
		set({
			selectedFolderId: id,
			emails: [],
			selectedEmail: null,
			page: 1,
			hasMore: true,
		});
	},

	fetchEmails: async (token, reset = false) => {
		const { selectedAccountId, selectedFolderId, page, emails } = get();
		if (!selectedAccountId) return;

		set({ loading: true, error: null });

		const currentPage = reset ? 1 : page;
		const result = await emailsApi.list(
			{
				accountId: selectedAccountId,
				folderId: selectedFolderId || undefined,
				page: currentPage,
				limit: 20,
			},
			token
		);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		const newEmails = result.data?.emails || [];
		const total = result.data?.total || 0;

		set({
			emails: reset ? newEmails : [...emails, ...newEmails],
			page: currentPage + 1,
			hasMore: (reset ? newEmails.length : emails.length + newEmails.length) < total,
			loading: false,
		});
	},

	fetchEmail: async (id, token) => {
		set({ loading: true, error: null });
		const result = await emailsApi.get(id, token);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		set({ selectedEmail: result.data?.email || null, loading: false });
	},

	markAsRead: async (id, token) => {
		const result = await emailsApi.update(id, { isRead: true }, token);

		if (result.error) {
			set({ error: result.error.message });
			return;
		}

		set((state) => ({
			emails: state.emails.map((e) => (e.id === id ? { ...e, isRead: true } : e)),
			selectedEmail:
				state.selectedEmail?.id === id
					? { ...state.selectedEmail, isRead: true }
					: state.selectedEmail,
		}));
	},

	toggleStar: async (id, token) => {
		const { emails, selectedEmail } = get();
		const email = emails.find((e) => e.id === id) || selectedEmail;
		if (!email) return;

		const newStarred = !email.isStarred;
		const result = await emailsApi.update(id, { isStarred: newStarred }, token);

		if (result.error) {
			set({ error: result.error.message });
			return;
		}

		set((state) => ({
			emails: state.emails.map((e) => (e.id === id ? { ...e, isStarred: newStarred } : e)),
			selectedEmail:
				state.selectedEmail?.id === id
					? { ...state.selectedEmail, isStarred: newStarred }
					: state.selectedEmail,
		}));
	},

	deleteEmail: async (id, token) => {
		const result = await emailsApi.delete(id, token);

		if (result.error) {
			set({ error: result.error.message });
			return;
		}

		set((state) => ({
			emails: state.emails.filter((e) => e.id !== id),
			selectedEmail: state.selectedEmail?.id === id ? null : state.selectedEmail,
		}));
	},

	moveEmail: async (id, folderId, token) => {
		const result = await emailsApi.move(id, folderId, token);

		if (result.error) {
			set({ error: result.error.message });
			return;
		}

		set((state) => ({
			emails: state.emails.filter((e) => e.id !== id),
			selectedEmail: state.selectedEmail?.id === id ? null : state.selectedEmail,
		}));
	},

	syncAccount: async (accountId, token) => {
		set({ syncing: true, error: null });
		const result = await accountsApi.sync(accountId, token);

		if (result.error) {
			set({ error: result.error.message, syncing: false });
			return;
		}

		// Refresh emails after sync
		await get().fetchEmails(token, true);
		set({ syncing: false });
	},

	clearError: () => set({ error: null }),
}));
