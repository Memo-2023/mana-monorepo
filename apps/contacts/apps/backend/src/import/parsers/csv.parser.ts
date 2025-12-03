import { parse } from 'csv-parse/sync';
import { ParsedContactDto } from '../dto/import.dto';

// Common header variations mapped to our fields
const HEADER_MAPPINGS: Record<string, keyof ParsedContactDto> = {
	// First Name
	'first name': 'firstName',
	first_name: 'firstName',
	firstname: 'firstName',
	'given name': 'firstName',
	given_name: 'firstName',
	vorname: 'firstName',

	// Last Name
	'last name': 'lastName',
	last_name: 'lastName',
	lastname: 'lastName',
	surname: 'lastName',
	'family name': 'lastName',
	family_name: 'lastName',
	nachname: 'lastName',

	// Display Name
	'display name': 'displayName',
	display_name: 'displayName',
	displayname: 'displayName',
	'full name': 'displayName',
	name: 'displayName',
	anzeigename: 'displayName',

	// Nickname
	nickname: 'nickname',
	nick: 'nickname',
	spitzname: 'nickname',

	// Email
	email: 'email',
	'e-mail': 'email',
	'email address': 'email',
	mail: 'email',

	// Phone
	phone: 'phone',
	telephone: 'phone',
	tel: 'phone',
	'phone number': 'phone',
	telefon: 'phone',

	// Mobile
	mobile: 'mobile',
	'mobile phone': 'mobile',
	cell: 'mobile',
	'cell phone': 'mobile',
	cellphone: 'mobile',
	handy: 'mobile',
	mobil: 'mobile',

	// Street
	street: 'street',
	'street address': 'street',
	address: 'street',
	strasse: 'street',
	straße: 'street',

	// City
	city: 'city',
	town: 'city',
	stadt: 'city',
	ort: 'city',

	// Postal Code
	'postal code': 'postalCode',
	postal_code: 'postalCode',
	postalcode: 'postalCode',
	zip: 'postalCode',
	'zip code': 'postalCode',
	zipcode: 'postalCode',
	plz: 'postalCode',
	postleitzahl: 'postalCode',

	// Country
	country: 'country',
	land: 'country',

	// Company
	company: 'company',
	organization: 'company',
	organisation: 'company',
	org: 'company',
	firma: 'company',
	unternehmen: 'company',

	// Job Title
	'job title': 'jobTitle',
	job_title: 'jobTitle',
	jobtitle: 'jobTitle',
	title: 'jobTitle',
	position: 'jobTitle',
	rolle: 'jobTitle',

	// Department
	department: 'department',
	dept: 'department',
	abteilung: 'department',

	// Website
	website: 'website',
	url: 'website',
	'web site': 'website',
	homepage: 'website',
	webseite: 'website',

	// Birthday
	birthday: 'birthday',
	'birth date': 'birthday',
	birthdate: 'birthday',
	dob: 'birthday',
	geburtstag: 'birthday',
	geburtsdatum: 'birthday',

	// Notes
	notes: 'notes',
	note: 'notes',
	comments: 'notes',
	comment: 'notes',
	notizen: 'notes',
	bemerkungen: 'notes',
};

export interface CsvFieldMapping {
	csvHeader: string;
	contactField: keyof ParsedContactDto | null;
	sampleValue: string;
}

export class CsvParser {
	/**
	 * Parse CSV content into contacts
	 */
	parse(content: string): {
		contacts: ParsedContactDto[];
		errors: string[];
		fieldMapping: CsvFieldMapping[];
	} {
		const errors: string[] = [];
		let records: Record<string, string>[];

		try {
			records = parse(content, {
				columns: true,
				skip_empty_lines: true,
				trim: true,
				bom: true,
				relaxColumnCount: true,
				relaxQuotes: true,
			});
		} catch (error) {
			errors.push(`CSV parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
			return { contacts: [], errors, fieldMapping: [] };
		}

		if (records.length === 0) {
			return { contacts: [], errors: ['CSV file is empty'], fieldMapping: [] };
		}

		// Detect field mapping from headers
		const headers = Object.keys(records[0]);
		const fieldMapping = this.detectFieldMapping(headers, records[0]);

		// Parse contacts
		const contacts: ParsedContactDto[] = [];

		for (let i = 0; i < records.length; i++) {
			try {
				const contact = this.mapRecordToContact(records[i], fieldMapping);
				if (
					contact &&
					(contact.firstName || contact.lastName || contact.email || contact.displayName)
				) {
					contacts.push(contact);
				}
			} catch (error) {
				errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
			}
		}

		return { contacts, errors, fieldMapping };
	}

	/**
	 * Detect field mapping based on header names
	 */
	private detectFieldMapping(
		headers: string[],
		sampleRecord: Record<string, string>
	): CsvFieldMapping[] {
		return headers.map((header) => {
			const normalizedHeader = header.toLowerCase().trim();
			const contactField = HEADER_MAPPINGS[normalizedHeader] || null;

			return {
				csvHeader: header,
				contactField,
				sampleValue: sampleRecord[header] || '',
			};
		});
	}

	/**
	 * Map a CSV record to a ParsedContactDto
	 */
	private mapRecordToContact(
		record: Record<string, string>,
		fieldMapping: CsvFieldMapping[]
	): ParsedContactDto | null {
		const contact: ParsedContactDto = {};

		for (const mapping of fieldMapping) {
			if (!mapping.contactField) continue;

			const value = record[mapping.csvHeader]?.trim();
			if (!value) continue;

			// Special handling for birthday
			if (mapping.contactField === 'birthday') {
				contact.birthday = this.parseBirthday(value);
			} else {
				contact[mapping.contactField] = value;
			}
		}

		// Generate displayName if not set
		if (!contact.displayName && (contact.firstName || contact.lastName)) {
			contact.displayName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}

		return contact;
	}

	/**
	 * Parse various birthday formats to ISO format
	 */
	private parseBirthday(value: string): string | undefined {
		// Try common formats
		const formats = [
			/^(\d{4})-(\d{2})-(\d{2})$/, // ISO: 2000-01-15
			/^(\d{2})\/(\d{2})\/(\d{4})$/, // US: 01/15/2000
			/^(\d{2})\.(\d{2})\.(\d{4})$/, // EU: 15.01.2000
			/^(\d{2})-(\d{2})-(\d{4})$/, // Alt: 15-01-2000
		];

		// ISO format
		if (formats[0].test(value)) {
			return value;
		}

		// US format MM/DD/YYYY
		const usMatch = value.match(formats[1]);
		if (usMatch) {
			return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;
		}

		// EU format DD.MM.YYYY or DD-MM-YYYY
		const euMatch = value.match(formats[2]) || value.match(formats[3]);
		if (euMatch) {
			return `${euMatch[3]}-${euMatch[2]}-${euMatch[1]}`;
		}

		return undefined;
	}

	/**
	 * Generate a CSV template with all supported fields
	 */
	static generateTemplate(): string {
		const headers = [
			'First Name',
			'Last Name',
			'Display Name',
			'Nickname',
			'Email',
			'Phone',
			'Mobile',
			'Street',
			'City',
			'Postal Code',
			'Country',
			'Company',
			'Job Title',
			'Department',
			'Website',
			'Birthday',
			'Notes',
		];

		const sampleRow = [
			'Max',
			'Mustermann',
			'Max Mustermann',
			'Maxi',
			'max@example.com',
			'+49 123 456789',
			'+49 170 1234567',
			'Musterstraße 1',
			'Berlin',
			'10115',
			'Germany',
			'Musterfirma GmbH',
			'Software Engineer',
			'Engineering',
			'https://example.com',
			'1990-01-15',
			'Example contact',
		];

		return [headers.join(','), sampleRow.join(',')].join('\n');
	}
}
