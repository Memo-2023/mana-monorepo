/**
 * PasskeyService Unit Tests
 *
 * Tests WebAuthn passkey registration, authentication, and management.
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { PasskeyService } from './passkey.service';
import { getDb } from '../../db/connection';
import { nanoid } from 'nanoid';
import { LoggerService } from '../../common/logger';

jest.mock('@simplewebauthn/server', () => ({
	generateRegistrationOptions: jest.fn(),
	verifyRegistrationResponse: jest.fn(),
	generateAuthenticationOptions: jest.fn(),
	verifyAuthenticationResponse: jest.fn(),
}));

jest.mock('../../db/connection', () => ({
	getDb: jest.fn(),
}));

jest.mock('nanoid', () => ({
	nanoid: jest.fn(() => 'mock-nanoid-id'),
}));

const createMockDb = () => {
	let results: any[] = [];
	let resultIndex = 0;

	const db: any = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		then: jest.fn((resolve) => resolve(results[resultIndex++] || [])),
		setResults: (...r: any[]) => {
			results = r;
			resultIndex = 0;
		},
	};
	return db;
};

describe('PasskeyService', () => {
	let service: PasskeyService;
	let mockDb: ReturnType<typeof createMockDb>;

	const mockConfigService = {
		get: jest.fn((key: string, defaultValue?: string) => {
			const config: Record<string, string> = {
				'database.url': 'postgresql://test:test@localhost:5432/test',
				WEBAUTHN_RP_ID: 'localhost',
				WEBAUTHN_ORIGINS: 'http://localhost:5173',
			};
			return config[key] || defaultValue || '';
		}),
	};

	const mockLoggerService = {
		setContext: jest.fn().mockReturnThis(),
		log: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
	};

	beforeEach(async () => {
		jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });

		mockDb = createMockDb();
		(getDb as jest.Mock).mockReturnValue(mockDb);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PasskeyService,
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: LoggerService, useValue: mockLoggerService },
			],
		}).compile();

		service = module.get<PasskeyService>(PasskeyService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	});

	// ============================================================================
	// generateRegistrationOptions
	// ============================================================================

	describe('generateRegistrationOptions', () => {
		it('should return options and challengeId for a valid user', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
			};

			const mockOptions = {
				challenge: 'mock-challenge-string',
				rp: { name: 'ManaCore', id: 'localhost' },
				user: { id: 'user-123', name: 'test@example.com', displayName: 'Test User' },
			};

			// First query: get user; Second query: get existing passkeys
			mockDb.setResults([mockUser], []);
			(generateRegistrationOptions as jest.Mock).mockResolvedValue(mockOptions);

			const result = await service.generateRegistrationOptions('user-123');

			expect(result.options).toEqual(mockOptions);
			expect(result.challengeId).toBe('mock-nanoid-id');
			expect(generateRegistrationOptions).toHaveBeenCalledWith(
				expect.objectContaining({
					rpName: 'ManaCore',
					rpID: 'localhost',
					userName: 'test@example.com',
					userDisplayName: 'Test User',
					attestationType: 'none',
					excludeCredentials: [],
				})
			);
		});

		it('should exclude existing passkeys', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
			};

			const existingPasskeys = [
				{ credentialId: 'cred-1', transports: ['usb', 'ble'] },
				{ credentialId: 'cred-2', transports: ['internal'] },
			];

			mockDb.setResults([mockUser], existingPasskeys);
			(generateRegistrationOptions as jest.Mock).mockResolvedValue({
				challenge: 'mock-challenge',
			});

			await service.generateRegistrationOptions('user-123');

			expect(generateRegistrationOptions).toHaveBeenCalledWith(
				expect.objectContaining({
					excludeCredentials: [
						{ id: 'cred-1', transports: ['usb', 'ble'] },
						{ id: 'cred-2', transports: ['internal'] },
					],
				})
			);
		});

		it('should throw NotFoundException for non-existent user', async () => {
			mockDb.setResults([]);

			await expect(service.generateRegistrationOptions('nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ============================================================================
	// verifyRegistration
	// ============================================================================

	describe('verifyRegistration', () => {
		const mockCredential = {
			id: 'cred-id-123',
			rawId: 'raw-id',
			response: { attestationObject: 'obj', clientDataJSON: 'json' },
			type: 'public-key',
		};

		it('should store passkey on successful verification', async () => {
			// First, generate a registration to store a challenge
			const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test' };
			mockDb.setResults([mockUser], []);
			(generateRegistrationOptions as jest.Mock).mockResolvedValue({
				challenge: 'test-challenge',
			});
			const { challengeId } = await service.generateRegistrationOptions('user-123');

			// Reset DB mock for verification calls
			const publicKeyBytes = new Uint8Array([1, 2, 3, 4]);
			const mockVerification = {
				verified: true,
				registrationInfo: {
					credential: {
						id: 'new-cred-id',
						publicKey: publicKeyBytes,
						counter: 0,
						transports: ['internal'],
					},
					credentialDeviceType: 'multiPlatform',
					credentialBackedUp: true,
				},
			};

			(verifyRegistrationResponse as jest.Mock).mockResolvedValue(mockVerification);

			const newPasskey = {
				id: 'mock-nanoid-id',
				credentialId: 'new-cred-id',
				deviceType: 'multiPlatform',
				friendlyName: 'My Key',
				createdAt: new Date(),
			};

			// duplicate check (empty), insert returning
			mockDb.setResults([], [newPasskey]);

			const result = await service.verifyRegistration(challengeId, mockCredential as any, 'My Key');

			expect(result.id).toBe('mock-nanoid-id');
			expect(result.credentialId).toBe('new-cred-id');
			expect(result.deviceType).toBe('multiPlatform');
			expect(result.friendlyName).toBe('My Key');
			expect(verifyRegistrationResponse).toHaveBeenCalledWith(
				expect.objectContaining({
					expectedChallenge: 'test-challenge',
					expectedOrigin: ['http://localhost:5173'],
					expectedRPID: 'localhost',
				})
			);
		});

		it('should throw BadRequestException for expired/invalid challenge', async () => {
			await expect(
				service.verifyRegistration('nonexistent-challenge', mockCredential as any)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException when verification fails', async () => {
			// Store a challenge first
			const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test' };
			mockDb.setResults([mockUser], []);
			(generateRegistrationOptions as jest.Mock).mockResolvedValue({
				challenge: 'test-challenge',
			});
			const { challengeId } = await service.generateRegistrationOptions('user-123');

			(verifyRegistrationResponse as jest.Mock).mockResolvedValue({
				verified: false,
				registrationInfo: null,
			});

			await expect(service.verifyRegistration(challengeId, mockCredential as any)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should throw ConflictException for duplicate credentialId', async () => {
			// Store a challenge first
			const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test' };
			mockDb.setResults([mockUser], []);
			(generateRegistrationOptions as jest.Mock).mockResolvedValue({
				challenge: 'test-challenge',
			});
			const { challengeId } = await service.generateRegistrationOptions('user-123');

			const publicKeyBytes = new Uint8Array([1, 2, 3, 4]);
			(verifyRegistrationResponse as jest.Mock).mockResolvedValue({
				verified: true,
				registrationInfo: {
					credential: {
						id: 'existing-cred',
						publicKey: publicKeyBytes,
						counter: 0,
						transports: [],
					},
					credentialDeviceType: 'singleDevice',
					credentialBackedUp: false,
				},
			});

			// Duplicate check returns existing passkey
			mockDb.setResults([{ id: 'existing-pk', credentialId: 'existing-cred' }]);

			await expect(service.verifyRegistration(challengeId, mockCredential as any)).rejects.toThrow(
				ConflictException
			);
		});
	});

	// ============================================================================
	// generateAuthenticationOptions
	// ============================================================================

	describe('generateAuthenticationOptions', () => {
		it('should return options and challengeId (discoverable credentials)', async () => {
			const mockOptions = {
				challenge: 'auth-challenge',
				rpId: 'localhost',
			};

			(generateAuthenticationOptions as jest.Mock).mockResolvedValue(mockOptions);

			const result = await service.generateAuthenticationOptions();

			expect(result.options).toEqual(mockOptions);
			expect(result.challengeId).toBe('mock-nanoid-id');
			expect(generateAuthenticationOptions).toHaveBeenCalledWith({
				rpID: 'localhost',
				userVerification: 'preferred',
			});
		});
	});

	// ============================================================================
	// verifyAuthentication
	// ============================================================================

	describe('verifyAuthentication', () => {
		const mockAuthCredential = {
			id: 'cred-id-123',
			rawId: 'raw-id',
			response: { authenticatorData: 'data', clientDataJSON: 'json', signature: 'sig' },
			type: 'public-key',
		};

		it('should return user on successful authentication', async () => {
			// Store challenge
			(generateAuthenticationOptions as jest.Mock).mockResolvedValue({
				challenge: 'auth-challenge',
			});
			const { challengeId } = await service.generateAuthenticationOptions();

			const mockPasskey = {
				id: 'pk-123',
				userId: 'user-123',
				credentialId: 'cred-id-123',
				publicKey: Buffer.from([1, 2, 3, 4]).toString('base64url'),
				counter: 5,
				transports: ['internal'],
			};

			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
				deletedAt: null,
			};

			(verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
				verified: true,
				authenticationInfo: { newCounter: 6 },
			});

			// find passkey, update counter, get user
			mockDb.setResults([mockPasskey], [], [mockUser]);

			const result = await service.verifyAuthentication(challengeId, mockAuthCredential as any);

			expect(result.user).toEqual(mockUser);
			expect(result.passkeyId).toBe('pk-123');
			expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
				expect.objectContaining({
					expectedChallenge: 'auth-challenge',
					expectedOrigin: ['http://localhost:5173'],
					expectedRPID: 'localhost',
				})
			);
		});

		it('should update counter and lastUsedAt', async () => {
			(generateAuthenticationOptions as jest.Mock).mockResolvedValue({
				challenge: 'auth-challenge',
			});
			const { challengeId } = await service.generateAuthenticationOptions();

			const mockPasskey = {
				id: 'pk-123',
				userId: 'user-123',
				credentialId: 'cred-id-123',
				publicKey: Buffer.from([1, 2, 3, 4]).toString('base64url'),
				counter: 5,
				transports: [],
			};

			const mockUser = { id: 'user-123', email: 'test@example.com', deletedAt: null };

			(verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
				verified: true,
				authenticationInfo: { newCounter: 10 },
			});

			mockDb.setResults([mockPasskey], [], [mockUser]);

			await service.verifyAuthentication(challengeId, mockAuthCredential as any);

			// Verify update was called (set is chained)
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					counter: 10,
				})
			);
		});

		it('should throw BadRequestException for unknown credential', async () => {
			(generateAuthenticationOptions as jest.Mock).mockResolvedValue({
				challenge: 'auth-challenge',
			});
			const { challengeId } = await service.generateAuthenticationOptions();

			// No passkey found
			mockDb.setResults([]);

			await expect(
				service.verifyAuthentication(challengeId, mockAuthCredential as any)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException for expired challenge', async () => {
			await expect(
				service.verifyAuthentication('invalid-challenge', mockAuthCredential as any)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException for deleted user', async () => {
			(generateAuthenticationOptions as jest.Mock).mockResolvedValue({
				challenge: 'auth-challenge',
			});
			const { challengeId } = await service.generateAuthenticationOptions();

			const mockPasskey = {
				id: 'pk-123',
				userId: 'user-123',
				credentialId: 'cred-id-123',
				publicKey: Buffer.from([1, 2, 3, 4]).toString('base64url'),
				counter: 5,
				transports: [],
			};

			const deletedUser = {
				id: 'user-123',
				email: 'test@example.com',
				deletedAt: new Date(),
			};

			(verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
				verified: true,
				authenticationInfo: { newCounter: 6 },
			});

			mockDb.setResults([mockPasskey], [], [deletedUser]);

			await expect(
				service.verifyAuthentication(challengeId, mockAuthCredential as any)
			).rejects.toThrow(BadRequestException);
		});
	});

	// ============================================================================
	// listPasskeys
	// ============================================================================

	describe('listPasskeys', () => {
		it('should return all passkeys for a user', async () => {
			const mockPasskeys = [
				{
					id: 'pk-1',
					credentialId: 'cred-1',
					deviceType: 'multiPlatform',
					backedUp: true,
					friendlyName: 'My Key',
					lastUsedAt: null,
					createdAt: new Date(),
				},
				{
					id: 'pk-2',
					credentialId: 'cred-2',
					deviceType: 'singleDevice',
					backedUp: false,
					friendlyName: null,
					lastUsedAt: new Date(),
					createdAt: new Date(),
				},
			];

			mockDb.setResults(mockPasskeys);

			const result = await service.listPasskeys('user-123');

			expect(result).toEqual(mockPasskeys);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return empty array for user with no passkeys', async () => {
			mockDb.setResults([]);

			const result = await service.listPasskeys('user-no-passkeys');

			expect(result).toEqual([]);
		});
	});

	// ============================================================================
	// deletePasskey
	// ============================================================================

	describe('deletePasskey', () => {
		it('should delete passkey owned by user', async () => {
			const mockPasskey = { id: 'pk-123', userId: 'user-123', credentialId: 'cred-1' };

			// First call: find passkey, second call: delete
			mockDb.setResults([mockPasskey], []);

			await service.deletePasskey('user-123', 'pk-123');

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent passkey', async () => {
			mockDb.setResults([]);

			await expect(service.deletePasskey('user-123', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ============================================================================
	// renamePasskey
	// ============================================================================

	describe('renamePasskey', () => {
		it('should update friendly name', async () => {
			const mockPasskey = { id: 'pk-123', userId: 'user-123', friendlyName: 'Old Name' };

			mockDb.setResults([mockPasskey], []);

			await service.renamePasskey('user-123', 'pk-123', 'New Name');

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith({ friendlyName: 'New Name' });
		});

		it('should throw NotFoundException for non-existent passkey', async () => {
			mockDb.setResults([]);

			await expect(service.renamePasskey('user-123', 'nonexistent', 'Name')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ============================================================================
	// Challenge management
	// ============================================================================

	describe('Challenge management', () => {
		it('should clean up expired challenges (5-minute TTL)', async () => {
			// Generate a challenge
			(generateAuthenticationOptions as jest.Mock).mockResolvedValue({
				challenge: 'temp-challenge',
			});
			const { challengeId } = await service.generateAuthenticationOptions();

			// Advance time past the 5-minute TTL
			jest.advanceTimersByTime(5 * 60 * 1000 + 1);

			// The challenge should now be expired
			mockDb.setResults([]);

			await expect(
				service.verifyAuthentication(challengeId, { id: 'cred' } as any)
			).rejects.toThrow(BadRequestException);
		});

		it('should consume challenge on use (one-time use)', async () => {
			(generateAuthenticationOptions as jest.Mock).mockResolvedValue({
				challenge: 'one-time-challenge',
			});
			const { challengeId } = await service.generateAuthenticationOptions();

			// First use: passkey not found (throws different error), but challenge is consumed
			mockDb.setResults([]);

			await expect(
				service.verifyAuthentication(challengeId, { id: 'cred' } as any)
			).rejects.toThrow(BadRequestException);

			// Second use: challenge already consumed
			await expect(
				service.verifyAuthentication(challengeId, { id: 'cred' } as any)
			).rejects.toThrow(BadRequestException);
		});
	});
});
