import { describe, it, expect, vi } from 'vitest';
import { StorageHooks } from './hooks';

describe('StorageHooks', () => {
	it('calls registered hook on emit', () => {
		const hooks = new StorageHooks();
		const handler = vi.fn();

		hooks.on('upload', handler);
		hooks.emit('upload', { bucket: 'test', key: 'file.png' });

		expect(handler).toHaveBeenCalledWith({ bucket: 'test', key: 'file.png' });
	});

	it('supports multiple hooks for same event', () => {
		const hooks = new StorageHooks();
		const h1 = vi.fn();
		const h2 = vi.fn();

		hooks.on('upload', h1);
		hooks.on('upload', h2);
		hooks.emit('upload', { bucket: 'test', key: 'file.png' });

		expect(h1).toHaveBeenCalled();
		expect(h2).toHaveBeenCalled();
	});

	it('returns unsubscribe function', () => {
		const hooks = new StorageHooks();
		const handler = vi.fn();

		const unsub = hooks.on('upload', handler);
		unsub();
		hooks.emit('upload', { bucket: 'test', key: 'file.png' });

		expect(handler).not.toHaveBeenCalled();
	});

	it('does not throw when emitting with no listeners', () => {
		const hooks = new StorageHooks();
		expect(() => hooks.emit('upload', { bucket: 'test', key: 'file.png' })).not.toThrow();
	});

	it('swallows errors in hooks', () => {
		const hooks = new StorageHooks();
		const good = vi.fn();

		hooks.on('upload', () => {
			throw new Error('hook error');
		});
		hooks.on('upload', good);
		hooks.emit('upload', { bucket: 'test', key: 'file.png' });

		expect(good).toHaveBeenCalled();
	});

	it('removeAll clears all listeners', () => {
		const hooks = new StorageHooks();
		const handler = vi.fn();

		hooks.on('upload', handler);
		hooks.on('delete', handler);
		hooks.removeAll();

		hooks.emit('upload', { bucket: 'test', key: 'file.png' });
		hooks.emit('delete', { bucket: 'test', keys: ['a'] });

		expect(handler).not.toHaveBeenCalled();
	});

	it('emits different event types independently', () => {
		const hooks = new StorageHooks();
		const uploadHandler = vi.fn();
		const deleteHandler = vi.fn();

		hooks.on('upload', uploadHandler);
		hooks.on('delete', deleteHandler);
		hooks.emit('upload', { bucket: 'test', key: 'file.png' });

		expect(uploadHandler).toHaveBeenCalled();
		expect(deleteHandler).not.toHaveBeenCalled();
	});
});
