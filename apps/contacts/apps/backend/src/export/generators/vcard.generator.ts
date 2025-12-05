import { Contact } from '../../db/schema/contacts.schema';

/**
 * Generates vCard 3.0 format
 * Reference: https://www.rfc-editor.org/rfc/rfc2426
 */
export function generateVCard(contact: Contact): string {
	const lines: string[] = [];

	lines.push('BEGIN:VCARD');
	lines.push('VERSION:3.0');

	// Name
	const lastName = contact.lastName || '';
	const firstName = contact.firstName || '';
	lines.push(`N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`);

	// Full name
	const fn =
		contact.displayName || [firstName, lastName].filter(Boolean).join(' ') || 'Unnamed Contact';
	lines.push(`FN:${escapeVCardValue(fn)}`);

	// Nickname
	if (contact.nickname) {
		lines.push(`NICKNAME:${escapeVCardValue(contact.nickname)}`);
	}

	// Organization
	if (contact.company || contact.department) {
		const org = [contact.company, contact.department].filter(Boolean).join(';');
		lines.push(`ORG:${escapeVCardValue(org)}`);
	}

	// Job Title
	if (contact.jobTitle) {
		lines.push(`TITLE:${escapeVCardValue(contact.jobTitle)}`);
	}

	// Email
	if (contact.email) {
		lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(contact.email)}`);
	}

	// Phone
	if (contact.phone) {
		lines.push(`TEL;TYPE=WORK:${escapeVCardValue(contact.phone)}`);
	}

	// Mobile
	if (contact.mobile) {
		lines.push(`TEL;TYPE=CELL:${escapeVCardValue(contact.mobile)}`);
	}

	// Address
	if (contact.street || contact.city || contact.postalCode || contact.country) {
		const adr = [
			'', // PO Box
			'', // Extended address
			contact.street || '',
			contact.city || '',
			'', // Region
			contact.postalCode || '',
			contact.country || '',
		]
			.map(escapeVCardValue)
			.join(';');
		lines.push(`ADR;TYPE=HOME:${adr}`);
	}

	// Website
	if (contact.website) {
		lines.push(`URL:${escapeVCardValue(contact.website)}`);
	}

	// Birthday
	if (contact.birthday) {
		// Format: YYYYMMDD - birthday is stored as string (date type in DB)
		const bday = String(contact.birthday).replace(/-/g, '');
		lines.push(`BDAY:${bday}`);
	}

	// Notes
	if (contact.notes) {
		lines.push(`NOTE:${escapeVCardValue(contact.notes)}`);
	}

	// Photo URL
	if (contact.photoUrl) {
		lines.push(`PHOTO;VALUE=URI:${escapeVCardValue(contact.photoUrl)}`);
	}

	// UID
	lines.push(`UID:${contact.id}`);

	// Revision timestamp
	const rev = contact.updatedAt?.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
	lines.push(`REV:${rev}`);

	lines.push('END:VCARD');

	return lines.join('\r\n');
}

/**
 * Generate multiple vCards as a single file
 */
export function generateVCardFile(contacts: Contact[]): string {
	return contacts.map((contact) => generateVCard(contact)).join('\r\n');
}

/**
 * Escape special characters for vCard values
 */
function escapeVCardValue(value: string): string {
	if (!value) return '';

	return value
		.replace(/\\/g, '\\\\') // Escape backslashes first
		.replace(/;/g, '\\;') // Escape semicolons
		.replace(/,/g, '\\,') // Escape commas
		.replace(/\n/g, '\\n'); // Escape newlines
}
