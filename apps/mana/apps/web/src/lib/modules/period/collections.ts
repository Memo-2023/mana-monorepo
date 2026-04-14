/**
 * Periods module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalPeriod, LocalPeriodDayLog, LocalPeriodSymptom } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const periodTable = db.table<LocalPeriod>('periods');
export const periodDayLogTable = db.table<LocalPeriodDayLog>('periodDayLogs');
export const periodSymptomTable = db.table<LocalPeriodSymptom>('periodSymptoms');

// ─── Guest Seed ────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export const PERIODS_GUEST_SEED = {
	periods: [
		{
			id: 'period-prev',
			startDate: daysAgo(56),
			periodEndDate: daysAgo(52),
			endDate: daysAgo(29),
			length: 28,
			isPredicted: false,
			isArchived: false,
			notes: null,
		},
		{
			id: 'period-current',
			startDate: daysAgo(28),
			periodEndDate: daysAgo(24),
			endDate: null,
			length: null,
			isPredicted: false,
			isArchived: false,
			notes: 'Aktueller Zyklus',
		},
	] satisfies LocalPeriod[],
	periodDayLogs: [
		{
			id: 'period-log-today',
			logDate: today,
			periodId: 'period-current',
			flow: 'none',
			mood: 'good',
			energy: 4,
			temperature: null,
			cervicalMucus: null,
			symptoms: [],
			sexualActivity: null,
			notes: null,
		},
	] satisfies LocalPeriodDayLog[],
	periodSymptoms: [
		{
			id: 'sym-cramps',
			name: 'Krämpfe',
			category: 'physical',
			color: '#ef4444',
			count: 0,
		},
		{
			id: 'sym-headache',
			name: 'Kopfschmerzen',
			category: 'physical',
			color: '#f97316',
			count: 0,
		},
		{
			id: 'sym-breast-tenderness',
			name: 'Brustspannen',
			category: 'physical',
			color: '#ec4899',
			count: 0,
		},
		{
			id: 'sym-bloating',
			name: 'Blähbauch',
			category: 'physical',
			color: '#a855f7',
			count: 0,
		},
		{
			id: 'sym-acne',
			name: 'Akne',
			category: 'physical',
			color: '#84cc16',
			count: 0,
		},
		{
			id: 'sym-fatigue',
			name: 'Müdigkeit',
			category: 'physical',
			color: '#6366f1',
			count: 0,
		},
		{
			id: 'sym-irritability',
			name: 'Reizbarkeit',
			category: 'emotional',
			color: '#dc2626',
			count: 0,
		},
		{
			id: 'sym-cravings',
			name: 'Heißhunger',
			category: 'emotional',
			color: '#f59e0b',
			count: 0,
		},
		{
			id: 'sym-mood-swings',
			name: 'Stimmungsschwankungen',
			category: 'emotional',
			color: '#0ea5e9',
			count: 0,
		},
		{
			id: 'sym-libido',
			name: 'Erhöhte Libido',
			category: 'other',
			color: '#d946ef',
			count: 0,
		},
	] satisfies LocalPeriodSymptom[],
};
