export const CURRENCIES = [
	{ code: 'EUR', symbol: '€', name: 'Euro' },
	{ code: 'CHF', symbol: 'CHF', name: 'Schweizer Franken' },
	{ code: 'USD', symbol: '$', name: 'US Dollar' },
	{ code: 'GBP', symbol: '£', name: 'Britisches Pfund' },
] as const;

export const DEFAULT_CURRENCY = 'EUR';

export const ROUNDING_INCREMENTS = [0, 1, 5, 6, 10, 15] as const;

export const PROJECT_COLORS: string[] = [
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#eab308',
	'#84cc16',
	'#22c55e',
	'#14b8a6',
	'#06b6d4',
	'#0ea5e9',
	'#3b82f6',
	'#6366f1',
	'#8b5cf6',
	'#a855f7',
	'#d946ef',
	'#ec4899',
	'#f43f5e',
];

export const DEFAULT_SETTINGS = {
	workingHoursPerDay: 8,
	workingDaysPerWeek: 5,
	roundingIncrement: 0,
	roundingMethod: 'none' as const,
	defaultVisibility: 'private' as const,
	weekStartsOn: 1 as const,
	timerReminderMinutes: 0,
	autoStopTimerHours: 0,
};
