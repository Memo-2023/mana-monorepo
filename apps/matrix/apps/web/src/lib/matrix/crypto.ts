/**
 * Crypto utilities for Matrix E2EE
 */

import type { MatrixClient } from 'matrix-js-sdk';

/**
 * SAS Emoji data type from matrix-js-sdk
 */
export interface SasEmoji {
	emoji: string;
	description: string;
}

/**
 * Verification emoji set (7 emojis)
 */
export type EmojiSet = [SasEmoji, SasEmoji, SasEmoji, SasEmoji, SasEmoji, SasEmoji, SasEmoji];

/**
 * Format device name for display
 */
export function formatDeviceName(displayName?: string, deviceId?: string): string {
	if (displayName) return displayName;
	if (deviceId) {
		// Show first 8 characters of device ID
		return `Device ${deviceId.substring(0, 8)}...`;
	}
	return 'Unknown Device';
}

/**
 * Format timestamp for device last seen
 */
export function formatLastSeen(timestamp?: number): string {
	if (!timestamp) return 'Unknown';

	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
	return date.toLocaleDateString();
}

/**
 * Check if recovery key format is valid
 * Recovery keys are base58 encoded, 28-32 characters
 */
export function isValidRecoveryKey(key: string): boolean {
	const trimmed = key.trim().replace(/\s+/g, '');
	// Recovery keys are typically ~59 characters, space-separated into groups
	// Valid characters are Base58 (no 0, O, I, l)
	const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
	return trimmed.length >= 28 && base58Regex.test(trimmed);
}

/**
 * Format recovery key for display (add spaces every 4 chars)
 */
export function formatRecoveryKey(key: string): string {
	const trimmed = key.replace(/\s+/g, '');
	return trimmed.match(/.{1,4}/g)?.join(' ') || key;
}

/**
 * Get encryption warning level for a room
 */
export function getEncryptionWarningLevel(
	encrypted: boolean,
	allVerified: boolean
): 'none' | 'warning' | 'secure' {
	if (!encrypted) return 'none';
	return allVerified ? 'secure' : 'warning';
}

/**
 * Generate a device display name based on browser/OS info
 */
export function generateDeviceName(): string {
	if (typeof navigator === 'undefined') return 'Mana Matrix Client';

	const ua = navigator.userAgent;
	let browser = 'Browser';
	let os = 'Desktop';

	// Detect browser
	if (ua.includes('Firefox')) browser = 'Firefox';
	else if (ua.includes('Edg')) browser = 'Edge';
	else if (ua.includes('Chrome')) browser = 'Chrome';
	else if (ua.includes('Safari')) browser = 'Safari';

	// Detect OS
	if (ua.includes('Windows')) os = 'Windows';
	else if (ua.includes('Mac')) os = 'macOS';
	else if (ua.includes('Linux')) os = 'Linux';
	else if (ua.includes('Android')) os = 'Android';
	else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

	return `Mana Matrix (${browser} on ${os})`;
}

/**
 * Check if cross-signing should be bootstrapped
 */
export async function shouldBootstrapCrossSigning(client: MatrixClient): Promise<boolean> {
	const crypto = client.getCrypto();
	if (!crypto) return false;

	try {
		const status = await crypto.getCrossSigningStatus();
		// Should bootstrap if we don't have keys on device
		return !status.publicKeysOnDevice;
	} catch {
		return true;
	}
}

/**
 * Check if key backup should be setup
 */
export async function shouldSetupKeyBackup(client: MatrixClient): Promise<boolean> {
	const crypto = client.getCrypto();
	if (!crypto) return false;

	try {
		const backupVersion = await crypto.getActiveSessionBackupVersion();
		return backupVersion === null;
	} catch {
		return true;
	}
}
