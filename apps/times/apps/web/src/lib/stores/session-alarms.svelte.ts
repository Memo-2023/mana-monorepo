/**
 * Session Alarms Store - Manages alarms in sessionStorage for guest users
 */

import type { Alarm, CreateAlarmInput, UpdateAlarmInput } from '@times/shared';

const STORAGE_KEY = 'times-session-alarms';

let alarms = $state<Alarm[]>([]);

function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

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

function saveToStorage(): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
	} catch (e) {
		console.error('Failed to save session alarms:', e);
	}
}

if (typeof window !== 'undefined') {
	loadFromStorage();
}

export const sessionAlarmsStore = {
	get alarms() {
		return alarms;
	},
	get enabledAlarms() {
		return alarms.filter((a) => a.enabled);
	},

	createAlarm(input: CreateAlarmInput): Alarm {
		const now = new Date().toISOString();
		const alarm: Alarm = {
			id: generateSessionId(),
			userId: 'guest',
			label: input.label || null,
			time: input.time,
			enabled: input.enabled ?? true,
			repeatDays: input.repeatDays || null,
			snoozeMinutes: input.snoozeMinutes || null,
			sound: input.sound || null,
			vibrate: input.vibrate ?? null,
			createdAt: now,
			updatedAt: now,
		};

		alarms = [...alarms, alarm];
		saveToStorage();
		return alarm;
	},

	updateAlarm(id: string, input: UpdateAlarmInput): Alarm | null {
		const index = alarms.findIndex((a) => a.id === id);
		if (index === -1) return null;

		const updated: Alarm = {
			...alarms[index],
			...input,
			updatedAt: new Date().toISOString(),
		};

		alarms = alarms.map((a) => (a.id === id ? updated : a));
		saveToStorage();
		return updated;
	},

	toggleAlarm(id: string): Alarm | null {
		const alarm = alarms.find((a) => a.id === id);
		if (!alarm) return null;
		return this.updateAlarm(id, { enabled: !alarm.enabled });
	},

	deleteAlarm(id: string): void {
		alarms = alarms.filter((a) => a.id !== id);
		saveToStorage();
	},

	isSessionAlarm(id: string): boolean {
		return id.startsWith('session_');
	},

	getAllAlarms(): Alarm[] {
		return [...alarms];
	},

	clear(): void {
		alarms = [];
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	get count(): number {
		return alarms.length;
	},
};
