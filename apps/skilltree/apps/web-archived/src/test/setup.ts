// Test setup file
import { vi } from 'vitest';

// Mock crypto.randomUUID for tests
if (typeof crypto === 'undefined') {
	global.crypto = {
		randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
	} as Crypto;
}
