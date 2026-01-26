import { DISPLAY_NAMES } from '../config/configuration';
import { UmamiStats } from '../umami/umami.service';

export function formatNumber(num: number): string {
	return num.toLocaleString('de-DE');
}

export function formatChange(change: number): string {
	if (change === 0) return '→';
	const sign = change > 0 ? '+' : '';
	return `${sign}${Math.round(change)}%`;
}

export function formatChangeEmoji(change: number): string {
	if (change > 10) return '📈';
	if (change > 0) return '↗';
	if (change < -10) return '📉';
	if (change < 0) return '↘';
	return '→';
}

export function getDisplayName(websiteKey: string): string {
	return DISPLAY_NAMES[websiteKey] || websiteKey;
}

export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
	const options: Intl.DateTimeFormatOptions =
		format === 'short'
			? { day: 'numeric', month: 'numeric', year: 'numeric' }
			: { day: 'numeric', month: 'long', year: 'numeric' };
	return date.toLocaleDateString('de-DE', options);
}

export function formatWeekNumber(date: Date): string {
	const startOfYear = new Date(date.getFullYear(), 0, 1);
	const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
	const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
	return `KW ${weekNumber}`;
}

export function formatDailyReport(stats: Map<string, UmamiStats>, date: Date): string {
	const lines: string[] = [
		'📊 <b>ManaCore Daily Report</b>',
		'━━━━━━━━━━━━━━━━━━━━',
		'',
		`📅 ${formatDate(date, 'long')}`,
		'',
		'<b>📈 Besucher heute:</b>',
	];

	// Sort by visitors (descending)
	const sortedStats = Array.from(stats.entries())
		.filter(([key]) => key.endsWith('-webapp'))
		.sort((a, b) => b[1].visitors.value - a[1].visitors.value);

	let totalVisitors = 0;
	let totalPageviews = 0;

	for (const [key, stat] of sortedStats) {
		const name = getDisplayName(key).padEnd(12);
		const visitors = stat.visitors.value;
		const change = formatChange(stat.visitors.change);
		const emoji = formatChangeEmoji(stat.visitors.change);

		totalVisitors += visitors;
		totalPageviews += stat.pageviews.value;

		lines.push(`  ${name}: ${formatNumber(visitors)} (${change}) ${emoji}`);
	}

	lines.push('');
	lines.push(`📄 <b>Pageviews:</b> ${formatNumber(totalPageviews)}`);
	lines.push(`👥 <b>Besucher gesamt:</b> ${formatNumber(totalVisitors)}`);

	return lines.join('\n');
}

export function formatWeeklyReport(
	stats: Map<string, UmamiStats>,
	weekStart: Date,
	weekEnd: Date,
	prevStats?: Map<string, UmamiStats>
): string {
	const lines: string[] = [
		'📊 <b>ManaCore Weekly Report</b>',
		'━━━━━━━━━━━━━━━━━━━━',
		'',
		`📅 ${formatWeekNumber(weekStart)} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
		'',
		'            Besucher  Pageviews',
	];

	// Sort by visitors (descending)
	const sortedStats = Array.from(stats.entries())
		.filter(([key]) => key.endsWith('-webapp'))
		.sort((a, b) => b[1].visitors.value - a[1].visitors.value);

	let totalVisitors = 0;
	let totalPageviews = 0;

	for (const [key, stat] of sortedStats) {
		const name = getDisplayName(key).padEnd(12);
		const visitors = formatNumber(stat.visitors.value).padStart(6);
		const pageviews = formatNumber(stat.pageviews.value).padStart(9);

		totalVisitors += stat.visitors.value;
		totalPageviews += stat.pageviews.value;

		lines.push(`${name}: ${visitors}  ${pageviews}`);
	}

	lines.push('────────────────────────────');
	lines.push(
		`<b>Total:</b>       ${formatNumber(totalVisitors).padStart(6)}  ${formatNumber(totalPageviews).padStart(9)}`
	);

	// Calculate week-over-week change if previous stats available
	if (prevStats) {
		let prevTotal = 0;
		for (const [key, stat] of prevStats.entries()) {
			if (key.endsWith('-webapp')) {
				prevTotal += stat.visitors.value;
			}
		}
		if (prevTotal > 0) {
			const change = ((totalVisitors - prevTotal) / prevTotal) * 100;
			lines.push('');
			lines.push(`📊 <b>vs. Vorwoche:</b> ${formatChange(change)} ${formatChangeEmoji(change)}`);
		}
	}

	return lines.join('\n');
}

export function formatRealtimeReport(activeVisitors: Map<string, number>): string {
	const lines: string[] = ['🔴 <b>Realtime - Aktive Besucher</b>', '━━━━━━━━━━━━━━━━━━━━', ''];

	// Sort by active visitors (descending)
	const sortedVisitors = Array.from(activeVisitors.entries())
		.filter(([key]) => key.endsWith('-webapp'))
		.sort((a, b) => b[1] - a[1]);

	let total = 0;

	for (const [key, count] of sortedVisitors) {
		const name = getDisplayName(key).padEnd(12);
		total += count;
		const indicator = count > 0 ? '🟢' : '⚪';
		lines.push(`${indicator} ${name}: ${count}`);
	}

	lines.push('');
	lines.push(`👥 <b>Gesamt aktiv:</b> ${total}`);

	return lines.join('\n');
}

export function formatStatsOverview(stats: Map<string, UmamiStats>): string {
	const lines: string[] = ['📊 <b>ManaCore Stats Übersicht</b>', '━━━━━━━━━━━━━━━━━━━━', ''];

	// Group by type
	const webapps = Array.from(stats.entries())
		.filter(([key]) => key.endsWith('-webapp'))
		.sort((a, b) => b[1].visitors.value - a[1].visitors.value);

	const landings = Array.from(stats.entries())
		.filter(([key]) => key.endsWith('-landing'))
		.sort((a, b) => b[1].visitors.value - a[1].visitors.value);

	lines.push('<b>🌐 Web Apps:</b>');
	for (const [key, stat] of webapps) {
		const name = getDisplayName(key).padEnd(12);
		lines.push(`  ${name}: ${formatNumber(stat.visitors.value)} visitors`);
	}

	if (landings.length > 0) {
		lines.push('');
		lines.push('<b>🏠 Landing Pages:</b>');
		for (const [key, stat] of landings) {
			const name = getDisplayName(key).padEnd(12);
			lines.push(`  ${name}: ${formatNumber(stat.visitors.value)} visitors`);
		}
	}

	return lines.join('\n');
}

export function formatHelpMessage(): string {
	return `🤖 <b>ManaCore Stats Bot</b>
━━━━━━━━━━━━━━━━━━━━

Verfügbare Befehle:

/stats - Übersicht aller Apps
/today - Heutige Statistiken
/week - Wochenstatistiken
/realtime - Aktive Besucher jetzt
/users - Registrierte User
/help - Diese Hilfe anzeigen

📅 Automatische Reports:
• Daily: Jeden Tag um 9:00
• Weekly: Jeden Montag um 9:00`;
}

export interface DailyRegistration {
	date: string;
	count: number;
}

export interface UserStats {
	totalUsers: number;
	verifiedUsers: number;
	todayNewUsers: number;
	yesterdayNewUsers: number;
	weekNewUsers: number;
	lastWeekNewUsers: number;
	monthNewUsers: number;
	dailyRegistrations: DailyRegistration[];
}

function createMiniBarChart(dailyRegistrations: DailyRegistration[]): string[] {
	if (dailyRegistrations.length === 0) return [];

	const maxCount = Math.max(...dailyRegistrations.map((d) => d.count), 1);
	const barChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

	// Fill in missing days and sort
	const last7Days: DailyRegistration[] = [];
	for (let i = 6; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split('T')[0];
		const found = dailyRegistrations.find((d) => d.date === dateStr);
		last7Days.push({ date: dateStr, count: found?.count || 0 });
	}

	const bars = last7Days.map((d) => {
		const index = Math.floor((d.count / maxCount) * (barChars.length - 1));
		return barChars[Math.max(0, index)];
	});

	const dayLabels = last7Days.map((d) => {
		const date = new Date(d.date);
		return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
	});

	return [`<code>${bars.join('')}</code>`, `<code>${dayLabels.join('')}</code>`];
}

export function formatUsersReport(stats: UserStats): string {
	const verificationRate =
		stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0;

	// Calculate trends
	const dailyTrend =
		stats.yesterdayNewUsers > 0
			? ((stats.todayNewUsers - stats.yesterdayNewUsers) / stats.yesterdayNewUsers) * 100
			: stats.todayNewUsers > 0
				? 100
				: 0;

	const weeklyTrend =
		stats.lastWeekNewUsers > 0
			? ((stats.weekNewUsers - stats.lastWeekNewUsers) / stats.lastWeekNewUsers) * 100
			: stats.weekNewUsers > 0
				? 100
				: 0;

	const lines: string[] = [
		'👥 <b>ManaCore User Statistics</b>',
		'━━━━━━━━━━━━━━━━━━━━',
		'',
		'<b>📊 Übersicht</b>',
		`  👤 Gesamt: <b>${formatNumber(stats.totalUsers)}</b>`,
		`  ✅ Verifiziert: ${formatNumber(stats.verifiedUsers)} (${verificationRate}%)`,
		'',
		'<b>📈 Neue Registrierungen</b>',
		`  Heute:        <b>+${formatNumber(stats.todayNewUsers)}</b> ${formatChangeEmoji(dailyTrend)}`,
		`  Gestern:      +${formatNumber(stats.yesterdayNewUsers)}`,
		`  Diese Woche:  +${formatNumber(stats.weekNewUsers)} ${formatChange(weeklyTrend)} ${formatChangeEmoji(weeklyTrend)}`,
		`  Dieser Monat: +${formatNumber(stats.monthNewUsers)}`,
	];

	// Add mini bar chart for last 7 days
	if (stats.dailyRegistrations.length > 0) {
		lines.push('');
		lines.push('<b>📅 Letzte 7 Tage</b>');
		lines.push(...createMiniBarChart(stats.dailyRegistrations));
	}

	return lines.join('\n');
}

export function formatUsersReportCompact(stats: UserStats): string {
	const verificationRate =
		stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0;

	return [
		'',
		'<b>👥 Registrierte User</b>',
		`  Gesamt: <b>${formatNumber(stats.totalUsers)}</b> (${verificationRate}% verifiziert)`,
		`  Heute: +${formatNumber(stats.todayNewUsers)} | Woche: +${formatNumber(stats.weekNewUsers)} | Monat: +${formatNumber(stats.monthNewUsers)}`,
	].join('\n');
}
