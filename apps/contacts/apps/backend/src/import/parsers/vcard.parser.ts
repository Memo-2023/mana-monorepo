import { ParsedContactDto } from '../dto/import.dto';

interface VCardProperty {
	name: string;
	params: Record<string, string>;
	value: string;
}

export class VCardParser {
	/**
	 * Parse vCard content (supports v2.1, v3.0, v4.0)
	 */
	parse(content: string): { contacts: ParsedContactDto[]; errors: string[] } {
		const contacts: ParsedContactDto[] = [];
		const errors: string[] = [];

		// Normalize line endings and unfold long lines
		const normalizedContent = this.unfoldLines(content.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));

		// Split into individual vCards
		const vcardBlocks = this.splitVCards(normalizedContent);

		for (let i = 0; i < vcardBlocks.length; i++) {
			try {
				const contact = this.parseVCard(vcardBlocks[i]);
				if (
					contact &&
					(contact.firstName || contact.lastName || contact.email || contact.displayName)
				) {
					contacts.push(contact);
				}
			} catch (error) {
				errors.push(`vCard ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
			}
		}

		return { contacts, errors };
	}

	private unfoldLines(content: string): string {
		// RFC 2425: Long lines are folded by inserting CRLF + whitespace
		return content.replace(/\n[ \t]/g, '');
	}

	private splitVCards(content: string): string[] {
		const vcards: string[] = [];
		const regex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
		let match;

		while ((match = regex.exec(content)) !== null) {
			vcards.push(match[0]);
		}

		return vcards;
	}

	private parseVCard(vcardContent: string): ParsedContactDto | null {
		const lines = vcardContent.split('\n').filter((line) => line.trim() !== '');
		const properties: VCardProperty[] = [];

		for (const line of lines) {
			if (line.startsWith('BEGIN:') || line.startsWith('END:') || line.startsWith('VERSION:')) {
				continue;
			}

			const property = this.parseLine(line);
			if (property) {
				properties.push(property);
			}
		}

		return this.mapToContact(properties);
	}

	private parseLine(line: string): VCardProperty | null {
		// Format: NAME;PARAM1=VALUE1;PARAM2=VALUE2:value
		const colonIndex = line.indexOf(':');
		if (colonIndex === -1) return null;

		const nameAndParams = line.substring(0, colonIndex);
		const value = line.substring(colonIndex + 1);

		const parts = nameAndParams.split(';');
		const name = parts[0].toUpperCase();
		const params: Record<string, string> = {};

		for (let i = 1; i < parts.length; i++) {
			const paramPart = parts[i];
			const equalIndex = paramPart.indexOf('=');
			if (equalIndex !== -1) {
				const paramName = paramPart.substring(0, equalIndex).toUpperCase();
				const paramValue = paramPart.substring(equalIndex + 1);
				params[paramName] = paramValue;
			} else {
				// Handle vCard 2.1 style params without =
				params[paramPart.toUpperCase()] = 'true';
			}
		}

		return { name, params, value: this.decodeValue(value, params) };
	}

	private decodeValue(value: string, params: Record<string, string>): string {
		// Handle quoted-printable encoding (common in vCard 2.1)
		if (params['ENCODING'] === 'QUOTED-PRINTABLE') {
			return this.decodeQuotedPrintable(value);
		}

		// Handle escaped characters
		return value
			.replace(/\\n/gi, '\n')
			.replace(/\\,/g, ',')
			.replace(/\\;/g, ';')
			.replace(/\\\\/g, '\\');
	}

	private decodeQuotedPrintable(str: string): string {
		return str.replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
	}

	private mapToContact(properties: VCardProperty[]): ParsedContactDto {
		const contact: ParsedContactDto = {};

		for (const prop of properties) {
			switch (prop.name) {
				case 'N':
					this.parseName(prop.value, contact);
					break;

				case 'FN':
					contact.displayName = prop.value;
					break;

				case 'NICKNAME':
					contact.nickname = prop.value;
					break;

				case 'EMAIL':
					if (!contact.email) {
						contact.email = prop.value;
					}
					break;

				case 'TEL':
					this.parsePhone(prop, contact);
					break;

				case 'ADR':
					this.parseAddress(prop.value, contact);
					break;

				case 'ORG':
					this.parseOrganization(prop.value, contact);
					break;

				case 'TITLE':
					contact.jobTitle = prop.value;
					break;

				case 'URL':
					if (!contact.website) {
						contact.website = prop.value;
					}
					break;

				case 'BDAY':
					contact.birthday = this.parseBirthday(prop.value);
					break;

				case 'NOTE':
					contact.notes = prop.value;
					break;

				case 'PHOTO':
					// Only store URL references, not base64 data
					if (prop.params['VALUE'] === 'URI' || prop.value.startsWith('http')) {
						contact.photoUrl = prop.value;
					}
					break;
			}
		}

		// Generate displayName if not set
		if (!contact.displayName && (contact.firstName || contact.lastName)) {
			contact.displayName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}

		return contact;
	}

	private parseName(value: string, contact: ParsedContactDto): void {
		// N:LastName;FirstName;MiddleName;Prefix;Suffix
		const parts = value.split(';');
		if (parts[0]) contact.lastName = parts[0];
		if (parts[1]) contact.firstName = parts[1];
	}

	private parsePhone(prop: VCardProperty, contact: ParsedContactDto): void {
		const typeStr = (prop.params['TYPE'] || '').toUpperCase();

		if (typeStr.includes('CELL') || typeStr.includes('MOBILE')) {
			if (!contact.mobile) {
				contact.mobile = prop.value;
			}
		} else {
			if (!contact.phone) {
				contact.phone = prop.value;
			}
		}
	}

	private parseAddress(value: string, contact: ParsedContactDto): void {
		// ADR:POBox;Extended;Street;City;State;PostalCode;Country
		const parts = value.split(';');
		if (parts[2]) contact.street = parts[2];
		if (parts[3]) contact.city = parts[3];
		// parts[4] is state/region - we could append to city
		if (parts[5]) contact.postalCode = parts[5];
		if (parts[6]) contact.country = parts[6];
	}

	private parseOrganization(value: string, contact: ParsedContactDto): void {
		// ORG:Company;Department
		const parts = value.split(';');
		if (parts[0]) contact.company = parts[0];
		if (parts[1]) contact.department = parts[1];
	}

	private parseBirthday(value: string): string | undefined {
		// Handle various formats: YYYY-MM-DD, YYYYMMDD, --MMDD
		const cleaned = value.replace(/-/g, '');

		if (cleaned.length === 8) {
			const year = cleaned.substring(0, 4);
			const month = cleaned.substring(4, 6);
			const day = cleaned.substring(6, 8);
			return `${year}-${month}-${day}`;
		}

		// Already in ISO format
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return value;
		}

		return undefined;
	}
}
