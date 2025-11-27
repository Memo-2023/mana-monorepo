import {
	Injectable,
	UnauthorizedException,
	ConflictException,
	BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';
import { getDb } from '../db/connection';
import { users, passwords, sessions } from '../db/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface TokenPayload {
	sub: string;
	email: string;
	role: string;
	sessionId: string;
	deviceId?: string;
}

@Injectable()
export class AuthService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
		const db = this.getDb();

		// Check if user already exists
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, registerDto.email.toLowerCase()))
			.limit(1);

		if (existingUser.length > 0) {
			throw new ConflictException('User with this email already exists');
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(registerDto.password, 12);

		// Create user
		const [newUser] = await db
			.insert(users)
			.values({
				email: registerDto.email.toLowerCase(),
				name: registerDto.name,
				role: 'user',
			})
			.returning();

		// Store password
		await db.insert(passwords).values({
			userId: newUser.id,
			hashedPassword,
		});

		// Initialize credit balance (done via trigger or separate service call)
		// This will be handled by the credits service

		return {
			id: newUser.id,
			email: newUser.email,
			name: newUser.name,
			createdAt: newUser.createdAt,
		};
	}

	async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
		const db = this.getDb();

		// Find user
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, loginDto.email.toLowerCase()))
			.limit(1);

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Check if user is soft-deleted
		if (user.deletedAt) {
			throw new UnauthorizedException('Account has been deleted');
		}

		// Get password
		const [passwordRecord] = await db
			.select()
			.from(passwords)
			.where(eq(passwords.userId, user.id))
			.limit(1);

		if (!passwordRecord) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(loginDto.password, passwordRecord.hashedPassword);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Generate tokens
		const tokenData = await this.generateTokens(
			user.id,
			user.email,
			user.role,
			loginDto.deviceId,
			loginDto.deviceName,
			ipAddress,
			userAgent
		);

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
			...tokenData,
		};
	}

	async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string) {
		const db = this.getDb();

		// Find session by refresh token
		const [session] = await db
			.select()
			.from(sessions)
			.where(and(eq(sessions.refreshToken, refreshToken), isNull(sessions.revokedAt)))
			.limit(1);

		if (!session) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		// Check if refresh token is expired
		if (new Date() > session.refreshTokenExpiresAt) {
			throw new UnauthorizedException('Refresh token expired');
		}

		// Get user
		const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

		if (!user || user.deletedAt) {
			throw new UnauthorizedException('User not found');
		}

		// Revoke old session (refresh token rotation)
		await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));

		// Generate new tokens
		const tokenData = await this.generateTokens(
			user.id,
			user.email,
			user.role,
			session.deviceId ?? undefined,
			session.deviceName ?? undefined,
			ipAddress,
			userAgent
		);

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
			...tokenData,
		};
	}

	async logout(sessionId: string) {
		const db = this.getDb();

		await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));

		return { message: 'Logged out successfully' };
	}

	private async generateTokens(
		userId: string,
		email: string,
		role: string,
		deviceId?: string,
		deviceName?: string,
		ipAddress?: string,
		userAgent?: string
	) {
		const db = this.getDb();

		const privateKeyRaw = this.configService.get<string>('jwt.privateKey');
		if (!privateKeyRaw) {
			throw new Error('JWT private key not configured');
		}
		const privateKey: string = privateKeyRaw;
		const accessTokenExpiry = this.configService.get<string>('jwt.accessTokenExpiry') || '15m';
		const refreshTokenExpiry = this.configService.get<string>('jwt.refreshTokenExpiry') || '7d';
		const issuer = this.configService.get<string>('jwt.issuer');
		const audience = this.configService.get<string>('jwt.audience');

		// Generate session ID (must be UUID for database)
		const sessionId = randomUUID();

		// Create session record
		const refreshTokenString = nanoid(64);
		const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
		const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

		await db.insert(sessions).values({
			id: sessionId,
			userId,
			token: sessionId,
			refreshToken: refreshTokenString,
			refreshTokenExpiresAt,
			ipAddress,
			userAgent,
			deviceId,
			deviceName,
			expiresAt: accessTokenExpiresAt,
		});

		// Generate JWT payload
		const tokenPayload: Record<string, unknown> = {
			sub: userId,
			email,
			role,
			sessionId,
			...(deviceId && { deviceId }),
		};

		// Sign access token
		const accessToken = jwt.sign(tokenPayload, privateKey, {
			algorithm: 'RS256' as const,
			expiresIn: accessTokenExpiry as jwt.SignOptions['expiresIn'],
			...(issuer && { issuer }),
			...(audience && { audience }),
		});

		return {
			accessToken,
			refreshToken: refreshTokenString,
			expiresIn: 15 * 60, // 15 minutes in seconds
			tokenType: 'Bearer',
		};
	}

	async validateToken(token: string) {
		try {
			const publicKey = this.configService.get<string>('jwt.publicKey');
			if (!publicKey) {
				throw new Error('JWT public key not configured');
			}
			const audience = this.configService.get<string>('jwt.audience');
			const issuer = this.configService.get<string>('jwt.issuer');

			const payload = jwt.verify(token, publicKey, {
				algorithms: ['RS256'],
				audience,
				issuer,
			}) as TokenPayload;

			return {
				valid: true,
				payload,
			};
		} catch (error) {
			return {
				valid: false,
				error: error.message,
			};
		}
	}
}
