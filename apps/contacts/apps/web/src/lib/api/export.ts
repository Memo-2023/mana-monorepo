import { authStore } from '$lib/stores/auth.svelte';

const API_BASE = 'http://localhost:3015/api/v1';

export type ExportFormat = 'vcard' | 'csv';

export interface ExportOptions {
	format: ExportFormat;
	contactIds?: string[];
	groupId?: string;
	tagId?: string;
	includeFavorites?: boolean;
	includeArchived?: boolean;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
	const token = await authStore.getAccessToken();

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	return fetch(`${API_BASE}${url}`, {
		...options,
		headers,
	});
}

export const exportApi = {
	/**
	 * Export contacts with options
	 */
	async exportContacts(options: ExportOptions): Promise<void> {
		const response = await fetchWithAuth('/export', {
			method: 'POST',
			body: JSON.stringify(options),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Export failed' }));
			throw new Error(error.message || 'Export failed');
		}

		// Get filename from Content-Disposition header
		const contentDisposition = response.headers.get('Content-Disposition');
		const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
		const filename = filenameMatch
			? filenameMatch[1]
			: `contacts.${options.format === 'vcard' ? 'vcf' : 'csv'}`;

		// Get the blob and trigger download
		const blob = await response.blob();
		downloadBlob(blob, filename);

		// Return contact count from header
		const contactCount = response.headers.get('X-Contact-Count');
		return;
	},

	/**
	 * Quick export all contacts
	 */
	async quickExport(format: ExportFormat = 'vcard'): Promise<void> {
		const response = await fetchWithAuth(`/export?format=${format}`);

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Export failed' }));
			throw new Error(error.message || 'Export failed');
		}

		// Get filename from Content-Disposition header
		const contentDisposition = response.headers.get('Content-Disposition');
		const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
		const filename = filenameMatch
			? filenameMatch[1]
			: `contacts.${format === 'vcard' ? 'vcf' : 'csv'}`;

		// Get the blob and trigger download
		const blob = await response.blob();
		downloadBlob(blob, filename);
	},
};

/**
 * Helper to trigger file download
 */
function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
