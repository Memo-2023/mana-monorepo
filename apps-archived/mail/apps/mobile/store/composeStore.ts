import { create } from 'zustand';
import { composeApi } from '~/utils/api';
import type { EmailAddress } from './emailsStore';

export interface Draft {
	id: string;
	accountId: string;
	subject?: string;
	toAddresses: EmailAddress[];
	ccAddresses?: EmailAddress[];
	bccAddresses?: EmailAddress[];
	bodyHtml?: string;
	replyToEmailId?: string;
	replyType?: 'reply' | 'reply-all' | 'forward';
	createdAt: string;
	updatedAt: string;
}

interface ComposeState {
	// Data
	drafts: Draft[];
	currentDraft: Draft | null;

	// Form state
	isComposeOpen: boolean;
	accountId: string;
	subject: string;
	toAddresses: EmailAddress[];
	ccAddresses: EmailAddress[];
	bccAddresses: EmailAddress[];
	bodyHtml: string;
	replyToEmailId?: string;
	replyType?: 'reply' | 'reply-all' | 'forward';

	// UI state
	loading: boolean;
	sending: boolean;
	error: string | null;

	// Actions
	openCompose: (accountId: string) => void;
	closeCompose: () => void;
	updateForm: (updates: Partial<ComposeState>) => void;
	fetchDrafts: (accountId: string | undefined, token: string) => Promise<void>;
	saveDraft: (token: string) => Promise<Draft | null>;
	deleteDraft: (id: string, token: string) => Promise<boolean>;
	openDraft: (draft: Draft) => void;
	send: (token: string) => Promise<boolean>;
	createReply: (emailId: string, token: string) => Promise<void>;
	createReplyAll: (emailId: string, token: string) => Promise<void>;
	createForward: (emailId: string, token: string) => Promise<void>;
	clearError: () => void;
}

export const useComposeStore = create<ComposeState>((set, get) => ({
	drafts: [],
	currentDraft: null,
	isComposeOpen: false,
	accountId: '',
	subject: '',
	toAddresses: [],
	ccAddresses: [],
	bccAddresses: [],
	bodyHtml: '',
	replyToEmailId: undefined,
	replyType: undefined,
	loading: false,
	sending: false,
	error: null,

	openCompose: (accountId) => {
		set({
			isComposeOpen: true,
			accountId,
			subject: '',
			toAddresses: [],
			ccAddresses: [],
			bccAddresses: [],
			bodyHtml: '',
			replyToEmailId: undefined,
			replyType: undefined,
			currentDraft: null,
		});
	},

	closeCompose: () => {
		set({
			isComposeOpen: false,
			currentDraft: null,
		});
	},

	updateForm: (updates) => {
		set(updates);
	},

	fetchDrafts: async (accountId, token) => {
		set({ loading: true, error: null });
		const result = await composeApi.listDrafts(accountId, token);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		set({ drafts: result.data?.drafts || [], loading: false });
	},

	saveDraft: async (token) => {
		const {
			currentDraft,
			accountId,
			subject,
			toAddresses,
			ccAddresses,
			bccAddresses,
			bodyHtml,
			replyToEmailId,
			replyType,
		} = get();

		set({ loading: true, error: null });

		if (currentDraft) {
			const result = await composeApi.updateDraft(
				currentDraft.id,
				{ subject, toAddresses, ccAddresses, bccAddresses, bodyHtml },
				token
			);

			if (result.error) {
				set({ error: result.error.message, loading: false });
				return null;
			}

			const draft = result.data?.draft;
			if (draft) {
				set((state) => ({
					currentDraft: draft,
					drafts: state.drafts.map((d) => (d.id === draft.id ? draft : d)),
					loading: false,
				}));
			}
			return draft || null;
		} else {
			const result = await composeApi.createDraft(
				{
					accountId,
					subject,
					toAddresses,
					ccAddresses,
					bccAddresses,
					bodyHtml,
					replyToEmailId,
					replyType,
				},
				token
			);

			if (result.error) {
				set({ error: result.error.message, loading: false });
				return null;
			}

			const draft = result.data?.draft;
			if (draft) {
				set((state) => ({
					currentDraft: draft,
					drafts: [draft, ...state.drafts],
					loading: false,
				}));
			}
			return draft || null;
		}
	},

	deleteDraft: async (id, token) => {
		const result = await composeApi.deleteDraft(id, token);

		if (result.error) {
			set({ error: result.error.message });
			return false;
		}

		set((state) => ({
			drafts: state.drafts.filter((d) => d.id !== id),
			currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
		}));

		return true;
	},

	openDraft: (draft) => {
		set({
			isComposeOpen: true,
			currentDraft: draft,
			accountId: draft.accountId,
			subject: draft.subject || '',
			toAddresses: draft.toAddresses || [],
			ccAddresses: draft.ccAddresses || [],
			bccAddresses: draft.bccAddresses || [],
			bodyHtml: draft.bodyHtml || '',
			replyToEmailId: draft.replyToEmailId,
			replyType: draft.replyType,
		});
	},

	send: async (token) => {
		const {
			currentDraft,
			toAddresses,
			accountId,
			subject,
			ccAddresses,
			bccAddresses,
			bodyHtml,
			replyToEmailId,
			replyType,
		} = get();

		if (toAddresses.length === 0) {
			set({ error: 'Please add at least one recipient' });
			return false;
		}

		set({ sending: true, error: null });

		let result;
		if (currentDraft) {
			await get().saveDraft(token);
			result = await composeApi.sendDraft(currentDraft.id, token);
		} else {
			result = await composeApi.send(
				{
					accountId,
					subject,
					toAddresses,
					ccAddresses,
					bccAddresses,
					bodyHtml,
					replyToEmailId,
					replyType,
				},
				token
			);
		}

		if (result.error) {
			set({ error: result.error.message, sending: false });
			return false;
		}

		if (currentDraft) {
			set((state) => ({
				drafts: state.drafts.filter((d) => d.id !== currentDraft.id),
			}));
		}

		get().closeCompose();
		set({ sending: false });
		return true;
	},

	createReply: async (emailId, token) => {
		set({ loading: true, error: null });
		const result = await composeApi.createReply(emailId, token);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		if (result.data?.draft) {
			get().openDraft(result.data.draft);
			set((state) => ({
				drafts: [result.data!.draft, ...state.drafts],
			}));
		}
		set({ loading: false });
	},

	createReplyAll: async (emailId, token) => {
		set({ loading: true, error: null });
		const result = await composeApi.createReplyAll(emailId, token);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		if (result.data?.draft) {
			get().openDraft(result.data.draft);
			set((state) => ({
				drafts: [result.data!.draft, ...state.drafts],
			}));
		}
		set({ loading: false });
	},

	createForward: async (emailId, token) => {
		set({ loading: true, error: null });
		const result = await composeApi.createForward(emailId, token);

		if (result.error) {
			set({ error: result.error.message, loading: false });
			return;
		}

		if (result.data?.draft) {
			get().openDraft(result.data.draft);
			set((state) => ({
				drafts: [result.data!.draft, ...state.drafts],
			}));
		}
		set({ loading: false });
	},

	clearError: () => set({ error: null }),
}));
