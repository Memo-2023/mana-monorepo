import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createReminderScheduler } from './reminder-scheduler';

function createMockNotifier(hasPermission = true) {
	return {
		hasPermission: vi.fn(() => hasPermission),
		send: vi.fn(),
	};
}

describe('createReminderScheduler', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('calls checkDue on each source during checkNow', async () => {
		const notifier = createMockNotifier();
		const source = {
			id: 'test',
			checkDue: vi.fn().mockResolvedValue([]),
			markSent: vi.fn(),
		};

		const scheduler = createReminderScheduler({ sources: [source], notifier });
		await scheduler.checkNow();
		expect(source.checkDue).toHaveBeenCalledOnce();
	});

	it('sends notification for due reminders', async () => {
		const notifier = createMockNotifier();
		const source = {
			id: 'test',
			checkDue: vi
				.fn()
				.mockResolvedValue([
					{ id: 'r1', title: 'Task fällig', body: 'In 5 Minuten', tag: 'test-r1' },
				]),
			markSent: vi.fn(),
		};

		const scheduler = createReminderScheduler({ sources: [source], notifier });
		await scheduler.checkNow();

		expect(notifier.send).toHaveBeenCalledWith('Task fällig', {
			body: 'In 5 Minuten',
			tag: 'test-r1',
		});
	});

	it('calls markSent after sending notification', async () => {
		const notifier = createMockNotifier();
		const source = {
			id: 'test',
			checkDue: vi.fn().mockResolvedValue([{ id: 'r1', title: 'Test', tag: 'test-r1' }]),
			markSent: vi.fn(),
		};

		const scheduler = createReminderScheduler({ sources: [source], notifier });
		await scheduler.checkNow();

		expect(source.markSent).toHaveBeenCalledWith('r1');
	});

	it('skips check if no permission', async () => {
		const notifier = createMockNotifier(false);
		const source = {
			id: 'test',
			checkDue: vi.fn().mockResolvedValue([]),
			markSent: vi.fn(),
		};

		const scheduler = createReminderScheduler({ sources: [source], notifier });
		await scheduler.checkNow();

		expect(source.checkDue).not.toHaveBeenCalled();
	});

	it('handles errors gracefully', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const notifier = createMockNotifier();
		const source = {
			id: 'broken',
			checkDue: vi.fn().mockRejectedValue(new Error('DB error')),
			markSent: vi.fn(),
		};

		const scheduler = createReminderScheduler({ sources: [source], notifier });
		await scheduler.checkNow();

		expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('broken'), expect.any(Error));
		consoleError.mockRestore();
	});

	it('checks multiple sources', async () => {
		const notifier = createMockNotifier();
		const source1 = {
			id: 'todo',
			checkDue: vi.fn().mockResolvedValue([{ id: 'r1', title: 'Task', tag: 'todo-r1' }]),
			markSent: vi.fn(),
		};
		const source2 = {
			id: 'calendar',
			checkDue: vi.fn().mockResolvedValue([{ id: 'r2', title: 'Event', tag: 'cal-r2' }]),
			markSent: vi.fn(),
		};

		const scheduler = createReminderScheduler({ sources: [source1, source2], notifier });
		await scheduler.checkNow();

		expect(notifier.send).toHaveBeenCalledTimes(2);
		expect(source1.markSent).toHaveBeenCalledWith('r1');
		expect(source2.markSent).toHaveBeenCalledWith('r2');
	});

	it('addSource adds a new source at runtime', async () => {
		const notifier = createMockNotifier();
		const scheduler = createReminderScheduler({ sources: [], notifier });
		const source = {
			id: 'late',
			checkDue: vi.fn().mockResolvedValue([]),
			markSent: vi.fn(),
		};

		scheduler.addSource(source);
		await scheduler.checkNow();
		expect(source.checkDue).toHaveBeenCalledOnce();
	});

	it('start/stop controls the interval', async () => {
		const notifier = createMockNotifier();
		const source = {
			id: 'test',
			checkDue: vi.fn().mockResolvedValue([]),
			markSent: vi.fn(),
		};

		const scheduler = createReminderScheduler({ sources: [source], notifier, intervalMs: 1000 });
		scheduler.start();

		// Initial delay check (2s)
		await vi.advanceTimersByTimeAsync(2100);
		expect(source.checkDue).toHaveBeenCalled();

		// Interval check
		source.checkDue.mockClear();
		await vi.advanceTimersByTimeAsync(1000);
		expect(source.checkDue).toHaveBeenCalled();

		scheduler.stop();
		source.checkDue.mockClear();
		await vi.advanceTimersByTimeAsync(5000);
		expect(source.checkDue).not.toHaveBeenCalled();
	});
});
