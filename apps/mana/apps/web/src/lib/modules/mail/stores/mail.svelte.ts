/**
 * Mail Store — API-driven actions for reading and sending mail.
 */

import { mailApi } from '../api';
import type { ThreadSummary, ThreadDetail, MailboxInfo } from '../types';

// ─── Reactive State ─────────────────────────────────────────

let threads = $state<ThreadSummary[]>([]);
let totalThreads = $state(0);
let activeThread = $state<ThreadDetail | null>(null);
let mailboxes = $state<MailboxInfo[]>([]);
let activeMailboxId = $state<string | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

export const mailStore = {
	get threads() {
		return threads;
	},
	get totalThreads() {
		return totalThreads;
	},
	get activeThread() {
		return activeThread;
	},
	get mailboxes() {
		return mailboxes;
	},
	get activeMailboxId() {
		return activeMailboxId;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	async loadMailboxes() {
		try {
			mailboxes = await mailApi.getLabels();
		} catch (e) {
			console.error('[mail] Failed to load mailboxes:', e);
		}
	},

	async loadThreads(opts: { mailboxId?: string; limit?: number; offset?: number } = {}) {
		loading = true;
		error = null;
		try {
			const result = await mailApi.getThreads(opts);
			threads = result.threads;
			totalThreads = result.total;
			if (opts.mailboxId !== undefined) activeMailboxId = opts.mailboxId ?? null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			console.error('[mail] Failed to load threads:', e);
		} finally {
			loading = false;
		}
	},

	async loadThread(threadId: string) {
		loading = true;
		error = null;
		try {
			activeThread = await mailApi.getThread(threadId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			console.error('[mail] Failed to load thread:', e);
		} finally {
			loading = false;
		}
	},

	async markRead(emailId: string) {
		await mailApi.updateMessage(emailId, { isRead: true });
		// Optimistic update
		threads = threads.map((t) => (t.id === activeThread?.id ? { ...t, isRead: true } : t));
	},

	async toggleStar(emailId: string, currentState: boolean) {
		await mailApi.updateMessage(emailId, { isFlagged: !currentState });
	},

	async archive(emailId: string, archiveMailboxId: string) {
		await mailApi.updateMessage(emailId, { mailboxIds: { [archiveMailboxId]: true } });
	},

	async sendEmail(email: {
		to: { email: string; name?: string }[];
		cc?: { email: string; name?: string }[];
		subject: string;
		body: string;
		htmlBody?: string;
		inReplyTo?: string;
		references?: string[];
	}) {
		return mailApi.sendEmail({
			...email,
			to: email.to.map((t) => ({ email: t.email, name: t.name ?? null })),
			cc: email.cc?.map((c) => ({ email: c.email, name: c.name ?? null })),
		});
	},

	clearActiveThread() {
		activeThread = null;
	},
};
