import {
	Injectable,
	NotFoundException,
	BadRequestException,
	ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
	RegistrationResponseJSON,
	AuthenticationResponseJSON,
	AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { getDb } from '../../db/connection';
import { passkeys, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { LoggerService } from '../../common/logger';

interface ChallengeEntry {
	challenge: string;
	userId?: string; // Only set for registration
	expiresAt: number;
}

@Injectable()
export class PasskeyService {
	private readonly logger: LoggerService;
	private readonly challenges = new Map<string, ChallengeEntry>();
	private readonly rpID: string;
	private readonly rpName = 'ManaCore';
	private readonly expectedOrigins: string[];
	private readonly databaseUrl: string;

	constructor(
		private readonly configService: ConfigService,
		loggerService: LoggerService
	) {
		this.logger = loggerService.setContext('PasskeyService');
		this.databaseUrl = this.configService.get<string>('database.url', '');
		this.rpID = this.configService.get<string>('WEBAUTHN_RP_ID', 'localhost');

		const originsStr = this.configService.get<string>('WEBAUTHN_ORIGINS', '');
		this.expectedOrigins = originsStr
			? originsStr.split(',').map((o) => o.trim())
			: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'];

		// Clean up expired challenges every 5 minutes
		setInterval(() => this.cleanupChallenges(), 5 * 60 * 1000);
	}

	private getDb() {
		return getDb(this.databaseUrl);
	}

	private cleanupChallenges() {
		const now = Date.now();
		for (const [key, entry] of this.challenges) {
			if (entry.expiresAt < now) {
				this.challenges.delete(key);
			}
		}
	}

	private storeChallenge(challengeId: string, challenge: string, userId?: string) {
		this.challenges.set(challengeId, {
			challenge,
			userId,
			expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
		});
	}

	private getAndDeleteChallenge(challengeId: string): ChallengeEntry | null {
		const entry = this.challenges.get(challengeId);
		if (!entry) return null;
		this.challenges.delete(challengeId);
		if (entry.expiresAt < Date.now()) return null;
		return entry;
	}

	/**
	 * Generate registration options for a logged-in user
	 */
	async generateRegistrationOptions(userId: string) {
		const db = this.getDb();

		// Get user
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!user) throw new NotFoundException('User not found');

		// Get existing passkeys to exclude
		const existingPasskeys = await db.select().from(passkeys).where(eq(passkeys.userId, userId));

		const excludeCredentials = existingPasskeys.map((pk) => ({
			id: pk.credentialId,
			transports: (pk.transports as AuthenticatorTransportFuture[]) || [],
		}));

		const options = await generateRegistrationOptions({
			rpName: this.rpName,
			rpID: this.rpID,
			userName: user.email,
			userDisplayName: user.name || user.email,
			attestationType: 'none',
			excludeCredentials,
			authenticatorSelection: {
				residentKey: 'preferred',
				userVerification: 'preferred',
			},
		});

		// Store challenge
		const challengeId = nanoid();
		this.storeChallenge(challengeId, options.challenge, userId);

		return { options, challengeId };
	}

	/**
	 * Verify registration response and store the new passkey
	 */
	async verifyRegistration(
		challengeId: string,
		credential: RegistrationResponseJSON,
		friendlyName?: string
	) {
		const entry = this.getAndDeleteChallenge(challengeId);
		if (!entry || !entry.userId) {
			throw new BadRequestException('Invalid or expired challenge');
		}

		const verification = await verifyRegistrationResponse({
			response: credential,
			expectedChallenge: entry.challenge,
			expectedOrigin: this.expectedOrigins,
			expectedRPID: this.rpID,
		});

		if (!verification.verified || !verification.registrationInfo) {
			throw new BadRequestException('Passkey verification failed');
		}

		const {
			credential: cred,
			credentialDeviceType,
			credentialBackedUp,
		} = verification.registrationInfo;

		const db = this.getDb();

		// Check for duplicate
		const [existing] = await db
			.select()
			.from(passkeys)
			.where(eq(passkeys.credentialId, cred.id))
			.limit(1);

		if (existing) {
			throw new ConflictException('This passkey is already registered');
		}

		const id = nanoid();
		const [newPasskey] = await db
			.insert(passkeys)
			.values({
				id,
				userId: entry.userId,
				credentialId: cred.id,
				publicKey: Buffer.from(cred.publicKey).toString('base64url'),
				counter: cred.counter,
				deviceType: credentialDeviceType,
				backedUp: credentialBackedUp,
				transports: cred.transports || [],
				friendlyName: friendlyName || null,
			})
			.returning();

		this.logger.log(`Passkey registered for user ${entry.userId}: ${id}`);

		return {
			id: newPasskey.id,
			credentialId: newPasskey.credentialId,
			deviceType: newPasskey.deviceType,
			friendlyName: newPasskey.friendlyName,
			createdAt: newPasskey.createdAt,
		};
	}

	/**
	 * Generate authentication options (public - no auth required)
	 */
	async generateAuthenticationOptions() {
		// Use discoverable credentials (resident keys) - no allowCredentials needed
		// The browser will show all available passkeys for this rpID
		const options = await generateAuthenticationOptions({
			rpID: this.rpID,
			userVerification: 'preferred',
		});

		const challengeId = nanoid();
		this.storeChallenge(challengeId, options.challenge);

		return { options, challengeId };
	}

	/**
	 * Verify authentication response and return the user
	 */
	async verifyAuthentication(challengeId: string, credential: AuthenticationResponseJSON) {
		const entry = this.getAndDeleteChallenge(challengeId);
		if (!entry) {
			throw new BadRequestException('Invalid or expired challenge');
		}

		const db = this.getDb();

		// Find the passkey by credential ID
		const [passkey] = await db
			.select()
			.from(passkeys)
			.where(eq(passkeys.credentialId, credential.id))
			.limit(1);

		if (!passkey) {
			throw new BadRequestException('Passkey not found');
		}

		const verification = await verifyAuthenticationResponse({
			response: credential,
			expectedChallenge: entry.challenge,
			expectedOrigin: this.expectedOrigins,
			expectedRPID: this.rpID,
			credential: {
				id: passkey.credentialId,
				publicKey: Buffer.from(passkey.publicKey, 'base64url'),
				counter: passkey.counter,
				transports: (passkey.transports as AuthenticatorTransportFuture[]) || [],
			},
		});

		if (!verification.verified) {
			throw new BadRequestException('Passkey authentication failed');
		}

		// Update counter and lastUsedAt
		await db
			.update(passkeys)
			.set({
				counter: verification.authenticationInfo.newCounter,
				lastUsedAt: new Date(),
			})
			.where(eq(passkeys.id, passkey.id));

		// Get user
		const [user] = await db.select().from(users).where(eq(users.id, passkey.userId)).limit(1);

		if (!user) {
			throw new BadRequestException('User not found');
		}

		if (user.deletedAt) {
			throw new BadRequestException('Account has been deleted');
		}

		return { user, passkeyId: passkey.id };
	}

	/**
	 * List all passkeys for a user
	 */
	async listPasskeys(userId: string) {
		const db = this.getDb();
		const userPasskeys = await db
			.select({
				id: passkeys.id,
				credentialId: passkeys.credentialId,
				deviceType: passkeys.deviceType,
				backedUp: passkeys.backedUp,
				friendlyName: passkeys.friendlyName,
				lastUsedAt: passkeys.lastUsedAt,
				createdAt: passkeys.createdAt,
			})
			.from(passkeys)
			.where(eq(passkeys.userId, userId));

		return userPasskeys;
	}

	/**
	 * Delete a passkey
	 */
	async deletePasskey(userId: string, passkeyId: string) {
		const db = this.getDb();

		const [passkey] = await db
			.select()
			.from(passkeys)
			.where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)))
			.limit(1);

		if (!passkey) {
			throw new NotFoundException('Passkey not found');
		}

		await db.delete(passkeys).where(eq(passkeys.id, passkeyId));

		this.logger.log(`Passkey deleted: ${passkeyId} for user ${userId}`);
	}

	/**
	 * Rename a passkey
	 */
	async renamePasskey(userId: string, passkeyId: string, friendlyName: string) {
		const db = this.getDb();

		const [passkey] = await db
			.select()
			.from(passkeys)
			.where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)))
			.limit(1);

		if (!passkey) {
			throw new NotFoundException('Passkey not found');
		}

		await db.update(passkeys).set({ friendlyName }).where(eq(passkeys.id, passkeyId));
	}
}
