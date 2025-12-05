import { Contact } from '../../db/schema/contacts.schema';

/**
 * CSV column configuration
 */
const CSV_COLUMNS = [
	{ key: 'firstName', header: 'First Name' },
	{ key: 'lastName', header: 'Last Name' },
	{ key: 'displayName', header: 'Display Name' },
	{ key: 'nickname', header: 'Nickname' },
	{ key: 'email', header: 'Email' },
	{ key: 'phone', header: 'Phone' },
	{ key: 'mobile', header: 'Mobile' },
	{ key: 'company', header: 'Company' },
	{ key: 'jobTitle', header: 'Job Title' },
	{ key: 'department', header: 'Department' },
	{ key: 'street', header: 'Street' },
	{ key: 'city', header: 'City' },
	{ key: 'postalCode', header: 'Postal Code' },
	{ key: 'country', header: 'Country' },
	{ key: 'website', header: 'Website' },
	{ key: 'birthday', header: 'Birthday' },
	{ key: 'notes', header: 'Notes' },
] as const;

/**
 * Generate CSV file from contacts
 */
export function generateCsvFile(contacts: Contact[]): string {
	const lines: string[] = [];

	// Header row
	const headers = CSV_COLUMNS.map((col) => col.header);
	lines.push(headers.join(','));

	// Data rows
	for (const contact of contacts) {
		const row = CSV_COLUMNS.map((col) => {
			const value = contact[col.key as keyof Contact];
			return escapeCsvValue(formatValue(value));
		});
		lines.push(row.join(','));
	}

	return lines.join('\r\n');
}

/**
 * Format a value for CSV output
 */
function formatValue(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}

	if (value instanceof Date) {
		return value.toISOString().slice(0, 10); // YYYY-MM-DD
	}

	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}

	if (typeof value === 'object') {
		return JSON.stringify(value);
	}

	return String(value);
}

/**
 * Escape a value for CSV (RFC 4180)
 */
function escapeCsvValue(value: string): string {
	if (!value) {
		return '';
	}

	// If the value contains comma, quote, or newline, wrap in quotes and escape quotes
	if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
		return `"${value.replace(/"/g, '""')}"`;
	}

	return value;
}
