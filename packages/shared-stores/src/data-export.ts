/**
 * Data Export/Import Utilities
 *
 * Generic functions for exporting IndexedDB data to JSON/CSV
 * and importing from JSON. Works with any Dexie table.
 *
 * @example
 * ```typescript
 * import { exportToJSON, exportToCSV, importFromJSON, downloadFile } from '@mana/shared-stores';
 * import { db } from '$lib/data/database';
 *
 * // Export contacts as JSON
 * const data = await exportToJSON(db.table('contacts'));
 * downloadFile(data, 'contacts.json', 'application/json');
 *
 * // Export time entries as CSV
 * const csv = await exportToCSV(db.table('timeEntries'), {
 *   columns: ['date', 'description', 'duration'],
 *   headers: ['Datum', 'Beschreibung', 'Dauer'],
 * });
 * downloadFile(csv, 'entries.csv', 'text/csv');
 *
 * // Import from JSON file
 * const file = inputElement.files[0];
 * const count = await importFromJSON(db.table('contacts'), file);
 * ```
 */

import type { Table } from 'dexie';

// ─── Export to JSON ───────────────────────────────────────

export interface ExportJSONOptions {
	/** Filter records before export (e.g., exclude deleted) */
	filter?: (record: Record<string, unknown>) => boolean;
	/** Pretty-print with indentation (default: true) */
	pretty?: boolean;
}

/** Export all records from a Dexie table as a JSON string. */
export async function exportToJSON(table: Table, options?: ExportJSONOptions): Promise<string> {
	let records = await table.toArray();
	if (options?.filter) {
		records = records.filter(options.filter);
	}
	return JSON.stringify(records, null, options?.pretty !== false ? 2 : undefined);
}

// ─── Export to CSV ────────────────────────────────────────

export interface ExportCSVOptions {
	/** Column keys to include (default: all keys from first record) */
	columns?: string[];
	/** Display headers (default: same as columns) */
	headers?: string[];
	/** Filter records before export */
	filter?: (record: Record<string, unknown>) => boolean;
	/** Column separator (default: ';' for Excel compat) */
	separator?: string;
	/** Format a cell value (default: auto-quote strings with separator) */
	formatCell?: (value: unknown, key: string) => string;
}

/** Export all records from a Dexie table as a CSV string. */
export async function exportToCSV(table: Table, options?: ExportCSVOptions): Promise<string> {
	let records: Record<string, unknown>[] = await table.toArray();
	if (options?.filter) {
		records = records.filter(options.filter);
	}
	if (records.length === 0) return '';

	const sep = options?.separator ?? ';';
	const columns = options?.columns ?? Object.keys(records[0]);
	const headers = options?.headers ?? columns;

	const formatCell =
		options?.formatCell ??
		((value: unknown, _key: string) => {
			if (value === null || value === undefined) return '';
			const str = String(value);
			if (str.includes(sep) || str.includes('"') || str.includes('\n')) {
				return `"${str.replace(/"/g, '""')}"`;
			}
			return str;
		});

	const rows = records.map((record) =>
		columns.map((col) => formatCell(record[col], col)).join(sep)
	);

	const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
	return BOM + [headers.join(sep), ...rows].join('\n');
}

// ─── Import from JSON ─────────────────────────────────────

export interface ImportJSONOptions {
	/** Transform each record before inserting */
	transform?: (record: Record<string, unknown>) => Record<string, unknown>;
	/** Generate new IDs for imported records (default: true) */
	newIds?: boolean;
	/** Clear table before import (default: false) */
	clearFirst?: boolean;
}

/** Import records from a JSON file into a Dexie table. Returns count of imported records. */
export async function importFromJSON(
	table: Table,
	file: File,
	options?: ImportJSONOptions
): Promise<number> {
	const text = await file.text();
	let records: Record<string, unknown>[] = JSON.parse(text);

	if (!Array.isArray(records)) {
		throw new Error('JSON must contain an array of records');
	}

	if (options?.transform) {
		records = records.map(options.transform);
	}

	if (options?.newIds !== false) {
		records = records.map((r) => ({ ...r, id: crypto.randomUUID() }));
	}

	if (options?.clearFirst) {
		await table.clear();
	}

	await table.bulkAdd(records);
	return records.length;
}

// ─── File Download Trigger ────────────────────────────────

/** Trigger a browser file download from a string. */
export function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/** Generate a timestamped filename. */
export function timestampedFilename(prefix: string, ext: string): string {
	return `${prefix}-${new Date().toISOString().split('T')[0]}.${ext}`;
}
