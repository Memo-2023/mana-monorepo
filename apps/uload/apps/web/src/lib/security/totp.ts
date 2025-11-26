// TOTP (Time-based One-Time Password) Implementation für 2FA
// Verwendet RFC 6238 Standard

import { createHmac } from 'crypto';

// TOTP Configuration
export interface TOTPConfig {
	secret: string;
	window?: number; // Zeitfenster in 30-Sekunden-Schritten (default: 1)
	digits?: number; // Anzahl Ziffern (default: 6)
	period?: number; // Zeitperiode in Sekunden (default: 30)
	algorithm?: 'sha1' | 'sha256' | 'sha512'; // Hash-Algorithmus (default: sha1)
}

export interface TOTPResult {
	token: string;
	timeRemaining: number;
	window: number;
}

// Base32 Encoding/Decoding für Secrets
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_MAP: { [key: string]: number } = {};
for (let i = 0; i < BASE32_CHARS.length; i++) {
	BASE32_MAP[BASE32_CHARS[i]] = i;
}

function base32Decode(encoded: string): Buffer {
	encoded = encoded.replace(/=+$/, '').toUpperCase();
	let bits = 0;
	let value = 0;
	let output = Buffer.alloc(Math.ceil((encoded.length * 5) / 8));
	let index = 0;

	for (const char of encoded) {
		value = (value << 5) | BASE32_MAP[char];
		bits += 5;

		if (bits >= 8) {
			output[index++] = (value >>> (bits - 8)) & 255;
			bits -= 8;
		}
	}

	return output.slice(0, index);
}

function base32Encode(buffer: Buffer): string {
	let encoded = '';
	let bits = 0;
	let value = 0;

	for (const byte of buffer) {
		value = (value << 8) | byte;
		bits += 8;

		while (bits >= 5) {
			encoded += BASE32_CHARS[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}

	if (bits > 0) {
		encoded += BASE32_CHARS[(value << (5 - bits)) & 31];
	}

	// Padding hinzufügen
	while (encoded.length % 8 !== 0) {
		encoded += '=';
	}

	return encoded;
}

// Secret generieren
export function generateSecret(length: number = 32): string {
	const buffer = Buffer.alloc(length);
	
	// Sichere Zufallsbytes generieren
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		// Browser
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return base32Encode(Buffer.from(array));
	} else {
		// Node.js
		const { randomBytes } = require('crypto');
		return base32Encode(randomBytes(length));
	}
}

// Aktuellen Zeitslot berechnen
function getCurrentTimeSlot(period: number = 30): number {
	return Math.floor(Date.now() / 1000 / period);
}

// HMAC-basierte OTP generieren
function generateHOTP(secret: string, counter: number, digits: number = 6, algorithm: string = 'sha1'): string {
	const key = base32Decode(secret);
	
	// Counter als 8-Byte Big-Endian Buffer
	const counterBuffer = Buffer.alloc(8);
	counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
	counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);

	// HMAC berechnen
	const hmac = createHmac(algorithm, key);
	hmac.update(counterBuffer);
	const hash = hmac.digest();

	// Dynamic truncation (RFC 4226)
	const offset = hash[hash.length - 1] & 0x0f;
	const code = 
		((hash[offset] & 0x7f) << 24) |
		((hash[offset + 1] & 0xff) << 16) |
		((hash[offset + 2] & 0xff) << 8) |
		(hash[offset + 3] & 0xff);

	// Auf gewünschte Anzahl Ziffern reduzieren
	const otp = (code % Math.pow(10, digits)).toString();
	return otp.padStart(digits, '0');
}

// TOTP Token generieren
export function generateTOTP(config: TOTPConfig): TOTPResult {
	const {
		secret,
		digits = 6,
		period = 30,
		algorithm = 'sha1'
	} = config;

	const timeSlot = getCurrentTimeSlot(period);
	const token = generateHOTP(secret, timeSlot, digits, algorithm);
	
	// Verbleibende Zeit bis zum nächsten Token
	const timeRemaining = period - (Math.floor(Date.now() / 1000) % period);

	return {
		token,
		timeRemaining,
		window: timeSlot
	};
}

// TOTP Token verifizieren
export function verifyTOTP(token: string, config: TOTPConfig): boolean {
	const {
		secret,
		window = 1,
		digits = 6,
		period = 30,
		algorithm = 'sha1'
	} = config;

	const currentTimeSlot = getCurrentTimeSlot(period);

	// Prüfe aktuelles und benachbarte Zeitfenster
	for (let i = -window; i <= window; i++) {
		const timeSlot = currentTimeSlot + i;
		const expectedToken = generateHOTP(secret, timeSlot, digits, algorithm);
		
		if (constantTimeEquals(token, expectedToken)) {
			return true;
		}
	}

	return false;
}

// Constant-time string comparison (verhindert Timing-Angriffe)
function constantTimeEquals(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}

// QR Code URL für Authenticator Apps generieren
export function generateQRCodeURL(
	secret: string,
	accountName: string,
	issuer: string = 'uLoad',
	algorithm: string = 'SHA1',
	digits: number = 6,
	period: number = 30
): string {
	const params = new URLSearchParams({
		secret,
		issuer,
		algorithm,
		digits: digits.toString(),
		period: period.toString()
	});

	return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`;
}

// Backup Codes generieren
export function generateBackupCodes(count: number = 10): string[] {
	const codes: string[] = [];
	
	for (let i = 0; i < count; i++) {
		// 8-stellige Backup-Codes generieren
		let code = '';
		for (let j = 0; j < 8; j++) {
			code += Math.floor(Math.random() * 10).toString();
		}
		// Formatierung: XXXX-XXXX
		codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
	}

	return codes;
}

// Backup Code validieren und als verbraucht markieren
export function validateBackupCode(code: string, availableCodes: string[]): { isValid: boolean; remainingCodes: string[] } {
	const normalizedCode = code.replace(/[-\s]/g, '');
	const codeIndex = availableCodes.findIndex(availableCode => 
		availableCode.replace(/[-\s]/g, '') === normalizedCode
	);

	if (codeIndex === -1) {
		return { isValid: false, remainingCodes: availableCodes };
	}

	// Code entfernen (als verbraucht markieren)
	const remainingCodes = [...availableCodes];
	remainingCodes.splice(codeIndex, 1);

	return { isValid: true, remainingCodes };
}

// Hilfsfunktionen für UI
export function formatTOTPToken(token: string): string {
	// Format: XXX XXX
	if (token.length === 6) {
		return `${token.slice(0, 3)} ${token.slice(3, 6)}`;
	}
	return token;
}

export function formatBackupCode(code: string): string {
	// Format: XXXX-XXXX
	const cleanCode = code.replace(/[-\s]/g, '');
	if (cleanCode.length === 8) {
		return `${cleanCode.slice(0, 4)}-${cleanCode.slice(4, 8)}`;
	}
	return code;
}

// Secret für sichere Speicherung verschlüsseln (vereinfacht)
export function encryptSecret(secret: string, password: string): string {
	// In Produktion sollte eine robuste Verschlüsselung verwendet werden
	// Dies ist nur ein Beispiel - verwende crypto.subtle.encrypt() oder ähnliches
	const encoder = new TextEncoder();
	const data = encoder.encode(secret);
	const key = encoder.encode(password.padEnd(32, '0').slice(0, 32));
	
	// XOR-basierte "Verschlüsselung" (NUR FÜR DEMO!)
	const encrypted = new Uint8Array(data.length);
	for (let i = 0; i < data.length; i++) {
		encrypted[i] = data[i] ^ key[i % key.length];
	}
	
	return Buffer.from(encrypted).toString('base64');
}

export function decryptSecret(encryptedSecret: string, password: string): string {
	// Entsprechende Entschlüsselung (NUR FÜR DEMO!)
	const encoder = new TextEncoder();
	const data = Buffer.from(encryptedSecret, 'base64');
	const key = encoder.encode(password.padEnd(32, '0').slice(0, 32));
	
	const decrypted = new Uint8Array(data.length);
	for (let i = 0; i < data.length; i++) {
		decrypted[i] = data[i] ^ key[i % key.length];
	}
	
	return new TextDecoder().decode(decrypted);
}