import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import {
	Contact,
	ContactBirthday,
	ContactsModuleOptions,
	CONTACTS_MODULE_OPTIONS,
	DEFAULT_CONTACTS_API_URL,
} from './types';

/**
 * Contacts API Service
 *
 * Connects to the contacts-backend API for contact management.
 * Used by the morning summary to show birthdays.
 *
 * @example
 * ```typescript
 * // Get today's birthdays (requires JWT token)
 * const birthdays = await contactsApiService.getBirthdaysToday(token);
 *
 * // Get all contacts
 * const contacts = await contactsApiService.getContacts(token);
 * ```
 */
@Injectable()
export class ContactsApiService {
	private readonly logger = new Logger(ContactsApiService.name);
	private readonly baseUrl: string;

	constructor(@Optional() @Inject(CONTACTS_MODULE_OPTIONS) options?: ContactsModuleOptions) {
		this.baseUrl = options?.apiUrl || DEFAULT_CONTACTS_API_URL;
		this.logger.log(`Contacts API Service initialized with URL: ${this.baseUrl}`);
	}

	/**
	 * Get today's birthdays
	 * Uses the dedicated /contacts/birthdays endpoint and filters for today
	 */
	async getBirthdaysToday(token: string): Promise<ContactBirthday[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/contacts/birthdays`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as ContactBirthday[];

			// Filter for today's birthdays
			const today = new Date();
			const todayMonth = today.getMonth() + 1;
			const todayDay = today.getDate();

			return data
				.filter((contact) => {
					if (!contact.birthday) return false;
					const [, month, day] = contact.birthday.split('-').map(Number);
					return month === todayMonth && day === todayDay;
				})
				.map((contact) => ({
					...contact,
					age: this.calculateAge(contact.birthday),
				}));
		} catch (error) {
			this.logger.error('Failed to get birthdays today:', error);
			return [];
		}
	}

	/**
	 * Get upcoming birthdays (next 7 days)
	 */
	async getUpcomingBirthdays(token: string, days = 7): Promise<ContactBirthday[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/contacts/birthdays`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as ContactBirthday[];

			// Filter for upcoming birthdays
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const endDate = new Date(today);
			endDate.setDate(endDate.getDate() + days);

			return data
				.filter((contact) => {
					if (!contact.birthday) return false;

					// Create this year's birthday date
					const [_year, month, day] = contact.birthday.split('-').map(Number);
					const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);

					// If birthday already passed this year, check next year
					if (birthdayThisYear < today) {
						birthdayThisYear.setFullYear(today.getFullYear() + 1);
					}

					return birthdayThisYear >= today && birthdayThisYear <= endDate;
				})
				.map((contact) => ({
					...contact,
					age: this.calculateAge(contact.birthday),
				}));
		} catch (error) {
			this.logger.error('Failed to get upcoming birthdays:', error);
			return [];
		}
	}

	/**
	 * Get all contacts
	 */
	async getContacts(
		token: string,
		options?: { limit?: number; search?: string }
	): Promise<Contact[]> {
		try {
			const params = new URLSearchParams();
			if (options?.limit) params.append('limit', String(options.limit));
			if (options?.search) params.append('search', options.search);

			const queryString = params.toString();
			const url = queryString
				? `${this.baseUrl}/api/v1/contacts?${queryString}`
				: `${this.baseUrl}/api/v1/contacts`;

			const response = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { contacts?: Contact[] };
			return data.contacts || [];
		} catch (error) {
			this.logger.error('Failed to get contacts:', error);
			return [];
		}
	}

	/**
	 * Get a single contact by ID
	 */
	async getContact(token: string, contactId: string): Promise<Contact | null> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/contacts/${contactId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			return (await response.json()) as Contact;
		} catch (error) {
			this.logger.error(`Failed to get contact ${contactId}:`, error);
			return null;
		}
	}

	/**
	 * Format birthdays for display
	 */
	formatBirthdays(birthdays: ContactBirthday[]): string {
		if (birthdays.length === 0) {
			return '';
		}

		const lines: string[] = ['**Geburtstage** 🎂'];

		for (const contact of birthdays) {
			const name = contact.displayName || `${contact.firstName} ${contact.lastName}`.trim();
			const ageText = contact.age ? ` wird ${contact.age}` : '';
			lines.push(`• ${name}${ageText}`);
		}

		return lines.join('\n');
	}

	/**
	 * Calculate age from birthday string (YYYY-MM-DD)
	 */
	private calculateAge(birthday: string): number | undefined {
		const [year] = birthday.split('-').map(Number);
		if (!year || year < 1900) return undefined;

		const today = new Date();
		const birthDate = new Date(birthday);
		let age = today.getFullYear() - birthDate.getFullYear();

		// Adjust if birthday hasn't occurred this year
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}

		// Return next age (what they will be turning)
		return age + 1;
	}
}
