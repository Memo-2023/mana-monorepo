import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	shouldShowGuestWelcome,
	markGuestWelcomeSeen,
	resetGuestWelcome,
	resetAllGuestWelcome,
} from './guestWelcome';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
	getItem: vi.fn((key: string) => store[key] ?? null),
	setItem: vi.fn((key: string, value: string) => {
		store[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete store[key];
	}),
	get length() {
		return Object.keys(store).length;
	},
	key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
	clear: vi.fn(() => {
		for (const key of Object.keys(store)) delete store[key];
	}),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
	for (const key of Object.keys(store)) delete store[key];
	vi.clearAllMocks();
});

describe('shouldShowGuestWelcome', () => {
	it('returns true when not seen before', () => {
		expect(shouldShowGuestWelcome('todo')).toBe(true);
	});

	it('returns false after marking as seen', () => {
		markGuestWelcomeSeen('todo');
		expect(shouldShowGuestWelcome('todo')).toBe(false);
	});

	it('scopes to app ID', () => {
		markGuestWelcomeSeen('todo');
		expect(shouldShowGuestWelcome('todo')).toBe(false);
		expect(shouldShowGuestWelcome('chat')).toBe(true);
	});
});

describe('markGuestWelcomeSeen', () => {
	it('writes to localStorage with correct key', () => {
		markGuestWelcomeSeen('contacts');
		expect(localStorageMock.setItem).toHaveBeenCalledWith('guest-welcome-seen-contacts', 'true');
	});
});

describe('resetGuestWelcome', () => {
	it('removes the key for a specific app', () => {
		markGuestWelcomeSeen('todo');
		expect(shouldShowGuestWelcome('todo')).toBe(false);
		resetGuestWelcome('todo');
		expect(shouldShowGuestWelcome('todo')).toBe(true);
	});

	it('does not affect other apps', () => {
		markGuestWelcomeSeen('todo');
		markGuestWelcomeSeen('chat');
		resetGuestWelcome('todo');
		expect(shouldShowGuestWelcome('chat')).toBe(false);
	});
});

describe('resetAllGuestWelcome', () => {
	it('removes all guest-welcome keys', () => {
		markGuestWelcomeSeen('todo');
		markGuestWelcomeSeen('chat');
		markGuestWelcomeSeen('calendar');
		resetAllGuestWelcome();
		expect(shouldShowGuestWelcome('todo')).toBe(true);
		expect(shouldShowGuestWelcome('chat')).toBe(true);
		expect(shouldShowGuestWelcome('calendar')).toBe(true);
	});

	it('does not remove unrelated keys', () => {
		store['other-key'] = 'value';
		markGuestWelcomeSeen('todo');
		resetAllGuestWelcome();
		expect(store['other-key']).toBe('value');
	});
});
