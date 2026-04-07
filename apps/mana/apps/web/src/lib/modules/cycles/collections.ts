/**
 * Cycles module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalCycle, LocalCycleDayLog, LocalCycleSymptom } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const cycleTable = db.table<LocalCycle>('cycles');
export const cycleDayLogTable = db.table<LocalCycleDayLog>('cycleDayLogs');
export const cycleSymptomTable = db.table<LocalCycleSymptom>('cycleSymptoms');

// ─── Guest Seed ────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export const CYCLES_GUEST_SEED = {
	cycles: [
		{
			id: 'cycle-prev',
			startDate: daysAgo(56),
			periodEndDate: daysAgo(52),
			endDate: daysAgo(29),
			length: 28,
			isPredicted: false,
			isArchived: false,
			notes: null,
		},
		{
			id: 'cycle-current',
			startDate: daysAgo(28),
			periodEndDate: daysAgo(24),
			endDate: null,
			length: null,
			isPredicted: false,
			isArchived: false,
			notes: 'Aktueller Zyklus',
		},
	] satisfies LocalCycle[],
	cycleDayLogs: [
		{
			id: 'cycle-log-today',
			logDate: today,
			cycleId: 'cycle-current',
			flow: 'none',
			mood: 'good',
			energy: 4,
			temperature: null,
			cervicalMucus: null,
			symptoms: [],
			sexualActivity: null,
			notes: null,
		},
	] satisfies LocalCycleDayLog[],
	cycleSymptoms: [
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
	] satisfies LocalCycleSymptom[],
};
