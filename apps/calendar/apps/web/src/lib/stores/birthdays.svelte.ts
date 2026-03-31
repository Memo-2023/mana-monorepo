/**
 * Birthdays Store - Manages contact birthdays for calendar display
 * Cross-app integration with Contacts Backend
 */

import { browser } from '$app/environment';
import * as api from '$lib/api/birthdays';
import type { ContactBirthdaySummary, BirthdayEvent } from '$lib/api/birthdays';
import { getContactDisplayName, BIRTHDAY_CALENDAR } from '$lib/api/birthdays';
import { differenceInYears, isSameDay, isWithinInterval, parseISO, format } from 'date-fns';

// Re-export types for convenience
export type { ContactBirthdaySummary, BirthdayEvent };

// ============================================
// State
// ============================================

let birthdays = $state<ContactBirthdaySummary[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let serviceAvailable = $state(true);
let lastFetchTime = $state<number>(0);

// Cache settings
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// Store Export
// ============================================

export const birthdaysStore = {
	// ========== Getters ==========
	get birthdays() {
		return birthdays ?? [];
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get serviceAvailable() {
		return serviceAvailable;
	},
	get calendarId() {
		return BIRTHDAY_CALENDAR.id;
	},
	get calendarColor() {
		return BIRTHDAY_CALENDAR.color;
	},
	get calendarName() {
		return BIRTHDAY_CALENDAR.name;
	},

	// ========== Birthday Getters ==========

	/**
	 * Get birthday events for a specific day
	 * Matches by month and day (ignores year)
	 */
	getBirthdaysForDay(date: Date): BirthdayEvent[] {
		const currentBirthdays = birthdays ?? [];
		if (!Array.isArray(currentBirthdays) || currentBirthdays.length === 0) return [];

		return currentBirthdays
			.filter((contact) => {
				if (!contact.birthday) return false;
				const birthdayDate = parseISO(contact.birthday);
				// Compare month and day only
				return (
					birthdayDate.getMonth() === date.getMonth() && birthdayDate.getDate() === date.getDate()
				);
			})
			.map((contact) => this.toBirthdayEvent(contact, date));
	},

	/**
	 * Get birthday events within a date range
	 */
	getBirthdaysInRange(start: Date, end: Date): BirthdayEvent[] {
		const currentBirthdays = birthdays ?? [];
		if (!Array.isArray(currentBirthdays) || currentBirthdays.length === 0) return [];

		const events: BirthdayEvent[] = [];
		const current = new Date(start);

		// Iterate through each day in range
		while (current <= end) {
			const dayBirthdays = this.getBirthdaysForDay(current);
			events.push(...dayBirthdays);
			current.setDate(current.getDate() + 1);
		}

		return events;
	},

	/**
	 * Check if a specific day has any birthdays
	 */
	hasBirthdaysOnDay(date: Date): boolean {
		const currentBirthdays = birthdays ?? [];
		if (!Array.isArray(currentBirthdays)) return false;

		return currentBirthdays.some((contact) => {
			if (!contact.birthday) return false;
			const birthdayDate = parseISO(contact.birthday);
			return (
				birthdayDate.getMonth() === date.getMonth() && birthdayDate.getDate() === date.getDate()
			);
		});
	},

	/**
	 * Get upcoming birthdays (next N days)
	 */
	getUpcomingBirthdays(days: number = 30): BirthdayEvent[] {
		const start = new Date();
		const end = new Date();
		end.setDate(end.getDate() + days);
		return this.getBirthdaysInRange(start, end);
	},

	/**
	 * Convert contact to birthday event
	 */
	toBirthdayEvent(contact: ContactBirthdaySummary, displayDate: Date): BirthdayEvent {
		const displayName = getContactDisplayName(contact);
		const birthdayDate = parseISO(contact.birthday);
		const birthYear = birthdayDate.getFullYear();

		// Calculate age (0 if year seems invalid, e.g., 1900 default)
		let age = differenceInYears(displayDate, birthdayDate);
		if (birthYear < 1900 || birthYear > new Date().getFullYear()) {
			age = 0; // Unknown birth year
		}

		const dateStr = format(displayDate, 'yyyy-MM-dd');

		return {
			id: `birthday-${contact.id}-${dateStr}`,
			contactId: contact.id,
			title: `${displayName}`,
			displayName,
			photoUrl: contact.photoUrl,
			birthday: contact.birthday,
			age,
			startTime: displayDate.toISOString(),
			endTime: displayDate.toISOString(),
			isAllDay: true,
			isBirthday: true,
			calendarId: BIRTHDAY_CALENDAR.id,
		};
	},

	// ========== API Methods ==========

	/**
	 * Fetch birthdays from Contacts service
	 * Uses cache to avoid frequent refetches
	 */
	async fetchBirthdays(force = false) {
		if (!browser) return;

		// Use cache if still valid
		if (!force && Date.now() - lastFetchTime < CACHE_TTL && birthdays.length > 0) {
			return;
		}

		loading = true;
		error = null;

		const result = await api.getBirthdays();

		if (result.error) {
			error = result.error.message;
			serviceAvailable = false;
		} else {
			birthdays = result.data || [];
			serviceAvailable = true;
			lastFetchTime = Date.now();
		}

		loading = false;
	},

	/**
	 * Check if Contacts service is available
	 */
	async checkServiceHealth(): Promise<boolean> {
		const result = await api.getBirthdays();
		serviceAvailable = !result.error;
		return serviceAvailable;
	},

	/**
	 * Clear birthdays cache
	 */
	clear() {
		birthdays = [];
		lastFetchTime = 0;
	},

	/**
	 * Get contact by ID from cached birthdays
	 */
	getContactById(id: string): ContactBirthdaySummary | undefined {
		const currentBirthdays = birthdays ?? [];
		if (!Array.isArray(currentBirthdays)) return undefined;
		return currentBirthdays.find((c) => c.id === id);
	},

	/**
	 * Count of contacts with birthdays
	 */
	get count(): number {
		return birthdays?.length ?? 0;
	},
};
