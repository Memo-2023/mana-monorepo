/**
 * Compose Store - Manages draft composition using Svelte 5 runes
 */

import {
	composeApi,
	type Draft,
	type CreateDraftDto,
	type UpdateDraftDto,
	type SendEmailDto,
} from '$lib/api/compose';
import type { EmailAddress } from '$lib/api/emails';

let drafts = $state<Draft[]>([]);
let loading = $state(false);
let sending = $state(false);
let error = $state<string | null>(null);
let isComposeOpen = $state(false);
let currentDraft = $state<Draft | null>(null);

// Compose form state
let composeForm = $state<{
	accountId: string;
	subject: string;
	toAddresses: EmailAddress[];
	ccAddresses: EmailAddress[];
	bccAddresses: EmailAddress[];
	bodyHtml: string;
	replyToEmailId?: string;
	replyType?: 'reply' | 'reply-all' | 'forward';
}>({
	accountId: '',
	subject: '',
	toAddresses: [],
	ccAddresses: [],
	bccAddresses: [],
	bodyHtml: '',
});

export const composeStore = {
	get drafts() {
		return drafts;
	},
	get loading() {
		return loading;
	},
	get sending() {
		return sending;
	},
	get error() {
		return error;
	},
	get isComposeOpen() {
		return isComposeOpen;
	},
	get currentDraft() {
		return currentDraft;
	},
	get composeForm() {
		return composeForm;
	},

	// Compose modal controls
	openCompose(accountId: string) {
		composeForm = {
			accountId,
			subject: '',
			toAddresses: [],
			ccAddresses: [],
			bccAddresses: [],
			bodyHtml: '',
		};
		currentDraft = null;
		isComposeOpen = true;
	},

	closeCompose() {
		isComposeOpen = false;
		currentDraft = null;
	},

	updateForm(updates: Partial<typeof composeForm>) {
		composeForm = { ...composeForm, ...updates };
	},

	// Draft management
	async fetchDrafts(accountId?: string) {
		loading = true;
		error = null;

		const result = await composeApi.listDrafts(accountId);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		drafts = result.data?.drafts || [];
		loading = false;
	},

	async saveDraft() {
		loading = true;
		error = null;

		if (currentDraft) {
			// Update existing draft
			const updateData: UpdateDraftDto = {
				subject: composeForm.subject,
				toAddresses: composeForm.toAddresses,
				ccAddresses: composeForm.ccAddresses,
				bccAddresses: composeForm.bccAddresses,
				bodyHtml: composeForm.bodyHtml,
			};

			const result = await composeApi.updateDraft(currentDraft.id, updateData);

			if (result.error) {
				error = result.error.message;
				loading = false;
				return null;
			}

			if (result.data?.draft) {
				currentDraft = result.data.draft;
				drafts = drafts.map((d) => (d.id === currentDraft!.id ? result.data!.draft : d));
			}

			loading = false;
			return result.data?.draft || null;
		} else {
			// Create new draft
			const createData: CreateDraftDto = {
				accountId: composeForm.accountId,
				subject: composeForm.subject,
				toAddresses: composeForm.toAddresses,
				ccAddresses: composeForm.ccAddresses,
				bccAddresses: composeForm.bccAddresses,
				bodyHtml: composeForm.bodyHtml,
				replyToEmailId: composeForm.replyToEmailId,
				replyType: composeForm.replyType,
			};

			const result = await composeApi.createDraft(createData);

			if (result.error) {
				error = result.error.message;
				loading = false;
				return null;
			}

			if (result.data?.draft) {
				currentDraft = result.data.draft;
				drafts = [result.data.draft, ...drafts];
			}

			loading = false;
			return result.data?.draft || null;
		}
	},

	async deleteDraft(id: string) {
		const result = await composeApi.deleteDraft(id);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		drafts = drafts.filter((d) => d.id !== id);

		if (currentDraft?.id === id) {
			currentDraft = null;
		}

		return true;
	},

	async openDraft(draft: Draft) {
		currentDraft = draft;
		composeForm = {
			accountId: draft.accountId,
			subject: draft.subject || '',
			toAddresses: draft.toAddresses || [],
			ccAddresses: draft.ccAddresses || [],
			bccAddresses: draft.bccAddresses || [],
			bodyHtml: draft.bodyHtml || '',
			replyToEmailId: draft.replyToEmailId || undefined,
			replyType: draft.replyType || undefined,
		};
		isComposeOpen = true;
	},

	// Send email
	async send() {
		if (composeForm.toAddresses.length === 0) {
			error = 'Please add at least one recipient';
			return false;
		}

		sending = true;
		error = null;

		let result;

		if (currentDraft) {
			// Save draft first, then send
			await this.saveDraft();
			result = await composeApi.sendDraft(currentDraft.id);
		} else {
			// Send directly
			const sendData: SendEmailDto = {
				accountId: composeForm.accountId,
				subject: composeForm.subject,
				toAddresses: composeForm.toAddresses,
				ccAddresses: composeForm.ccAddresses,
				bccAddresses: composeForm.bccAddresses,
				bodyHtml: composeForm.bodyHtml,
				replyToEmailId: composeForm.replyToEmailId,
				replyType: composeForm.replyType,
			};

			result = await composeApi.send(sendData);
		}

		if (result.error) {
			error = result.error.message;
			sending = false;
			return false;
		}

		// Remove draft from list if it was a draft
		if (currentDraft) {
			drafts = drafts.filter((d) => d.id !== currentDraft!.id);
		}

		// Close compose
		this.closeCompose();
		sending = false;

		return true;
	},

	// Reply/Forward
	async createReply(emailId: string) {
		loading = true;
		error = null;

		const result = await composeApi.createReply(emailId);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		if (result.data?.draft) {
			await this.openDraft(result.data.draft);
			drafts = [result.data.draft, ...drafts];
		}

		loading = false;
	},

	async createReplyAll(emailId: string) {
		loading = true;
		error = null;

		const result = await composeApi.createReplyAll(emailId);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		if (result.data?.draft) {
			await this.openDraft(result.data.draft);
			drafts = [result.data.draft, ...drafts];
		}

		loading = false;
	},

	async createForward(emailId: string) {
		loading = true;
		error = null;

		const result = await composeApi.createForward(emailId);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		if (result.data?.draft) {
			await this.openDraft(result.data.draft);
			drafts = [result.data.draft, ...drafts];
		}

		loading = false;
	},

	// Alias for drafts page - opens a draft by ID
	async editDraft(draftId: string) {
		const draft = drafts.find((d) => d.id === draftId);
		if (draft) {
			await this.openDraft(draft);
		} else {
			// Fetch draft if not in list
			loading = true;
			const result = await composeApi.getDraft(draftId);
			loading = false;

			if (result.error) {
				error = result.error.message;
				return;
			}

			if (result.data?.draft) {
				await this.openDraft(result.data.draft);
			}
		}
	},
};
