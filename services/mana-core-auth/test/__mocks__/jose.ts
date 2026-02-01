/**
 * Jose Mock - Implements basic JWT functions for testing
 *
 * Since jose is an ESM module and jest runs in CommonJS mode,
 * we need to provide a compatible mock implementation.
 *
 * This mock uses Node.js crypto for HS256 signing/verification.
 */

import * as crypto from 'crypto';

// Error classes matching jose's error types
export const errors = {
	JWTExpired: class JWTExpired extends Error {
		constructor(message = 'jwt expired') {
			super(message);
			this.name = 'JWTExpired';
		}
	},
	JWTClaimValidationFailed: class JWTClaimValidationFailed extends Error {
		constructor(message = 'jwt claim validation failed') {
			super(message);
			this.name = 'JWTClaimValidationFailed';
		}
	},
	JWSSignatureVerificationFailed: class JWSSignatureVerificationFailed extends Error {
		constructor(message = 'signature verification failed') {
			super(message);
			this.name = 'JWSSignatureVerificationFailed';
		}
	},
	JWSInvalid: class JWSInvalid extends Error {
		constructor(message = 'Invalid Compact JWS') {
			super(message);
			this.name = 'JWSInvalid';
		}
	},
};

// Base64url encode/decode utilities
function base64urlEncode(data: Buffer | string): string {
	const buffer = typeof data === 'string' ? Buffer.from(data) : data;
	return buffer.toString('base64url');
}

function base64urlDecode(str: string): Buffer {
	return Buffer.from(str, 'base64url');
}

// SignJWT class for creating JWTs
export class SignJWT {
	private payload: Record<string, unknown>;
	private header: { alg?: string; typ?: string } = { typ: 'JWT' };

	constructor(payload: Record<string, unknown>) {
		this.payload = { ...payload };
	}

	setProtectedHeader(header: { alg: string; [key: string]: unknown }): this {
		this.header = { ...this.header, ...header };
		return this;
	}

	setIssuedAt(iat?: number): this {
		this.payload.iat = iat ?? Math.floor(Date.now() / 1000);
		return this;
	}

	setExpirationTime(exp: string | number): this {
		if (typeof exp === 'string') {
			const match = exp.match(/^(\d+)(s|m|h|d)$/);
			if (match) {
				const [, value, unit] = match;
				const seconds = {
					s: 1,
					m: 60,
					h: 3600,
					d: 86400,
				}[unit]!;
				const iat = (this.payload.iat as number) || Math.floor(Date.now() / 1000);
				this.payload.exp = iat + parseInt(value) * seconds;
			}
		} else {
			this.payload.exp = exp;
		}
		return this;
	}

	setIssuer(issuer: string): this {
		this.payload.iss = issuer;
		return this;
	}

	setAudience(audience: string): this {
		this.payload.aud = audience;
		return this;
	}

	setNotBefore(nbf: number): this {
		this.payload.nbf = nbf;
		return this;
	}

	async sign(secret: Uint8Array): Promise<string> {
		if (this.header.alg !== 'HS256') {
			throw new Error(`Unsupported algorithm: ${this.header.alg}`);
		}

		const headerB64 = base64urlEncode(JSON.stringify(this.header));
		const payloadB64 = base64urlEncode(JSON.stringify(this.payload));
		const signingInput = `${headerB64}.${payloadB64}`;

		const hmac = crypto.createHmac('sha256', Buffer.from(secret));
		hmac.update(signingInput);
		const signature = hmac.digest();

		return `${signingInput}.${base64urlEncode(signature)}`;
	}
}

// jwtVerify function for verifying JWTs
interface VerifyOptions {
	algorithms?: string[];
	issuer?: string;
	audience?: string;
}

export async function jwtVerify(
	token: string,
	secret: Uint8Array,
	options: VerifyOptions = {}
): Promise<{ payload: Record<string, unknown>; protectedHeader: Record<string, unknown> }> {
	if (!token || typeof token !== 'string') {
		throw new errors.JWSInvalid('jwt must be provided');
	}

	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new errors.JWSInvalid('Invalid Compact JWS');
	}

	const [headerB64, payloadB64, signatureB64] = parts;

	// Parse header
	let header: Record<string, unknown>;
	try {
		header = JSON.parse(base64urlDecode(headerB64).toString('utf8'));
	} catch {
		throw new errors.JWSInvalid('Invalid header');
	}

	// Verify algorithm
	if (options.algorithms && !options.algorithms.includes(header.alg as string)) {
		throw new errors.JWSInvalid('Invalid algorithm');
	}

	// Verify signature
	const signingInput = `${headerB64}.${payloadB64}`;
	const hmac = crypto.createHmac('sha256', Buffer.from(secret));
	hmac.update(signingInput);
	const expectedSignature = hmac.digest();
	const actualSignature = base64urlDecode(signatureB64);

	if (!crypto.timingSafeEqual(expectedSignature, actualSignature)) {
		throw new errors.JWSSignatureVerificationFailed('signature verification failed');
	}

	// Parse payload
	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8'));
	} catch {
		throw new errors.JWSInvalid('Invalid payload');
	}

	// Validate claims
	const now = Math.floor(Date.now() / 1000);

	// Check expiration
	if (payload.exp !== undefined && typeof payload.exp === 'number' && payload.exp <= now) {
		throw new errors.JWTExpired('jwt expired');
	}

	// Check not before
	if (payload.nbf !== undefined && typeof payload.nbf === 'number' && payload.nbf > now) {
		throw new errors.JWTClaimValidationFailed('jwt not active yet');
	}

	// Check issuer
	if (options.issuer !== undefined && payload.iss !== options.issuer) {
		throw new errors.JWTClaimValidationFailed(`unexpected "iss" claim value`);
	}

	// Check audience
	if (options.audience !== undefined && payload.aud !== options.audience) {
		throw new errors.JWTClaimValidationFailed(`unexpected "aud" claim value`);
	}

	return { payload, protectedHeader: header };
}

// createRemoteJWKSet mock (returns a verification function)
export function createRemoteJWKSet(
	_url: URL
): (header: unknown, token: unknown) => Promise<Uint8Array> {
	return async () => {
		throw new Error('Remote JWKS not supported in mock');
	};
}

// generateKeyPair mock
export async function generateKeyPair(
	_alg: string
): Promise<{ publicKey: unknown; privateKey: unknown }> {
	throw new Error('generateKeyPair not supported in mock');
}

// exportJWK mock
export async function exportJWK(_key: unknown): Promise<unknown> {
	throw new Error('exportJWK not supported in mock');
}

// importJWK mock
export async function importJWK(_jwk: unknown, _alg?: string): Promise<unknown> {
	throw new Error('importJWK not supported in mock');
}

// decodeJwt helper
export function decodeJwt(token: string): Record<string, unknown> {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new errors.JWSInvalid('Invalid Compact JWS');
	}
	return JSON.parse(base64urlDecode(parts[1]).toString('utf8'));
}

// decodeProtectedHeader helper
export function decodeProtectedHeader(token: string): Record<string, unknown> {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new errors.JWSInvalid('Invalid Compact JWS');
	}
	return JSON.parse(base64urlDecode(parts[0]).toString('utf8'));
}
