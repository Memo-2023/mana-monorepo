import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createKeyboardShortcuts } from './keyboard-shortcuts';

describe('createKeyboardShortcuts', () => {
	let registry: ReturnType<typeof createKeyboardShortcuts>;

	beforeEach(() => {
		registry = createKeyboardShortcuts();
		registry.start();
	});

	afterEach(() => {
		registry.stop();
	});

	function fireKey(key: string, options: Partial<KeyboardEventInit> = {}) {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, ...options });
		document.dispatchEvent(event);
	}

	it('fires handler on matching key', () => {
		const handler = vi.fn();
		registry.register([{ key: 'n', handler }]);
		fireKey('n');
		expect(handler).toHaveBeenCalledOnce();
	});

	it('does not fire for non-matching key', () => {
		const handler = vi.fn();
		registry.register([{ key: 'n', handler }]);
		fireKey('m');
		expect(handler).not.toHaveBeenCalled();
	});

	it('matches Ctrl modifier', () => {
		const handler = vi.fn();
		registry.register([{ key: 'n', ctrl: true, handler }]);
		fireKey('n', { ctrlKey: true });
		expect(handler).toHaveBeenCalledOnce();
	});

	it('does not fire Ctrl shortcut without Ctrl', () => {
		const handler = vi.fn();
		registry.register([{ key: 'n', ctrl: true, handler }]);
		fireKey('n');
		expect(handler).not.toHaveBeenCalled();
	});

	it('matches Shift modifier', () => {
		const handler = vi.fn();
		registry.register([{ key: '?', shift: true, handler }]);
		fireKey('?', { shiftKey: true });
		expect(handler).toHaveBeenCalledOnce();
	});

	it('unsubscribe removes bindings', () => {
		const handler = vi.fn();
		const unsub = registry.register([{ key: 'x', handler }]);
		unsub();
		fireKey('x');
		expect(handler).not.toHaveBeenCalled();
	});

	it('ignores input-focused shortcuts by default', () => {
		const handler = vi.fn();
		registry.register([{ key: 'n', handler }]);

		// Simulate input focus
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.focus();

		fireKey('n');
		expect(handler).not.toHaveBeenCalled();

		document.body.removeChild(input);
	});

	it('fires in input when ignoreInputs=false', () => {
		const handler = vi.fn();
		registry.register([{ key: 'Escape', handler, ignoreInputs: false }]);

		const input = document.createElement('input');
		document.body.appendChild(input);
		input.focus();

		fireKey('Escape');
		expect(handler).toHaveBeenCalledOnce();

		document.body.removeChild(input);
	});

	it('getAll returns all registered shortcuts', () => {
		registry.register([
			{ key: 'a', handler: vi.fn() },
			{ key: 'b', handler: vi.fn() },
		]);
		expect(registry.getAll()).toHaveLength(2);
	});

	it('stop prevents further event handling', () => {
		const handler = vi.fn();
		registry.register([{ key: 'n', handler }]);
		registry.stop();
		fireKey('n');
		expect(handler).not.toHaveBeenCalled();
	});

	it('case-insensitive key matching', () => {
		const handler = vi.fn();
		registry.register([{ key: 'n', handler }]);
		fireKey('N');
		expect(handler).toHaveBeenCalledOnce();
	});
});
