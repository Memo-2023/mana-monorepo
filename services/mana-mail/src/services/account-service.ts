/**
 * Account Service — Manages Stalwart mail accounts and DB records.
 *
 * Creates @mana.how mailboxes for users via Stalwart's Admin API.
 */

import { eq } from 'drizzle-orm';
import type { Database } from '../db/connection';
import type { Config } from '../config';
import { accounts, type MailAccount, type NewMailAccount } from '../db/schema/mail';
import { ConflictError, NotFoundError } from '../lib/errors';

export class AccountService {
	constructor(
		private db: Database,
		private config: Config['stalwart']
	) {}

	private get authHeader(): string {
		return (
			'Basic ' +
			Buffer.from(`${this.config.adminUser}:${this.config.adminPassword}`).toString('base64')
		);
	}

	/** Generate a username from email or name. */
	private generateUsername(email: string, name?: string): string {
		if (name) {
			return name
				.toLowerCase()
				.replace(/\s+/g, '.')
				.replace(/[^a-z0-9.]/g, '')
				.slice(0, 30);
		}
		return email
			.split('@')[0]
			.toLowerCase()
			.replace(/[^a-z0-9.]/g, '');
	}

	/** Create a Stalwart account via Admin API. */
	private async createStalwartAccount(
		username: string,
		password: string,
		email: string
	): Promise<void> {
		// Hash the password with SHA512-crypt via Stalwart's own API
		const createResponse = await fetch(`${this.config.jmapUrl}/api/principal`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: this.authHeader,
			},
			body: JSON.stringify({
				type: 'individual',
				name: username,
				secrets: [password],
				emails: [email],
			}),
		});

		if (!createResponse.ok) {
			const text = await createResponse.text();
			if (createResponse.status === 409 || text.includes('already exists')) {
				throw new ConflictError(`Account ${email} already exists in Stalwart`);
			}
			throw new Error(`Failed to create Stalwart account: ${text}`);
		}

		// Assign 'user' role (required for SMTP/JMAP access)
		const roleResponse = await fetch(`${this.config.jmapUrl}/api/principal/${username}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: this.authHeader,
			},
			body: JSON.stringify([{ action: 'set', field: 'roles', value: ['user'] }]),
		});

		if (!roleResponse.ok) {
			console.error(
				`[mana-mail] Warning: failed to set role for ${username}: ${await roleResponse.text()}`
			);
		}
	}

	/** Provision a new mail account for a user (called on registration). */
	async provisionAccount(userId: string, email: string, name?: string): Promise<MailAccount> {
		// Check if user already has an account
		const existing = await this.db.query.accounts.findFirst({
			where: eq(accounts.userId, userId),
		});
		if (existing) return existing;

		// Generate @mana.how address
		let username = this.generateUsername(email, name);
		let manaEmail = `${username}@${this.config.domain}`;

		// Handle collision — append random suffix
		const emailExists = await this.db.query.accounts.findFirst({
			where: eq(accounts.email, manaEmail),
		});
		if (emailExists) {
			const suffix = Math.floor(Math.random() * 1000);
			username = `${username}${suffix}`;
			manaEmail = `${username}@${this.config.domain}`;
		}

		// Create Stalwart account with a random password
		// (users authenticate via Mana JWT, not mail credentials directly)
		const mailPassword = crypto.randomUUID();
		await this.createStalwartAccount(username, mailPassword, manaEmail);

		// Save to database
		const newAccount: NewMailAccount = {
			userId,
			email: manaEmail,
			displayName: name || username,
			provider: 'stalwart',
			isDefault: true,
			stalwartAccountId: username,
		};

		const [created] = await this.db.insert(accounts).values(newAccount).returning();
		return created;
	}

	/** Get all mail accounts for a user. */
	async getAccounts(userId: string): Promise<MailAccount[]> {
		return this.db.query.accounts.findMany({
			where: eq(accounts.userId, userId),
		});
	}

	/** Get the default (or first) account for a user. */
	async getDefaultAccount(userId: string): Promise<MailAccount | null> {
		const account = await this.db.query.accounts.findFirst({
			where: eq(accounts.userId, userId),
			orderBy: (a, { desc }) => [desc(a.isDefault)],
		});
		return account ?? null;
	}

	/** Update account settings (display name, signature). */
	async updateAccount(
		userId: string,
		accountId: string,
		update: { displayName?: string; signature?: string }
	): Promise<MailAccount> {
		const account = await this.db.query.accounts.findFirst({
			where: eq(accounts.id, accountId),
		});
		if (!account || account.userId !== userId) {
			throw new NotFoundError('Account not found');
		}

		const [updated] = await this.db
			.update(accounts)
			.set({ ...update, updatedAt: new Date() })
			.where(eq(accounts.id, accountId))
			.returning();
		return updated;
	}
}
