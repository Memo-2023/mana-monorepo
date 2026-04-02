import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from './notifications';

describe('notificationService', () => {
	const originalNotification = globalThis.Notification;

	beforeEach(() => {
		// Mock Notification constructor
		const MockNotification = vi.fn() as unknown as typeof Notification;
		Object.defineProperty(MockNotification, 'permission', {
			get: () => 'granted',
			configurable: true,
		});
		MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');
		(globalThis as Record<string, unknown>).Notification = MockNotification;
	});

	afterEach(() => {
		(globalThis as Record<string, unknown>).Notification = originalNotification;
	});

	describe('isSupported', () => {
		it('returns true when Notification is available', () => {
			expect(notificationService.isSupported()).toBe(true);
		});
	});

	describe('hasPermission', () => {
		it('returns true when permission is granted', () => {
			expect(notificationService.hasPermission()).toBe(true);
		});

		it('returns false when permission is denied', () => {
			Object.defineProperty(Notification, 'permission', {
				get: () => 'denied',
				configurable: true,
			});
			expect(notificationService.hasPermission()).toBe(false);
		});
	});

	describe('requestPermission', () => {
		it('returns true when permission granted', async () => {
			const result = await notificationService.requestPermission();
			expect(result).toBe(true);
		});

		it('returns false when permission denied', async () => {
			Object.defineProperty(Notification, 'permission', {
				get: () => 'denied',
				configurable: true,
			});
			const result = await notificationService.requestPermission();
			expect(result).toBe(false);
		});
	});

	describe('send', () => {
		it('creates a Notification with title and body', () => {
			notificationService.send('Test Title', { body: 'Test Body' });
			expect(Notification).toHaveBeenCalledWith(
				'Test Title',
				expect.objectContaining({
					body: 'Test Body',
				})
			);
		});

		it('does nothing without permission', () => {
			Object.defineProperty(Notification, 'permission', {
				get: () => 'denied',
				configurable: true,
			});
			notificationService.send('Test');
			expect(Notification).not.toHaveBeenCalled();
		});

		it('passes tag for deduplication', () => {
			notificationService.send('Test', { tag: 'my-tag' });
			expect(Notification).toHaveBeenCalledWith(
				'Test',
				expect.objectContaining({
					tag: 'my-tag',
				})
			);
		});
	});
});
