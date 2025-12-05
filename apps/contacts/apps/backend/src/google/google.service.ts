import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, people_v1, Auth } from 'googleapis';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	connectedAccounts,
	type ConnectedAccount,
	type GoogleContactsProviderData,
} from '../db/schema';
import { contacts, type NewContact } from '../db/schema';
import type {
	GoogleContact,
	GoogleContactsResponse,
	GoogleImportResult,
	ConnectedAccountResponse,
} from './dto/google.dto';

const GOOGLE_SCOPES = [
	'https://www.googleapis.com/auth/contacts.readonly',
	'https://www.googleapis.com/auth/userinfo.email',
];

@Injectable()
export class GoogleService {
	private oauth2Client: Auth.OAuth2Client;

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private configService: ConfigService
	) {
		this.oauth2Client = new google.auth.OAuth2(
			this.configService.get('GOOGLE_CLIENT_ID'),
			this.configService.get('GOOGLE_CLIENT_SECRET'),
			this.configService.get('GOOGLE_REDIRECT_URI')
		);
	}

	/**
	 * Generate OAuth2 authorization URL
	 */
	getAuthUrl(state?: string): string {
		return this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: GOOGLE_SCOPES,
			prompt: 'consent',
			state,
		});
	}

	/**
	 * Exchange authorization code for tokens and store them
	 */
	async handleCallback(userId: string, code: string): Promise<ConnectedAccountResponse> {
		const { tokens } = await this.oauth2Client.getToken(code);

		if (!tokens.access_token) {
			throw new BadRequestException('Failed to get access token from Google');
		}

		// Get user info
		this.oauth2Client.setCredentials(tokens);
		const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
		const { data: userInfo } = await oauth2.userinfo.get();

		// Check if already connected
		const existing = await this.getConnectedAccount(userId);

		if (existing) {
			// Update existing connection
			const [updated] = await this.db
				.update(connectedAccounts)
				.set({
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token || existing.refreshToken,
					tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
					scope: tokens.scope || null,
					providerEmail: userInfo.email || null,
					providerAccountId: userInfo.id || null,
					updatedAt: new Date(),
				})
				.where(eq(connectedAccounts.id, existing.id))
				.returning();

			return this.toResponse(updated);
		}

		// Create new connection
		const [account] = await this.db
			.insert(connectedAccounts)
			.values({
				userId,
				provider: 'google',
				providerAccountId: userInfo.id || null,
				providerEmail: userInfo.email || null,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token || null,
				tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
				scope: tokens.scope || null,
				providerData: {},
			})
			.returning();

		return this.toResponse(account);
	}

	/**
	 * Get connected Google account for user
	 */
	async getConnectedAccount(userId: string): Promise<ConnectedAccount | null> {
		const [account] = await this.db
			.select()
			.from(connectedAccounts)
			.where(and(eq(connectedAccounts.userId, userId), eq(connectedAccounts.provider, 'google')));

		return account || null;
	}

	/**
	 * Disconnect Google account
	 */
	async disconnect(userId: string): Promise<void> {
		const account = await this.getConnectedAccount(userId);

		if (account) {
			// Revoke token
			try {
				await this.oauth2Client.revokeToken(account.accessToken);
			} catch {
				// Ignore revoke errors
			}

			// Delete from database
			await this.db
				.delete(connectedAccounts)
				.where(and(eq(connectedAccounts.userId, userId), eq(connectedAccounts.provider, 'google')));
		}
	}

	/**
	 * Fetch contacts from Google
	 */
	async fetchContacts(userId: string, pageToken?: string): Promise<GoogleContactsResponse> {
		const account = await this.getConnectedAccount(userId);
		if (!account) {
			throw new UnauthorizedException('Google account not connected');
		}

		// Ensure token is valid
		await this.ensureValidToken(account);

		this.oauth2Client.setCredentials({
			access_token: account.accessToken,
			refresh_token: account.refreshToken,
		});

		const peopleService = google.people({ version: 'v1', auth: this.oauth2Client });

		const response = await peopleService.people.connections.list({
			resourceName: 'people/me',
			pageSize: 100,
			pageToken,
			personFields:
				'names,emailAddresses,phoneNumbers,addresses,organizations,urls,birthdays,biographies,photos',
		});

		const googleContacts: GoogleContact[] = (response.data.connections || []).map((person) => ({
			resourceName: person.resourceName || '',
			etag: person.etag || undefined,
			names: person.names?.map((n) => ({
				displayName: n.displayName || undefined,
				familyName: n.familyName || undefined,
				givenName: n.givenName || undefined,
				middleName: n.middleName || undefined,
			})),
			emailAddresses: person.emailAddresses?.map((e) => ({
				value: e.value || undefined,
				type: e.type || undefined,
			})),
			phoneNumbers: person.phoneNumbers?.map((p) => ({
				value: p.value || undefined,
				type: p.type || undefined,
			})),
			addresses: person.addresses?.map((a) => ({
				streetAddress: a.streetAddress || undefined,
				city: a.city || undefined,
				postalCode: a.postalCode || undefined,
				country: a.country || undefined,
				type: a.type || undefined,
			})),
			organizations: person.organizations?.map((o) => ({
				name: o.name || undefined,
				title: o.title || undefined,
				department: o.department || undefined,
			})),
			urls: person.urls?.map((u) => ({
				value: u.value || undefined,
				type: u.type || undefined,
			})),
			birthdays: person.birthdays?.map((b) => ({
				date: b.date
					? {
							year: b.date.year || undefined,
							month: b.date.month || undefined,
							day: b.date.day || undefined,
						}
					: undefined,
			})),
			biographies: person.biographies?.map((bio) => ({
				value: bio.value || undefined,
			})),
			photos: person.photos?.map((p) => ({
				url: p.url || undefined,
			})),
		}));

		return {
			contacts: googleContacts,
			nextPageToken: response.data.nextPageToken || undefined,
			totalPeople: response.data.totalPeople || undefined,
		};
	}

	/**
	 * Import selected Google contacts
	 */
	async importContacts(
		userId: string,
		resourceNames?: string[],
		importAll = false
	): Promise<GoogleImportResult> {
		const result: GoogleImportResult = {
			imported: 0,
			skipped: 0,
			errors: [],
		};

		// Fetch all contacts if importAll
		let contactsToImport: GoogleContact[] = [];

		if (importAll) {
			let pageToken: string | undefined;
			do {
				const response = await this.fetchContacts(userId, pageToken);
				contactsToImport.push(...response.contacts);
				pageToken = response.nextPageToken;
			} while (pageToken);
		} else if (resourceNames && resourceNames.length > 0) {
			const response = await this.fetchContacts(userId);
			contactsToImport = response.contacts.filter((c) => resourceNames.includes(c.resourceName));
		}

		// Import each contact
		for (const googleContact of contactsToImport) {
			try {
				const contactData = this.mapGoogleContactToContact(googleContact, userId);

				// Check for duplicates by email
				if (contactData.email) {
					const [existing] = await this.db
						.select()
						.from(contacts)
						.where(and(eq(contacts.userId, userId), eq(contacts.email, contactData.email)));

					if (existing) {
						result.skipped++;
						continue;
					}
				}

				await this.db.insert(contacts).values(contactData);
				result.imported++;
			} catch (error) {
				result.errors.push({
					resourceName: googleContact.resourceName,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		// Update provider data with imported resource names
		const account = await this.getConnectedAccount(userId);
		if (account) {
			const providerData = (account.providerData as GoogleContactsProviderData) || {};
			const importedNames = contactsToImport.map((c) => c.resourceName);

			await this.db
				.update(connectedAccounts)
				.set({
					providerData: {
						...providerData,
						lastSyncedAt: new Date().toISOString(),
						importedResourceNames: [
							...(providerData.importedResourceNames || []),
							...importedNames,
						],
					},
					updatedAt: new Date(),
				})
				.where(eq(connectedAccounts.id, account.id));
		}

		return result;
	}

	/**
	 * Ensure OAuth token is valid, refresh if needed
	 */
	private async ensureValidToken(account: ConnectedAccount): Promise<void> {
		if (account.tokenExpiresAt && new Date() >= account.tokenExpiresAt) {
			if (!account.refreshToken) {
				throw new UnauthorizedException('Token expired and no refresh token available');
			}

			this.oauth2Client.setCredentials({
				refresh_token: account.refreshToken,
			});

			const { credentials } = await this.oauth2Client.refreshAccessToken();

			await this.db
				.update(connectedAccounts)
				.set({
					accessToken: credentials.access_token!,
					tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
					updatedAt: new Date(),
				})
				.where(eq(connectedAccounts.id, account.id));

			account.accessToken = credentials.access_token!;
		}
	}

	/**
	 * Map Google contact to our contact schema
	 */
	private mapGoogleContactToContact(googleContact: GoogleContact, userId: string): NewContact {
		const name = googleContact.names?.[0];
		const email = googleContact.emailAddresses?.[0];
		const phone = googleContact.phoneNumbers?.find((p) => p.type !== 'mobile');
		const mobile = googleContact.phoneNumbers?.find((p) => p.type === 'mobile');
		const address = googleContact.addresses?.[0];
		const org = googleContact.organizations?.[0];
		const website = googleContact.urls?.[0];
		const birthday = googleContact.birthdays?.[0];
		const bio = googleContact.biographies?.[0];
		const photo = googleContact.photos?.[0];

		let birthdayStr: string | undefined;
		if (birthday?.date?.year && birthday?.date?.month && birthday?.date?.day) {
			birthdayStr = `${birthday.date.year}-${String(birthday.date.month).padStart(2, '0')}-${String(birthday.date.day).padStart(2, '0')}`;
		}

		return {
			userId,
			createdBy: userId,
			firstName: name?.givenName || null,
			lastName: name?.familyName || null,
			displayName: name?.displayName || null,
			email: email?.value || null,
			phone: phone?.value || null,
			mobile: mobile?.value || googleContact.phoneNumbers?.[0]?.value || null,
			street: address?.streetAddress || null,
			city: address?.city || null,
			postalCode: address?.postalCode || null,
			country: address?.country || null,
			company: org?.name || null,
			jobTitle: org?.title || null,
			department: org?.department || null,
			website: website?.value || null,
			birthday: birthdayStr || null,
			notes: bio?.value || null,
			photoUrl: photo?.url || null,
		};
	}

	/**
	 * Convert to response DTO
	 */
	private toResponse(account: ConnectedAccount): ConnectedAccountResponse {
		return {
			id: account.id,
			provider: account.provider,
			providerEmail: account.providerEmail,
			createdAt: account.createdAt,
		};
	}
}
