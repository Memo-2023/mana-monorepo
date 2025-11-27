import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from '../database/database.module';
import { Database, users, sessions, accounts, eq, and, User } from '@manacore/news-database';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
	constructor(
		@Inject(DATABASE_CONNECTION) private database: Database,
		private configService: ConfigService
	) {}

	private hashPassword(password: string): string {
		const salt = crypto.randomBytes(16).toString('hex');
		const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
		return `${salt}:${hash}`;
	}

	private verifyPassword(password: string, storedHash: string): boolean {
		const [salt, hash] = storedHash.split(':');
		const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
		return hash === verifyHash;
	}

	private generateToken(): string {
		return crypto.randomBytes(32).toString('hex');
	}

	async signUp(
		email: string,
		password: string,
		name?: string
	): Promise<{ user: User; token: string }> {
		// Check if user exists
		const existingUser = await this.database
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase()))
			.limit(1);

		if (existingUser.length > 0) {
			throw new ConflictException('User already exists');
		}

		// Create user
		const [user] = await this.database
			.insert(users)
			.values({
				email: email.toLowerCase(),
				name: name || null,
			})
			.returning();

		// Create account with password
		await this.database.insert(accounts).values({
			userId: user.id,
			providerId: 'credential',
			accountId: email.toLowerCase(),
			password: this.hashPassword(password),
		});

		// Create session
		const token = this.generateToken();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		await this.database.insert(sessions).values({
			userId: user.id,
			token,
			expiresAt,
		});

		return { user, token };
	}

	async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
		// Find user
		const [user] = await this.database
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase()))
			.limit(1);

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Find account
		const [account] = await this.database
			.select()
			.from(accounts)
			.where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')))
			.limit(1);

		if (!account || !account.password) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Verify password
		if (!this.verifyPassword(password, account.password)) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Create session
		const token = this.generateToken();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		await this.database.insert(sessions).values({
			userId: user.id,
			token,
			expiresAt,
		});

		return { user, token };
	}

	async signOut(token: string): Promise<void> {
		await this.database.delete(sessions).where(eq(sessions.token, token));
	}

	async validateSession(token: string): Promise<{ user: User; session: any } | null> {
		const [session] = await this.database
			.select()
			.from(sessions)
			.where(eq(sessions.token, token))
			.limit(1);

		if (!session || new Date(session.expiresAt) < new Date()) {
			return null;
		}

		const [user] = await this.database
			.select()
			.from(users)
			.where(eq(users.id, session.userId))
			.limit(1);

		if (!user) {
			return null;
		}

		return { user, session };
	}

	async getSession(token: string): Promise<{ user: User } | null> {
		const result = await this.validateSession(token);
		if (!result) return null;
		return { user: result.user };
	}
}
