/**
 * Lasts — Anniversary + Recognition reminder helpers.
 *
 * Pure date math, no I/O. Surfaces lasts whose anniversary is *today*
 * within the in-app DueBanner (no OS push — that needs PWA push
 * infrastructure that doesn't exist yet, see docs/plans/lasts-module.md
 * M5.b).
 *
 * Strategy:
 *   - Anniversary = `last.date` month/day matches today, year strictly
 *     less than today's year, status === 'confirmed' (only confirmed
 *     dates are anchored facts worth celebrating). Fires every year on
 *     the anniversary day.
 *   - Recognition anniversary = `last.recognisedAt` month/day matches
 *     today with year < today's year. Independent of status because
 *     the act of recognising itself is the milestone (a reclaimed last
 *     can still have a meaningful "I noticed this 2 years ago" stamp).
 */

import type { Last } from '../types';

interface MonthDay {
	month: number; // 1-12
	day: number; // 1-31
}

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

function parseMonthDay(iso: string): MonthDay | null {
	if (typeof iso !== 'string' || iso.length < 10) return null;
	const month = Number(iso.slice(5, 7));
	const day = Number(iso.slice(8, 10));
	if (!Number.isInteger(month) || month < 1 || month > 12) return null;
	if (!Number.isInteger(day) || day < 1 || day > 31) return null;
	return { month, day };
}

function parseYear(iso: string): number | null {
	const y = Number(iso.slice(0, 4));
	return Number.isInteger(y) && y > 1900 ? y : null;
}

/** Years between two ISO dates (today - past). 0 if same year, ignores month/day. */
export function yearsBetween(pastIso: string, todayIso: string): number {
	const past = parseYear(pastIso);
	const now = parseYear(todayIso);
	if (past == null || now == null) return 0;
	return now - past;
}

/**
 * True if `pastIso` falls on the same month-day as `today` in a strictly
 * earlier year. Returns false for same-year (no anniversary on the day
 * something happened).
 */
export function isSameDayOfYear(pastIso: string, today: string = todayIso()): boolean {
	const past = parseMonthDay(pastIso);
	const now = parseMonthDay(today);
	if (!past || !now) return false;
	if (past.month !== now.month || past.day !== now.day) return false;
	const py = parseYear(pastIso);
	const ny = parseYear(today);
	if (py == null || ny == null) return false;
	return py < ny;
}

/** Lasts whose `date` is an anniversary today. Confirmed only. */
export function findAnniversaryLasts(lasts: Last[], today: string = todayIso()): Last[] {
	return lasts.filter((l) => {
		if (l.status !== 'confirmed') return false;
		if (!l.date) return false;
		return isSameDayOfYear(l.date, today);
	});
}

/** Lasts whose `recognisedAt` is an anniversary today. Any status. */
export function findRecognitionAnniversaryLasts(lasts: Last[], today: string = todayIso()): Last[] {
	return lasts.filter((l) => {
		if (!l.recognisedAt) return false;
		return isSameDayOfYear(l.recognisedAt, today);
	});
}
