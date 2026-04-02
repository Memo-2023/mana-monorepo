/**
 * Reminder Worker — Background cron that processes due reminders.
 *
 * Runs every 60 seconds, finds pending reminders whose reminderTime
 * has passed, and dispatches them via mana-notify. Updates status
 * to 'sent' or 'failed' accordingly.
 */

import { eq, and, lte } from 'drizzle-orm';
import { db, reminders, tasks } from '../db';

const MANA_NOTIFY_URL = process.env.MANA_NOTIFY_URL || 'http://localhost:3040';
const SERVICE_KEY =
	process.env.MANA_NOTIFY_SERVICE_KEY || process.env.SERVICE_KEY || 'dev-service-key';
const TODO_WEB_URL = process.env.TODO_WEB_URL || 'http://localhost:5188';
const CHECK_INTERVAL_MS = 60_000; // 1 minute

let timer: ReturnType<typeof setInterval> | null = null;

async function processReminders() {
	try {
		const now = new Date();

		// Find all pending reminders whose time has arrived
		const dueReminders = await db.query.reminders.findMany({
			where: and(eq(reminders.status, 'pending'), lte(reminders.reminderTime, now)),
		});

		if (dueReminders.length === 0) return;

		console.log(`[reminder-worker] Processing ${dueReminders.length} due reminder(s)`);

		for (const reminder of dueReminders) {
			try {
				// Fetch the associated task for context
				const task = await db.query.tasks.findFirst({
					where: eq(tasks.id, reminder.taskId),
				});

				if (!task) {
					// Task was deleted — mark reminder as failed
					await db
						.update(reminders)
						.set({ status: 'failed', sentAt: now })
						.where(eq(reminders.id, reminder.id));
					continue;
				}

				// Send notification via mana-notify
				const channels: string[] = [];
				if (reminder.type === 'push' || reminder.type === 'both') channels.push('push');
				if (reminder.type === 'email' || reminder.type === 'both') channels.push('email');

				for (const channel of channels) {
					await sendNotification({
						userId: reminder.userId,
						channel,
						taskTitle: task.title,
						taskId: task.id,
						dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
					});
				}

				// Mark as sent
				await db
					.update(reminders)
					.set({ status: 'sent', sentAt: now })
					.where(eq(reminders.id, reminder.id));
			} catch (err) {
				console.error(`[reminder-worker] Failed to process reminder ${reminder.id}:`, err);

				// Mark as failed
				await db.update(reminders).set({ status: 'failed' }).where(eq(reminders.id, reminder.id));
			}
		}
	} catch (err) {
		console.error('[reminder-worker] Error in processing loop:', err);
	}
}

async function sendNotification(params: {
	userId: string;
	channel: string;
	taskTitle: string;
	taskId: string;
	dueDate?: string;
}) {
	const { userId, channel, taskTitle, taskId, dueDate } = params;

	const body = {
		userId,
		channel,
		templateSlug: 'task-reminder',
		variables: {
			taskTitle,
			taskUrl: `${TODO_WEB_URL}/task/${taskId}`,
			dueDate: dueDate
				? new Date(dueDate).toLocaleString('de-DE', {
						dateStyle: 'medium',
						timeStyle: 'short',
					})
				: '',
		},
		// Fallback if template not found — send direct
		subject: `Erinnerung: ${taskTitle}`,
		body: `Aufgabe "${taskTitle}" ist ${dueDate ? `fällig am ${new Date(dueDate).toLocaleString('de-DE')}` : 'bald fällig'}.`,
	};

	const response = await fetch(`${MANA_NOTIFY_URL}/api/v1/notifications/send`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Service-Key': SERVICE_KEY,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const text = await response.text().catch(() => 'unknown');
		throw new Error(`mana-notify responded with ${response.status}: ${text}`);
	}
}

export function startReminderWorker() {
	if (timer) return;

	console.log(`[reminder-worker] Started (checking every ${CHECK_INTERVAL_MS / 1000}s)`);

	// Run immediately on startup
	processReminders();

	// Then run on interval
	timer = setInterval(processReminders, CHECK_INTERVAL_MS);
}

export function stopReminderWorker() {
	if (timer) {
		clearInterval(timer);
		timer = null;
		console.log('[reminder-worker] Stopped');
	}
}
