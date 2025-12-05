import { authStore } from '$lib/stores/auth.svelte';

const API_BASE = 'http://localhost:3015/api/v1';

export interface ParsedContact {
	firstName?: string;
	lastName?: string;
	displayName?: string;
	nickname?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	street?: string;
	city?: string;
	postalCode?: string;
	country?: string;
	company?: string;
	jobTitle?: string;
	department?: string;
	website?: string;
	birthday?: string;
	notes?: string;
	photoUrl?: string;
}

export interface DuplicateInfo {
	importIndex: number;
	existingContactId: string;
	existingContactName: string;
	matchField: 'email' | 'phone';
	matchValue: string;
}

export interface CsvFieldMapping {
	csvHeader: string;
	contactField: keyof ParsedContact | null;
	sampleValue: string;
}

export interface ImportPreviewResponse {
	contacts: ParsedContact[];
	duplicates: DuplicateInfo[];
	totalParsed: number;
	validCount: number;
	invalidCount: number;
	errors: string[];
	fieldMapping?: CsvFieldMapping[];
}

export interface ImportError {
	index: number;
	contactName: string;
	error: string;
}

export interface ImportResult {
	imported: number;
	skipped: number;
	merged: number;
	errors: ImportError[];
}

export type DuplicateAction = 'skip' | 'merge' | 'create';

export const importApi = {
	/**
	 * Preview import from uploaded file
	 */
	async preview(file: File): Promise<ImportPreviewResponse> {
		const token = await authStore.getAccessToken();

		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch(`${API_BASE}/import/preview`, {
			method: 'POST',
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Upload failed' }));
			throw new Error(error.message || 'Upload failed');
		}

		return response.json();
	},

	/**
	 * Execute the import
	 */
	async execute(
		contacts: ParsedContact[],
		duplicateAction: DuplicateAction,
		skipIndices?: number[]
	): Promise<ImportResult> {
		const token = await authStore.getAccessToken();

		const response = await fetch(`${API_BASE}/import/execute`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				contacts,
				duplicateAction,
				skipIndices,
			}),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Import failed' }));
			throw new Error(error.message || 'Import failed');
		}

		return response.json();
	},

	/**
	 * Get CSV template download URL
	 */
	getTemplateUrl(): string {
		return `${API_BASE}/import/template/csv`;
	},

	/**
	 * Download CSV template
	 */
	async downloadTemplate(): Promise<void> {
		const token = await authStore.getAccessToken();

		const response = await fetch(`${API_BASE}/import/template/csv`, {
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

		if (!response.ok) {
			throw new Error('Failed to download template');
		}

		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'contacts-template.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	},
};
