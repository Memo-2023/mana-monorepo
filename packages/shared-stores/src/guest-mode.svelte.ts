/**
 * Guest Mode Composable
 *
 * Encapsulates welcome modal visibility, registration nudge timer,
 * and bottom notification state for guest users.
 *
 * Usage:
 *   const guestMode = createGuestMode('manacore', { nudgeDelayMinutes: 3 });
 */

// Inline localStorage utilities (no external dependency needed)
function _shouldShowWelcome(appId: string): boolean {
	if (typeof localStorage === 'undefined') return false;
	return localStorage.getItem(`guest-welcome-seen-${appId}`) !== 'true';
}

function _markWelcomeSeen(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(`guest-welcome-seen-${appId}`, 'true');
}

function _startSession(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	const key = `guest-nudge-session-${appId}`;
	if (!localStorage.getItem(key)) {
		localStorage.setItem(key, Date.now().toString());
	}
}

function _shouldShowNudge(appId: string, delayMinutes: number): boolean {
	if (typeof localStorage === 'undefined') return false;
	if (localStorage.getItem(`guest-nudge-dismissed-${appId}`) === 'true') return false;
	const sessionStart = localStorage.getItem(`guest-nudge-session-${appId}`);
	if (!sessionStart) return false;
	return Date.now() - parseInt(sessionStart, 10) >= delayMinutes * 60 * 1000;
}

function _dismissNudge(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(`guest-nudge-dismissed-${appId}`, 'true');
}

export interface GuestModeNotification {
	id: string;
	message: string;
	type: 'info' | 'warning' | 'error';
	action?: { label: string; icon?: unknown; onClick: () => void };
	dismissible?: boolean;
	onDismiss?: () => void;
}

export interface GuestModeOptions {
	nudgeDelayMinutes?: number;
	nudgeCheckIntervalMs?: number;
	nudgeMessage?: string;
	nudgeActionLabel?: string;
	onRegister?: () => void;
}

export interface GuestMode {
	readonly showWelcome: boolean;
	readonly notifications: GuestModeNotification[];
	dismissWelcome(): void;
	destroy(): void;
}

export function createGuestMode(appId: string, opts?: GuestModeOptions): GuestMode {
	const nudgeDelay = opts?.nudgeDelayMinutes ?? 5;
	const checkInterval = opts?.nudgeCheckIntervalMs ?? 30_000;
	const nudgeMessage =
		opts?.nudgeMessage ?? 'Gefällt es dir? Sichere deine Daten geräteübergreifend.';
	const nudgeActionLabel = opts?.nudgeActionLabel ?? 'Konto erstellen';

	let showWelcome = $state(_shouldShowWelcome(appId));
	let notifications = $state<GuestModeNotification[]>([]);
	let nudgeInterval: ReturnType<typeof setInterval> | null = null;

	_startSession(appId);

	function checkNudge() {
		if (_shouldShowNudge(appId, nudgeDelay)) {
			notifications = [
				{
					id: 'guest-nudge',
					message: nudgeMessage,
					type: 'info' as const,
					action: {
						label: nudgeActionLabel,
						onClick: () => {
							_dismissNudge(appId);
							notifications = [];
							opts?.onRegister?.();
						},
					},
					dismissible: true,
					onDismiss: () => {
						_dismissNudge(appId);
						notifications = [];
					},
				},
			];
			if (nudgeInterval) {
				clearInterval(nudgeInterval);
				nudgeInterval = null;
			}
		}
	}

	checkNudge();
	nudgeInterval = setInterval(checkNudge, checkInterval);

	return {
		get showWelcome() {
			return showWelcome;
		},
		get notifications() {
			return notifications;
		},
		dismissWelcome() {
			showWelcome = false;
			_markWelcomeSeen(appId);
		},
		destroy() {
			if (nudgeInterval) {
				clearInterval(nudgeInterval);
				nudgeInterval = null;
			}
		},
	};
}
