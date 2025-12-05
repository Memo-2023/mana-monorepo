import type { AccountType, CategoryType } from '../types';

// Account Type Labels
export const ACCOUNT_TYPE_LABELS: Record<AccountType, { de: string; en: string }> = {
	checking: { de: 'Girokonto', en: 'Checking Account' },
	savings: { de: 'Sparkonto', en: 'Savings Account' },
	credit_card: { de: 'Kreditkarte', en: 'Credit Card' },
	cash: { de: 'Bargeld', en: 'Cash' },
	investment: { de: 'Investment', en: 'Investment' },
	loan: { de: 'Kredit', en: 'Loan' },
	other: { de: 'Sonstiges', en: 'Other' },
};

// Account Type Icons
export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
	checking: 'bank',
	savings: 'piggy-bank',
	credit_card: 'credit-card',
	cash: 'wallet',
	investment: 'chart-line-up',
	loan: 'hand-coins',
	other: 'dots-three',
};

// Account Type Colors
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
	checking: '#3b82f6',
	savings: '#22c55e',
	credit_card: '#f97316',
	cash: '#8b5cf6',
	investment: '#06b6d4',
	loan: '#ef4444',
	other: '#6b7280',
};

// Default Categories
export interface DefaultCategory {
	name: { de: string; en: string };
	type: CategoryType;
	color: string;
	icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
	// Expense Categories
	{
		name: { de: 'Lebensmittel', en: 'Groceries' },
		type: 'expense',
		color: '#22c55e',
		icon: 'shopping-cart',
	},
	{
		name: { de: 'Restaurant', en: 'Dining' },
		type: 'expense',
		color: '#f97316',
		icon: 'fork-knife',
	},
	{ name: { de: 'Transport', en: 'Transport' }, type: 'expense', color: '#3b82f6', icon: 'car' },
	{ name: { de: 'Wohnen', en: 'Housing' }, type: 'expense', color: '#8b5cf6', icon: 'house' },
	{
		name: { de: 'Versicherungen', en: 'Insurance' },
		type: 'expense',
		color: '#6b7280',
		icon: 'shield-check',
	},
	{ name: { de: 'Gesundheit', en: 'Health' }, type: 'expense', color: '#ef4444', icon: 'heart' },
	{
		name: { de: 'Unterhaltung', en: 'Entertainment' },
		type: 'expense',
		color: '#ec4899',
		icon: 'game-controller',
	},
	{
		name: { de: 'Shopping', en: 'Shopping' },
		type: 'expense',
		color: '#eab308',
		icon: 'shopping-bag',
	},
	{
		name: { de: 'Bildung', en: 'Education' },
		type: 'expense',
		color: '#6366f1',
		icon: 'graduation-cap',
	},
	{ name: { de: 'Reisen', en: 'Travel' }, type: 'expense', color: '#06b6d4', icon: 'airplane' },
	{
		name: { de: 'Abonnements', en: 'Subscriptions' },
		type: 'expense',
		color: '#a855f7',
		icon: 'repeat',
	},
	{
		name: { de: 'Sonstiges', en: 'Other Expense' },
		type: 'expense',
		color: '#9ca3af',
		icon: 'dots-three',
	},

	// Income Categories
	{ name: { de: 'Gehalt', en: 'Salary' }, type: 'income', color: '#22c55e', icon: 'money' },
	{
		name: { de: 'Nebeneinkommen', en: 'Side Income' },
		type: 'income',
		color: '#3b82f6',
		icon: 'briefcase',
	},
	{
		name: { de: 'Investitionen', en: 'Investments' },
		type: 'income',
		color: '#8b5cf6',
		icon: 'chart-line-up',
	},
	{ name: { de: 'Geschenke', en: 'Gifts' }, type: 'income', color: '#ec4899', icon: 'gift' },
	{
		name: { de: 'Sonstiges', en: 'Other Income' },
		type: 'income',
		color: '#9ca3af',
		icon: 'dots-three',
	},
];

// Supported Currencies
export interface Currency {
	code: string;
	name: { de: string; en: string };
	symbol: string;
	decimalDigits: number;
}

export const CURRENCIES: Currency[] = [
	{ code: 'EUR', name: { de: 'Euro', en: 'Euro' }, symbol: '€', decimalDigits: 2 },
	{ code: 'USD', name: { de: 'US-Dollar', en: 'US Dollar' }, symbol: '$', decimalDigits: 2 },
	{
		code: 'GBP',
		name: { de: 'Britisches Pfund', en: 'British Pound' },
		symbol: '£',
		decimalDigits: 2,
	},
	{
		code: 'CHF',
		name: { de: 'Schweizer Franken', en: 'Swiss Franc' },
		symbol: 'CHF',
		decimalDigits: 2,
	},
	{
		code: 'JPY',
		name: { de: 'Japanischer Yen', en: 'Japanese Yen' },
		symbol: '¥',
		decimalDigits: 0,
	},
	{
		code: 'CAD',
		name: { de: 'Kanadischer Dollar', en: 'Canadian Dollar' },
		symbol: 'C$',
		decimalDigits: 2,
	},
	{
		code: 'AUD',
		name: { de: 'Australischer Dollar', en: 'Australian Dollar' },
		symbol: 'A$',
		decimalDigits: 2,
	},
	{
		code: 'CNY',
		name: { de: 'Chinesischer Yuan', en: 'Chinese Yuan' },
		symbol: '¥',
		decimalDigits: 2,
	},
	{
		code: 'INR',
		name: { de: 'Indische Rupie', en: 'Indian Rupee' },
		symbol: '₹',
		decimalDigits: 2,
	},
	{
		code: 'PLN',
		name: { de: 'Polnischer Zloty', en: 'Polish Zloty' },
		symbol: 'zł',
		decimalDigits: 2,
	},
	{
		code: 'SEK',
		name: { de: 'Schwedische Krone', en: 'Swedish Krona' },
		symbol: 'kr',
		decimalDigits: 2,
	},
	{
		code: 'NOK',
		name: { de: 'Norwegische Krone', en: 'Norwegian Krone' },
		symbol: 'kr',
		decimalDigits: 2,
	},
	{
		code: 'DKK',
		name: { de: 'Dänische Krone', en: 'Danish Krone' },
		symbol: 'kr',
		decimalDigits: 2,
	},
];

export const DEFAULT_CURRENCY = 'EUR';

// Recurrence Frequencies
export const RECURRENCE_FREQUENCIES = [
	{ value: 'daily', label: { de: 'Täglich', en: 'Daily' } },
	{ value: 'weekly', label: { de: 'Wöchentlich', en: 'Weekly' } },
	{ value: 'biweekly', label: { de: 'Zweiwöchentlich', en: 'Biweekly' } },
	{ value: 'monthly', label: { de: 'Monatlich', en: 'Monthly' } },
	{ value: 'yearly', label: { de: 'Jährlich', en: 'Yearly' } },
] as const;

// Date Formats
export const DATE_FORMATS = [
	{ value: 'dd.MM.yyyy', label: 'DD.MM.YYYY (31.12.2024)' },
	{ value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (12/31/2024)' },
	{ value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2024-12-31)' },
	{ value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (31/12/2024)' },
] as const;

// Week Start Options
export const WEEK_START_OPTIONS = [
	{ value: 0, label: { de: 'Sonntag', en: 'Sunday' } },
	{ value: 1, label: { de: 'Montag', en: 'Monday' } },
] as const;

// Budget Alert Thresholds
export const BUDGET_ALERT_THRESHOLDS = [
	{ value: '0.50', label: '50%' },
	{ value: '0.75', label: '75%' },
	{ value: '0.80', label: '80%' },
	{ value: '0.90', label: '90%' },
	{ value: '0.95', label: '95%' },
] as const;

// Chart Colors
export const CHART_COLORS = [
	'#3b82f6', // blue
	'#22c55e', // green
	'#f97316', // orange
	'#8b5cf6', // purple
	'#ef4444', // red
	'#06b6d4', // cyan
	'#ec4899', // pink
	'#eab308', // yellow
	'#6366f1', // indigo
	'#14b8a6', // teal
	'#f43f5e', // rose
	'#84cc16', // lime
];
