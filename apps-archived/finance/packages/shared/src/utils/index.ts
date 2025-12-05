import { CURRENCIES, DEFAULT_CURRENCY } from '../constants';

/**
 * Format a number as currency
 */
export function formatCurrency(
	amount: number | string,
	currency: string = DEFAULT_CURRENCY,
	locale: string = 'de-DE'
): string {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	const currencyInfo = CURRENCIES.find((c) => c.code === currency);

	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: currencyInfo?.decimalDigits ?? 2,
		maximumFractionDigits: currencyInfo?.decimalDigits ?? 2,
	}).format(numAmount);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(amount: number | string, locale: string = 'de-DE'): string {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	return new Intl.NumberFormat(locale).format(numAmount);
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(value: string): number {
	// Remove currency symbols and thousand separators
	const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
	return parseFloat(cleaned) || 0;
}

/**
 * Format a date string
 */
export function formatDate(
	date: string | Date,
	format: string = 'dd.MM.yyyy',
	locale: string = 'de-DE'
): string {
	const d = typeof date === 'string' ? new Date(date) : date;

	const day = d.getDate().toString().padStart(2, '0');
	const month = (d.getMonth() + 1).toString().padStart(2, '0');
	const year = d.getFullYear().toString();

	switch (format) {
		case 'dd.MM.yyyy':
			return `${day}.${month}.${year}`;
		case 'MM/dd/yyyy':
			return `${month}/${day}/${year}`;
		case 'yyyy-MM-dd':
			return `${year}-${month}-${day}`;
		case 'dd/MM/yyyy':
			return `${day}/${month}/${year}`;
		default:
			return d.toLocaleDateString(locale);
	}
}

/**
 * Get the current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
	const now = new Date();
	return {
		month: now.getMonth() + 1,
		year: now.getFullYear(),
	};
}

/**
 * Get date range for a month
 */
export function getMonthDateRange(
	month: number,
	year: number
): { startDate: string; endDate: string } {
	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 0); // Last day of month

	return {
		startDate: startDate.toISOString().split('T')[0],
		endDate: endDate.toISOString().split('T')[0],
	};
}

/**
 * Calculate budget percentage
 */
export function calculateBudgetPercentage(spent: number, budgeted: number): number {
	if (budgeted <= 0) return 0;
	return Math.round((spent / budgeted) * 100);
}

/**
 * Get budget status based on percentage
 */
export function getBudgetStatus(percentage: number): 'ok' | 'warning' | 'danger' | 'over' {
	if (percentage >= 100) return 'over';
	if (percentage >= 90) return 'danger';
	if (percentage >= 75) return 'warning';
	return 'ok';
}

/**
 * Generate a color from a string (for consistent category colors)
 */
export function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const hue = hash % 360;
	return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Calculate net worth from accounts
 */
export function calculateNetWorth(
	accounts: { balance: string; type: string; includeInTotal: boolean }[]
): number {
	return accounts
		.filter((a) => a.includeInTotal)
		.reduce((sum, account) => {
			const balance = parseFloat(account.balance);
			// Credit cards and loans are liabilities (negative)
			if (account.type === 'credit_card' || account.type === 'loan') {
				return sum - Math.abs(balance);
			}
			return sum + balance;
		}, 0);
}

/**
 * Group transactions by date
 */
export function groupByDate<T extends { date: string }>(items: T[]): Record<string, T[]> {
	return items.reduce(
		(groups, item) => {
			const date = item.date;
			if (!groups[date]) {
				groups[date] = [];
			}
			groups[date].push(item);
			return groups;
		},
		{} as Record<string, T[]>
	);
}

/**
 * Group transactions by category
 */
export function groupByCategory<T extends { categoryId?: string }>(
	items: T[]
): Record<string, T[]> {
	return items.reduce(
		(groups, item) => {
			const categoryId = item.categoryId || 'uncategorized';
			if (!groups[categoryId]) {
				groups[categoryId] = [];
			}
			groups[categoryId].push(item);
			return groups;
		},
		{} as Record<string, T[]>
	);
}

/**
 * Sort by date (newest first)
 */
export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
	return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Sort by date (oldest first)
 */
export function sortByDateAsc<T extends { date: string }>(items: T[]): T[] {
	return [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate sum of amounts
 */
export function sumAmounts(items: { amount: string }[]): number {
	return items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
}

/**
 * Validate IBAN (basic check)
 */
export function isValidIBAN(iban: string): boolean {
	const cleaned = iban.replace(/\s/g, '').toUpperCase();
	return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(cleaned);
}

/**
 * Format IBAN with spaces
 */
export function formatIBAN(iban: string): string {
	const cleaned = iban.replace(/\s/g, '').toUpperCase();
	return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
}
