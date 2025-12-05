/**
 * Labels Store - Manages custom labels using Svelte 5 runes
 */

import { labelsApi, type Label, type CreateLabelDto, type UpdateLabelDto } from '$lib/api/labels';

let labels = $state<Label[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

// Email-label associations cache
let emailLabels = $state<Map<string, Label[]>>(new Map());

export const labelsStore = {
	get labels() {
		return labels;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	getEmailLabels(emailId: string) {
		return emailLabels.get(emailId) || [];
	},

	async fetchLabels(accountId?: string) {
		loading = true;
		error = null;

		const result = await labelsApi.list(accountId);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		labels = result.data?.labels || [];
		loading = false;
	},

	async createLabel(data: CreateLabelDto) {
		loading = true;
		error = null;

		const result = await labelsApi.create(data);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return null;
		}

		if (result.data?.label) {
			labels = [...labels, result.data.label];
		}

		loading = false;
		return result.data?.label || null;
	},

	async updateLabel(id: string, data: UpdateLabelDto) {
		const result = await labelsApi.update(id, data);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		if (result.data?.label) {
			labels = labels.map((l) => (l.id === id ? result.data!.label : l));
		}

		return result.data?.label || null;
	},

	async deleteLabel(id: string) {
		const result = await labelsApi.delete(id);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		labels = labels.filter((l) => l.id !== id);

		// Remove from email associations
		const newEmailLabels = new Map(emailLabels);
		for (const [emailId, lbls] of newEmailLabels) {
			newEmailLabels.set(
				emailId,
				lbls.filter((l) => l.id !== id)
			);
		}
		emailLabels = newEmailLabels;

		return true;
	},

	async fetchEmailLabels(emailId: string) {
		const result = await labelsApi.getEmailLabels(emailId);

		if (result.error) {
			error = result.error.message;
			return [];
		}

		const lbls = result.data?.labels || [];
		emailLabels = new Map(emailLabels).set(emailId, lbls);
		return lbls;
	},

	async addLabelsToEmail(emailId: string, labelIds: string[]) {
		const result = await labelsApi.addToEmail(emailId, labelIds);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		// Update local cache
		const currentLabels = emailLabels.get(emailId) || [];
		const newLabels = labels.filter((l) => labelIds.includes(l.id));
		const combined = [
			...currentLabels,
			...newLabels.filter((l) => !currentLabels.some((c) => c.id === l.id)),
		];
		emailLabels = new Map(emailLabels).set(emailId, combined);

		return true;
	},

	async removeLabelsFromEmail(emailId: string, labelIds: string[]) {
		const result = await labelsApi.removeFromEmail(emailId, labelIds);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		// Update local cache
		const currentLabels = emailLabels.get(emailId) || [];
		emailLabels = new Map(emailLabels).set(
			emailId,
			currentLabels.filter((l) => !labelIds.includes(l.id))
		);

		return true;
	},

	async setEmailLabels(emailId: string, labelIds: string[]) {
		const result = await labelsApi.setEmailLabels(emailId, labelIds);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		// Update local cache
		const newLabels = labels.filter((l) => labelIds.includes(l.id));
		emailLabels = new Map(emailLabels).set(emailId, newLabels);

		return true;
	},

	getLabelById(id: string) {
		return labels.find((l) => l.id === id);
	},

	getLabelsByAccount(accountId: string) {
		return labels.filter((l) => l.accountId === accountId || l.accountId === null);
	},
};
