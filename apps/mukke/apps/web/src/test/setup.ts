import { vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

// Mock Audio
class MockAudio {
	src = '';
	currentTime = 0;
	duration = 0;
	volume = 1;
	paused = true;
	error: MediaError | null = null;
	private listeners: Record<string, Function[]> = {};

	addEventListener(event: string, handler: Function) {
		if (!this.listeners[event]) this.listeners[event] = [];
		this.listeners[event].push(handler);
	}

	removeEventListener(event: string, handler: Function) {
		if (this.listeners[event]) {
			this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
		}
	}

	dispatchEvent(event: Event) {
		const handlers = this.listeners[event.type] || [];
		handlers.forEach((h) => h(event));
		return true;
	}

	emit(eventName: string) {
		const handlers = this.listeners[eventName] || [];
		handlers.forEach((h) => h());
	}

	async play() {
		this.paused = false;
		return Promise.resolve();
	}

	pause() {
		this.paused = true;
	}
}
global.Audio = MockAudio as unknown as typeof Audio;

// Mock MediaError
if (typeof global.MediaError === 'undefined') {
	(global as Record<string, unknown>).MediaError = {
		MEDIA_ERR_ABORTED: 1,
		MEDIA_ERR_NETWORK: 2,
		MEDIA_ERR_DECODE: 3,
		MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
	};
}

// Mock MediaSession
if (typeof navigator !== 'undefined' && !('mediaSession' in navigator)) {
	Object.defineProperty(navigator, 'mediaSession', {
		value: {
			metadata: null,
			setActionHandler: vi.fn(),
		},
	});
}

// Reset mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
	localStorageMock.getItem.mockReturnValue(null);
});
