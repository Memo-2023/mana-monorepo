/**
 * Session Alarms Store - Manages alarms in sessionStorage for guest users (merged from clock module)
 * This allows users to try the app without signing in.
 * Data is stored in sessionStorage (lost when tab closes).
 */

import type { Alarm, CreateAlarmInput, UpdateAlarmInput } from '../types';

const STORAGE_KEY = 'clock-session-alarms';

// State
let alarms = $state<Alarm[]>([]);

// Generate session ID
function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Load from sessionStorage
function loadFromStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			alarms = JSON.parse(stored);
		}
	} catch (e) {
		console.error('Failed to load session alarms:', e);
	}
}

// Save to sessionStorage
function saveToStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
	} catch (e) {
		console.error('Failed to save session alarms:', e);
	}
}

// Initialize on load
if (typeof window !== 'undefined') {
	loadFromStorage();
}

export const sessionAlarmsStore = {
	// Getters
	get alarms() {
		return alarms;
	},
	get enabledAlarms() {
		return alarms.filter((a) => a.enabled);
	},

	/**
	 * Create a new session alarm
	 */
	createAlarm(input: CreateAlarmInput): Alarm {
		const now = new Date().toISOString();
		const alarm: Alarm = {
			id: generateSessionId(),
			label: input.label || null,
			time: input.time,
			enabled: input.enabled ?? true,
			repeatDays: input.repeatDays || null,
			snoozeMinutes: input.snoozeMinutes || null,
			sound: input.sound || null,
			vibrate: input.vibrate ?? null,
			createdAt: now,
			// Session-only store: not synced, no Dexie hook to derive
			// updatedAt from __fieldMeta. Stamp it directly here so the
			// public Alarm shape stays consistent with the synced
			// counterpart (LocalAlarm via the type-converter).
			updatedAt: now,
		};

		alarms = [...alarms, alarm];
		saveToStorage();

		return alarm;
	},

	/**
	 * Update a session alarm
	 */
	updateAlarm(id: string, input: UpdateAlarmInput): Alarm | null {
		const index = alarms.findIndex((a) => a.id === id);
		if (index === -1) return null;

		const updated: Alarm = {
			...alarms[index],
			...input,
		};

		alarms = alarms.map((a) => (a.id === id ? updated : a));
		saveToStorage();

		return updated;
	},

	/**
	 * Toggle alarm enabled state
	 */
	toggleAlarm(id: string): Alarm | null {
		const alarm = alarms.find((a) => a.id === id);
		if (!alarm) return null;

		return this.updateAlarm(id, { enabled: !alarm.enabled });
	},

	/**
	 * Delete a session alarm
	 */
	deleteAlarm(id: string): void {
		alarms = alarms.filter((a) => a.id !== id);
		saveToStorage();
	},

	/**
	 * Check if ID is a session alarm
	 */
	isSessionAlarm(id: string): boolean {
		return id.startsWith('session_');
	},

	/**
	 * Get all alarms for migration
	 */
	getAllAlarms(): Alarm[] {
		return [...alarms];
	},

	/**
	 * Clear all session data
	 */
	clear(): void {
		alarms = [];
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	/**
	 * Get count of session alarms
	 */
	get count(): number {
		return alarms.length;
	},
};
