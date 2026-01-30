import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Contact {
	id: string;
	firstName?: string | null;
	lastName?: string | null;
	displayName?: string | null;
	nickname?: string | null;
	email?: string | null;
	phone?: string | null;
	mobile?: string | null;
	street?: string | null;
	city?: string | null;
	postalCode?: string | null;
	country?: string | null;
	company?: string | null;
	jobTitle?: string | null;
	department?: string | null;
	website?: string | null;
	birthday?: string | null;
	notes?: string | null;
	photoUrl?: string | null;
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ContactFilters {
	search?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	limit?: number;
	offset?: number;
}

export interface ContactsResult {
	contacts: Contact[];
	total: number;
}

export interface CreateContactDto {
	firstName?: string;
	lastName?: string;
	displayName?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	company?: string;
	jobTitle?: string;
	website?: string;
	notes?: string;
}

@Injectable()
export class ContactsService {
	private readonly logger = new Logger(ContactsService.name);
	private readonly backendUrl: string;
	private readonly apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl =
			this.configService.get<string>('contacts.backendUrl') || 'http://localhost:3015';
		this.apiPrefix = this.configService.get<string>('contacts.apiPrefix') || '/api/v1';
	}

	private getApiUrl(path: string): string {
		return `${this.backendUrl}${this.apiPrefix}${path}`;
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}/health`);
			return response.ok;
		} catch (error) {
			this.logger.error('Health check failed:', error);
			return false;
		}
	}

	async getContacts(token: string, filters: ContactFilters = {}): Promise<ContactsResult> {
		try {
			const params = new URLSearchParams();
			if (filters.search) params.set('search', filters.search);
			if (filters.isFavorite !== undefined) params.set('isFavorite', String(filters.isFavorite));
			if (filters.isArchived !== undefined) params.set('isArchived', String(filters.isArchived));
			if (filters.limit) params.set('limit', String(filters.limit));
			if (filters.offset) params.set('offset', String(filters.offset));

			const url = `${this.getApiUrl('/contacts')}?${params.toString()}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch contacts: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			this.logger.error('Failed to fetch contacts:', error);
			throw error;
		}
	}

	async getContact(token: string, contactId: string): Promise<Contact> {
		try {
			const response = await fetch(this.getApiUrl(`/contacts/${contactId}`), {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Kontakt nicht gefunden');
				}
				throw new Error(`Failed to fetch contact: ${response.status}`);
			}

			const data = await response.json();
			return data.contact;
		} catch (error) {
			this.logger.error(`Failed to fetch contact ${contactId}:`, error);
			throw error;
		}
	}

	async createContact(token: string, data: CreateContactDto): Promise<Contact> {
		try {
			const response = await fetch(this.getApiUrl('/contacts'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to create contact: ${response.status}`);
			}

			const result = await response.json();
			return result.contact;
		} catch (error) {
			this.logger.error('Failed to create contact:', error);
			throw error;
		}
	}

	async updateContact(token: string, contactId: string, data: Partial<CreateContactDto>): Promise<Contact> {
		try {
			const response = await fetch(this.getApiUrl(`/contacts/${contactId}`), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Kontakt nicht gefunden');
				}
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to update contact: ${response.status}`);
			}

			const result = await response.json();
			return result.contact;
		} catch (error) {
			this.logger.error(`Failed to update contact ${contactId}:`, error);
			throw error;
		}
	}

	async deleteContact(token: string, contactId: string): Promise<void> {
		try {
			const response = await fetch(this.getApiUrl(`/contacts/${contactId}`), {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Kontakt nicht gefunden');
				}
				throw new Error(`Failed to delete contact: ${response.status}`);
			}
		} catch (error) {
			this.logger.error(`Failed to delete contact ${contactId}:`, error);
			throw error;
		}
	}

	async toggleFavorite(token: string, contactId: string): Promise<Contact> {
		try {
			const response = await fetch(this.getApiUrl(`/contacts/${contactId}/favorite`), {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Kontakt nicht gefunden');
				}
				throw new Error(`Failed to toggle favorite: ${response.status}`);
			}

			const result = await response.json();
			return result.contact;
		} catch (error) {
			this.logger.error(`Failed to toggle favorite for ${contactId}:`, error);
			throw error;
		}
	}

	async toggleArchive(token: string, contactId: string): Promise<Contact> {
		try {
			const response = await fetch(this.getApiUrl(`/contacts/${contactId}/archive`), {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Kontakt nicht gefunden');
				}
				throw new Error(`Failed to toggle archive: ${response.status}`);
			}

			const result = await response.json();
			return result.contact;
		} catch (error) {
			this.logger.error(`Failed to toggle archive for ${contactId}:`, error);
			throw error;
		}
	}
}
