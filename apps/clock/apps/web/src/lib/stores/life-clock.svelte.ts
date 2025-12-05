/**
 * Life Clock store for Clock app
 * Manages the user's birthdate and calculates life statistics
 * SSR-safe implementation with localStorage persistence
 */

import { browser } from '$app/environment';

// Storage key
const BIRTHDATE_KEY = 'clock-birthdate';

// Milestones in days
export const MILESTONES = [
	1000, 2000, 3000, 4000, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 35000, 40000,
];

// Average life expectancy in years (can be customized)
const DEFAULT_LIFE_EXPECTANCY = 82;

// State
let birthdate = $state<string | null>(null);
let initialized = $state(false);

export interface LifeStats {
	daysLived: number;
	hoursLived: number;
	minutesLived: number;
	secondsLived: number;
	weeksLived: number;
	monthsLived: number;
	yearsLived: number;
	exactAge: { years: number; months: number; days: number };
	heartbeats: number;
	breaths: number;
	sleepHours: number;
	mealsEaten: number;
	sunrises: number;
}

export interface MilestoneInfo {
	days: number;
	reached: boolean;
	daysUntil: number;
	date: Date | null;
}

function calculateStats(birthDate: Date, now: Date): LifeStats {
	const diffMs = now.getTime() - birthDate.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffWeeks = Math.floor(diffDays / 7);

	// Calculate exact age
	let years = now.getFullYear() - birthDate.getFullYear();
	let months = now.getMonth() - birthDate.getMonth();
	let days = now.getDate() - birthDate.getDate();

	if (days < 0) {
		months--;
		const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
		days += prevMonth.getDate();
	}
	if (months < 0) {
		years--;
		months += 12;
	}

	const totalMonths = years * 12 + months;

	// Fun facts calculations (approximate averages)
	const heartbeats = Math.floor(diffMinutes * 70); // ~70 bpm average
	const breaths = Math.floor(diffMinutes * 15); // ~15 breaths per minute
	const sleepHours = Math.floor(diffDays * 8); // ~8 hours sleep per day
	const mealsEaten = Math.floor(diffDays * 3); // 3 meals per day
	const sunrises = diffDays;

	return {
		daysLived: diffDays,
		hoursLived: diffHours,
		minutesLived: diffMinutes,
		secondsLived: diffSeconds,
		weeksLived: diffWeeks,
		monthsLived: totalMonths,
		yearsLived: years,
		exactAge: { years, months, days },
		heartbeats,
		breaths,
		sleepHours,
		mealsEaten,
		sunrises,
	};
}

function getMilestones(daysLived: number, birthDate: Date): MilestoneInfo[] {
	return MILESTONES.map((days) => {
		const reached = daysLived >= days;
		const daysUntil = reached ? 0 : days - daysLived;
		const date = reached ? null : new Date(birthDate.getTime() + days * 24 * 60 * 60 * 1000);
		return { days, reached, daysUntil, date };
	});
}

function getNextMilestone(daysLived: number, birthDate: Date): MilestoneInfo | null {
	const milestones = getMilestones(daysLived, birthDate);
	return milestones.find((m) => !m.reached) || null;
}

function getLifeProgress(
	daysLived: number,
	lifeExpectancy: number = DEFAULT_LIFE_EXPECTANCY
): number {
	const expectedDays = lifeExpectancy * 365.25;
	return Math.min((daysLived / expectedDays) * 100, 100);
}

function getRemainingDays(
	daysLived: number,
	lifeExpectancy: number = DEFAULT_LIFE_EXPECTANCY
): number {
	const expectedDays = Math.floor(lifeExpectancy * 365.25);
	return Math.max(expectedDays - daysLived, 0);
}

export const lifeClockStore = {
	// Getters
	get birthdate(): string | null {
		return birthdate;
	},
	get initialized(): boolean {
		return initialized;
	},
	get hasBirthdate(): boolean {
		return birthdate !== null;
	},

	/**
	 * Initialize from localStorage (client-side only)
	 */
	initialize() {
		if (!browser) return;
		if (initialized) return;

		const saved = localStorage.getItem(BIRTHDATE_KEY);
		if (saved) {
			birthdate = saved;
		}

		initialized = true;
	},

	/**
	 * Set the user's birthdate
	 */
	setBirthdate(date: string) {
		birthdate = date;
		if (browser) {
			localStorage.setItem(BIRTHDATE_KEY, date);
		}
	},

	/**
	 * Clear the birthdate
	 */
	clearBirthdate() {
		birthdate = null;
		if (browser) {
			localStorage.removeItem(BIRTHDATE_KEY);
		}
	},

	/**
	 * Get life statistics
	 */
	getStats(now: Date = new Date()): LifeStats | null {
		if (!birthdate) return null;
		const birthDate = new Date(birthdate);
		return calculateStats(birthDate, now);
	},

	/**
	 * Get all milestones
	 */
	getMilestones(now: Date = new Date()): MilestoneInfo[] {
		if (!birthdate) return [];
		const birthDate = new Date(birthdate);
		const stats = calculateStats(birthDate, now);
		return getMilestones(stats.daysLived, birthDate);
	},

	/**
	 * Get next upcoming milestone
	 */
	getNextMilestone(now: Date = new Date()): MilestoneInfo | null {
		if (!birthdate) return null;
		const birthDate = new Date(birthdate);
		const stats = calculateStats(birthDate, now);
		return getNextMilestone(stats.daysLived, birthDate);
	},

	/**
	 * Get life progress percentage
	 */
	getLifeProgress(now: Date = new Date(), lifeExpectancy?: number): number {
		if (!birthdate) return 0;
		const birthDate = new Date(birthdate);
		const stats = calculateStats(birthDate, now);
		return getLifeProgress(stats.daysLived, lifeExpectancy);
	},

	/**
	 * Get remaining days based on life expectancy
	 */
	getRemainingDays(now: Date = new Date(), lifeExpectancy?: number): number {
		if (!birthdate) return 0;
		const birthDate = new Date(birthdate);
		const stats = calculateStats(birthDate, now);
		return getRemainingDays(stats.daysLived, lifeExpectancy);
	},
};
