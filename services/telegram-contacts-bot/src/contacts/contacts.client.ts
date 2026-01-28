import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Contact {
	id: string;
	firstName: string | null;
	lastName: string | null;
	displayName: string | null;
	nickname: string | null;
	email: string | null;
	phone: string | null;
	mobile: string | null;
	company: string | null;
	jobTitle: string | null;
	street: string | null;
	city: string | null;
	postalCode: string | null;
	country: string | null;
	website: string | null;
	birthday: string | null;
	notes: string | null;
	photoUrl: string | null;
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
	tags?: ContactTag[];
}

export interface ContactTag {
	id: string;
	name: string;
	color: string | null;
}

export interface ContactNote {
	id: string;
	content: string;
	isPinned: boolean;
	createdAt: string;
}

export interface ContactStats {
	totalContacts: number;
	favorites: number;
	withBirthday: number;
	recentlyAdded: number;
	tagCount: number;
}

@Injectable()
export class ContactsClient {
	private readonly logger = new Logger(ContactsClient.name);
	private readonly apiUrl: string;

	constructor(private configService: ConfigService) {
		this.apiUrl = this.configService.get<string>('contacts.apiUrl') || 'http://localhost:3015';
	}

	/**
	 * Make authenticated API request
	 */
	private async request<T>(
		endpoint: string,
		accessToken: string,
		options: RequestInit = {}
	): Promise<T | null> {
		try {
			const response = await fetch(`${this.apiUrl}${endpoint}`, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				this.logger.error(`API error: ${response.status} ${response.statusText}`);
				return null;
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Request failed: ${error}`);
			return null;
		}
	}

	/**
	 * Search contacts by name, email, phone, or company
	 */
	async searchContacts(accessToken: string, query: string): Promise<Contact[]> {
		const result = await this.request<{ contacts: Contact[] }>(
			`/api/v1/contacts?search=${encodeURIComponent(query)}&limit=10`,
			accessToken
		);
		return result?.contacts || [];
	}

	/**
	 * Get all contacts
	 */
	async getAllContacts(accessToken: string, limit = 100): Promise<Contact[]> {
		const result = await this.request<{ contacts: Contact[] }>(
			`/api/v1/contacts?limit=${limit}`,
			accessToken
		);
		return result?.contacts || [];
	}

	/**
	 * Get favorite contacts
	 */
	async getFavorites(accessToken: string): Promise<Contact[]> {
		const result = await this.request<{ contacts: Contact[] }>(
			'/api/v1/contacts?favorite=true&limit=20',
			accessToken
		);
		return result?.contacts || [];
	}

	/**
	 * Get recently added contacts
	 */
	async getRecentContacts(accessToken: string, limit = 10): Promise<Contact[]> {
		const result = await this.request<{ contacts: Contact[] }>(
			`/api/v1/contacts?sort=created_at&order=desc&limit=${limit}`,
			accessToken
		);
		return result?.contacts || [];
	}

	/**
	 * Get contact by ID
	 */
	async getContact(accessToken: string, contactId: string): Promise<Contact | null> {
		return await this.request<Contact>(`/api/v1/contacts/${contactId}`, accessToken);
	}

	/**
	 * Get contacts with upcoming birthdays
	 */
	async getUpcomingBirthdays(accessToken: string, daysAhead = 30): Promise<Contact[]> {
		// Get all contacts and filter by birthday
		const result = await this.request<{ contacts: Contact[] }>(
			'/api/v1/contacts?limit=500',
			accessToken
		);

		if (!result?.contacts) return [];

		const today = new Date();
		const upcoming: Array<{ contact: Contact; daysUntil: number }> = [];

		for (const contact of result.contacts) {
			if (!contact.birthday) continue;

			const birthday = new Date(contact.birthday);
			const thisYearBirthday = new Date(
				today.getFullYear(),
				birthday.getMonth(),
				birthday.getDate()
			);

			// If birthday already passed this year, check next year
			if (thisYearBirthday < today) {
				thisYearBirthday.setFullYear(today.getFullYear() + 1);
			}

			const daysUntil = Math.ceil(
				(thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (daysUntil <= daysAhead) {
				upcoming.push({ contact, daysUntil });
			}
		}

		// Sort by days until birthday
		upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

		return upcoming.map((u) => u.contact);
	}

	/**
	 * Get all tags
	 */
	async getTags(accessToken: string): Promise<ContactTag[]> {
		const result = await this.request<ContactTag[]>('/api/v1/tags', accessToken);
		return result || [];
	}

	/**
	 * Get contacts by tag
	 */
	async getContactsByTag(accessToken: string, tagId: string): Promise<Contact[]> {
		const result = await this.request<{ contacts: Contact[] }>(
			`/api/v1/contacts?tag=${tagId}&limit=50`,
			accessToken
		);
		return result?.contacts || [];
	}

	/**
	 * Create a new contact
	 */
	async createContact(
		accessToken: string,
		data: {
			firstName?: string;
			lastName?: string;
			email?: string;
			phone?: string;
			mobile?: string;
			company?: string;
			notes?: string;
		}
	): Promise<Contact | null> {
		return await this.request<Contact>('/api/v1/contacts', accessToken, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	/**
	 * Add note to contact
	 */
	async addNote(
		accessToken: string,
		contactId: string,
		content: string
	): Promise<ContactNote | null> {
		return await this.request<ContactNote>(`/api/v1/contacts/${contactId}/notes`, accessToken, {
			method: 'POST',
			body: JSON.stringify({ content }),
		});
	}

	/**
	 * Log activity for contact
	 */
	async logActivity(
		accessToken: string,
		contactId: string,
		activityType: string,
		description?: string
	): Promise<boolean> {
		const result = await this.request<{ id: string }>(
			`/api/v1/contacts/${contactId}/activities`,
			accessToken,
			{
				method: 'POST',
				body: JSON.stringify({ activityType, description }),
			}
		);
		return result !== null;
	}

	/**
	 * Toggle favorite status
	 */
	async toggleFavorite(accessToken: string, contactId: string): Promise<boolean> {
		const result = await this.request<Contact>(
			`/api/v1/contacts/${contactId}/favorite`,
			accessToken,
			{ method: 'POST' }
		);
		return result !== null;
	}

	/**
	 * Get contact statistics
	 */
	async getStats(accessToken: string): Promise<ContactStats> {
		const [contacts, favorites, tags] = await Promise.all([
			this.getAllContacts(accessToken, 500),
			this.getFavorites(accessToken),
			this.getTags(accessToken),
		]);

		const now = new Date();
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		return {
			totalContacts: contacts.length,
			favorites: favorites.length,
			withBirthday: contacts.filter((c) => c.birthday).length,
			recentlyAdded: contacts.filter((c) => new Date(c.createdAt) > weekAgo).length,
			tagCount: tags.length,
		};
	}
}
