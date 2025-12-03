import { fetchApi } from './client';
import type { EmailAddress } from './emails';

export interface Draft {
	id: string;
	accountId: string;
	userId: string;
	replyToEmailId: string | null;
	replyType: 'reply' | 'reply-all' | 'forward' | null;
	subject: string | null;
	toAddresses: EmailAddress[];
	ccAddresses: EmailAddress[] | null;
	bccAddresses: EmailAddress[] | null;
	bodyHtml: string | null;
	bodyPlain: string | null;
	scheduledAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateDraftDto {
	accountId: string;
	subject?: string;
	toAddresses?: EmailAddress[];
	ccAddresses?: EmailAddress[];
	bccAddresses?: EmailAddress[];
	bodyHtml?: string;
	bodyPlain?: string;
	replyToEmailId?: string;
	replyType?: 'reply' | 'reply-all' | 'forward';
	scheduledAt?: string;
}

export interface UpdateDraftDto {
	subject?: string;
	toAddresses?: EmailAddress[];
	ccAddresses?: EmailAddress[];
	bccAddresses?: EmailAddress[];
	bodyHtml?: string;
	bodyPlain?: string;
	scheduledAt?: string;
}

export interface SendEmailDto {
	accountId: string;
	subject?: string;
	toAddresses: EmailAddress[];
	ccAddresses?: EmailAddress[];
	bccAddresses?: EmailAddress[];
	bodyHtml?: string;
	bodyPlain?: string;
	replyToEmailId?: string;
	replyType?: 'reply' | 'reply-all' | 'forward';
}

export const composeApi = {
	// Drafts
	async listDrafts(accountId?: string) {
		const query = accountId ? `?accountId=${accountId}` : '';
		return fetchApi<{ drafts: Draft[]; total: number }>(`/drafts${query}`);
	},

	async getDraft(id: string) {
		return fetchApi<{ draft: Draft }>(`/drafts/${id}`);
	},

	async createDraft(data: CreateDraftDto) {
		return fetchApi<{ draft: Draft }>('/drafts', {
			method: 'POST',
			body: data,
		});
	},

	async updateDraft(id: string, data: UpdateDraftDto) {
		return fetchApi<{ draft: Draft }>(`/drafts/${id}`, {
			method: 'PATCH',
			body: data,
		});
	},

	async deleteDraft(id: string) {
		return fetchApi<{ success: boolean }>(`/drafts/${id}`, {
			method: 'DELETE',
		});
	},

	async sendDraft(id: string) {
		return fetchApi<{ success: boolean; messageId?: string }>(`/drafts/${id}/send`, {
			method: 'POST',
		});
	},

	// Direct send
	async send(data: SendEmailDto) {
		return fetchApi<{ success: boolean; messageId?: string }>('/send', {
			method: 'POST',
			body: data,
		});
	},

	// Reply/Forward
	async createReply(emailId: string) {
		return fetchApi<{ draft: Draft }>(`/emails/${emailId}/reply`, {
			method: 'POST',
		});
	},

	async createReplyAll(emailId: string) {
		return fetchApi<{ draft: Draft }>(`/emails/${emailId}/reply-all`, {
			method: 'POST',
		});
	},

	async createForward(emailId: string) {
		return fetchApi<{ draft: Draft }>(`/emails/${emailId}/forward`, {
			method: 'POST',
		});
	},
};
