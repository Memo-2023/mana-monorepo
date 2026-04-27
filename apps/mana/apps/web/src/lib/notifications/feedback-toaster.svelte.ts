/**
 * Feedback-Notification-Toaster — boot-time + periodic puller.
 *
 * Fetches `/api/v1/feedback/me/notifications?unread_only=true` on app
 * mount and every POLL_INTERVAL_MS thereafter. Each unread notification
 * is rendered as a Toast and immediately marked read server-side, so
 * we don't show it twice.
 *
 * The richer notification UI (with feedback-link, credit-amount, etc.)
 * lives in /profile/my-wishes — toasts are just the "hey, look here"
 * trigger.
 */

import { feedbackService } from '$lib/api/feedback';
import { authStore } from '$lib/stores/auth.svelte';
import { toast } from '$lib/stores/toast.svelte';

const POLL_INTERVAL_MS = 60_000;

let timer: ReturnType<typeof setInterval> | null = null;
let inflight = false;

async function pullOnce(): Promise<void> {
	if (inflight) return;
	if (!authStore.user) return;
	inflight = true;
	try {
		const items = await feedbackService.getNotifications({ unreadOnly: true, limit: 20 });
		for (const n of items) {
			const message = n.creditsAwarded > 0 ? `${n.title}  ·  +${n.creditsAwarded} Mana` : n.title;
			// Status-completed and reactioner-bonus = success vibes
			// (credits flowing). Everything else is an info.
			const isReward = n.kind === 'status_completed' || n.kind === 'reactioner_bonus';
			(isReward ? toast.success : toast.info)(message);

			// Fire-and-forget mark-read; if it fails, we'll show again on
			// the next poll which is fine — better duplicates than silence.
			void feedbackService.markNotificationRead(n.id).catch((err) => {
				console.warn('[feedback-toaster] mark-read failed:', err);
			});
		}
	} catch (err) {
		console.warn('[feedback-toaster] pull failed:', err);
	} finally {
		inflight = false;
	}
}

export function startFeedbackToaster(): void {
	if (timer) return;
	void pullOnce();
	timer = setInterval(() => {
		void pullOnce();
	}, POLL_INTERVAL_MS);
}

export function stopFeedbackToaster(): void {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
}
