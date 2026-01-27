import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarEvent, Calendar } from '../calendar/calendar.client';

/**
 * Format time from ISO string
 */
function formatTime(isoString: string): string {
	return format(parseISO(isoString), 'HH:mm');
}

/**
 * Format date from ISO string
 */
function formatDate(isoString: string): string {
	const date = parseISO(isoString);
	if (isToday(date)) return 'Heute';
	if (isTomorrow(date)) return 'Morgen';
	return format(date, 'EEE, d. MMM', { locale: de });
}

/**
 * Format full date with weekday
 */
function formatFullDate(date: Date): string {
	return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
}

/**
 * Get color emoji based on hex color
 */
function getColorEmoji(color?: string): string {
	if (!color) return '📅';

	const colorMap: Record<string, string> = {
		'#3B82F6': '🔵', // blue
		'#22C55E': '🟢', // green
		'#EF4444': '🔴', // red
		'#F59E0B': '🟡', // yellow/amber
		'#8B5CF6': '🟣', // purple
		'#EC4899': '💗', // pink
		'#06B6D4': '🩵', // cyan
		'#F97316': '🟠', // orange
	};

	// Try exact match
	if (colorMap[color.toUpperCase()]) {
		return colorMap[color.toUpperCase()];
	}

	// Default based on first character of hex
	const firstChar = color.charAt(1).toLowerCase();
	if (['0', '1', '2', '3'].includes(firstChar)) return '🔵';
	if (['4', '5', '6', '7'].includes(firstChar)) return '🟢';
	if (['8', '9', 'a', 'b'].includes(firstChar)) return '🟡';
	return '🔴';
}

/**
 * Format a single event
 */
export function formatEvent(event: CalendarEvent, showDate = false): string {
	const emoji = getColorEmoji(event.color);
	const timeRange = event.isAllDay
		? 'Ganztägig'
		: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;

	let text = `${emoji} <b>${timeRange}</b> | ${escapeHtml(event.title)}`;

	if (showDate) {
		text = `${emoji} <b>${formatDate(event.startTime)}</b> ${timeRange}\n   ${escapeHtml(event.title)}`;
	}

	if (event.location) {
		text += `\n   📍 ${escapeHtml(event.location)}`;
	}

	if (event.description) {
		const desc =
			event.description.length > 50
				? event.description.substring(0, 50) + '...'
				: event.description;
		text += `\n   📝 ${escapeHtml(desc)}`;
	}

	return text;
}

/**
 * Format events list for a day
 */
export function formatDayEvents(events: CalendarEvent[], date: Date): string {
	const header = `📅 <b>Termine für ${formatFullDate(date)}</b>\n`;

	if (events.length === 0) {
		return header + '\n✨ Keine Termine - genieße deinen freien Tag!';
	}

	// Sort by start time
	const sorted = [...events].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	);

	const eventsList = sorted.map((e) => formatEvent(e)).join('\n\n');

	return `${header}\n${eventsList}\n\n───────────────\n${events.length} Termin${events.length === 1 ? '' : 'e'}`;
}

/**
 * Format today's events
 */
export function formatTodayEvents(events: CalendarEvent[]): string {
	const today = new Date();
	const dayName = format(today, 'EEEE', { locale: de });
	const header = `📅 <b>Deine Termine für heute</b> (${dayName}, ${format(today, 'd. MMMM', { locale: de })})\n`;

	if (events.length === 0) {
		return header + '\n✨ Keine Termine heute - genieße deinen freien Tag!';
	}

	const sorted = [...events].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	);

	const eventsList = sorted.map((e) => formatEvent(e)).join('\n\n');

	return `${header}\n${eventsList}\n\n───────────────\n${events.length} Termin${events.length === 1 ? '' : 'e'} heute`;
}

/**
 * Format tomorrow's events
 */
export function formatTomorrowEvents(events: CalendarEvent[]): string {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const dayName = format(tomorrow, 'EEEE', { locale: de });
	const header = `📅 <b>Deine Termine für morgen</b> (${dayName}, ${format(tomorrow, 'd. MMMM', { locale: de })})\n`;

	if (events.length === 0) {
		return header + '\n✨ Keine Termine morgen!';
	}

	const sorted = [...events].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	);

	const eventsList = sorted.map((e) => formatEvent(e)).join('\n\n');

	return `${header}\n${eventsList}\n\n───────────────\n${events.length} Termin${events.length === 1 ? '' : 'e'} morgen`;
}

/**
 * Format week overview
 */
export function formatWeekEvents(events: CalendarEvent[]): string {
	const today = new Date();
	const weekEnd = new Date(today);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const header = `📅 <b>Deine Woche</b> (${format(today, 'd. MMM', { locale: de })} - ${format(weekEnd, 'd. MMM', { locale: de })})\n`;

	if (events.length === 0) {
		return header + '\n✨ Keine Termine diese Woche!';
	}

	// Group by day
	const byDay = new Map<string, CalendarEvent[]>();
	events.forEach((event) => {
		const dayKey = format(parseISO(event.startTime), 'yyyy-MM-dd');
		if (!byDay.has(dayKey)) {
			byDay.set(dayKey, []);
		}
		byDay.get(dayKey)!.push(event);
	});

	// Sort days
	const sortedDays = Array.from(byDay.keys()).sort();

	let result = header + '\n';

	for (const dayKey of sortedDays) {
		const dayEvents = byDay.get(dayKey)!;
		const dayDate = parseISO(dayKey);
		const dayName = isToday(dayDate)
			? '📍 Heute'
			: isTomorrow(dayDate)
				? '📍 Morgen'
				: format(dayDate, 'EEE, d. MMM', { locale: de });

		result += `<b>${dayName}</b>\n`;

		const sorted = dayEvents.sort(
			(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
		);

		for (const event of sorted) {
			const time = event.isAllDay ? '⏰' : formatTime(event.startTime);
			result += `  ${getColorEmoji(event.color)} ${time} ${escapeHtml(event.title)}\n`;
		}

		result += '\n';
	}

	result += `───────────────\n${events.length} Termin${events.length === 1 ? '' : 'e'} diese Woche`;

	return result;
}

/**
 * Format next N events
 */
export function formatNextEvents(events: CalendarEvent[], count: number): string {
	const header = `📅 <b>Deine nächsten ${count} Termine</b>\n`;

	if (events.length === 0) {
		return header + '\n✨ Keine anstehenden Termine!';
	}

	const eventsList = events.map((e) => formatEvent(e, true)).join('\n\n');

	return `${header}\n${eventsList}`;
}

/**
 * Format calendars list
 */
export function formatCalendars(calendars: Calendar[]): string {
	if (calendars.length === 0) {
		return '📅 <b>Deine Kalender</b>\n\nKeine Kalender gefunden.';
	}

	let result = '📅 <b>Deine Kalender</b>\n\n';

	for (const cal of calendars) {
		const emoji = getColorEmoji(cal.color);
		const visibility = cal.isVisible ? '' : ' (versteckt)';
		const isDefault = cal.isDefault ? ' ⭐' : '';
		result += `${emoji} <b>${escapeHtml(cal.name)}</b>${isDefault}${visibility}\n`;
		if (cal.description) {
			result += `   ${escapeHtml(cal.description)}\n`;
		}
	}

	return result;
}

/**
 * Format event created confirmation
 */
export function formatEventCreated(event: CalendarEvent): string {
	const emoji = getColorEmoji(event.color);
	const date = formatDate(event.startTime);
	const time = event.isAllDay
		? 'Ganztägig'
		: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;

	let result = `✅ <b>Termin erstellt!</b>\n\n`;
	result += `${emoji} ${escapeHtml(event.title)}\n`;
	result += `📅 ${date}, ${time}\n`;

	if (event.location) {
		result += `📍 ${escapeHtml(event.location)}\n`;
	}

	return result;
}

/**
 * Format reminder notification
 */
export function formatReminder(event: CalendarEvent, minutesBefore: number): string {
	const timeText =
		minutesBefore >= 60
			? `${Math.floor(minutesBefore / 60)} Stunde${minutesBefore >= 120 ? 'n' : ''}`
			: `${minutesBefore} Minuten`;

	let result = `⏰ <b>Erinnerung in ${timeText}</b>\n\n`;
	result += `📌 <b>${escapeHtml(event.title)}</b>\n`;
	result += `⏱️ ${formatTime(event.startTime)} - ${formatTime(event.endTime)}\n`;

	if (event.location) {
		result += `📍 ${escapeHtml(event.location)}\n`;
	}

	return result;
}

/**
 * Format morning briefing
 */
export function formatMorningBriefing(events: CalendarEvent[]): string {
	const today = new Date();
	const greeting = getGreeting();

	let result = `${greeting} ☀️\n\n`;
	result += `<b>Dein Tag am ${format(today, 'd. MMMM', { locale: de })}</b>\n\n`;

	if (events.length === 0) {
		result += '✨ Keine Termine heute - genieße deinen freien Tag!';
		return result;
	}

	const sorted = [...events].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	);

	for (const event of sorted) {
		const emoji = getColorEmoji(event.color);
		const time = event.isAllDay ? 'Ganztägig' : formatTime(event.startTime);
		result += `${emoji} <b>${time}</b> - ${escapeHtml(event.title)}\n`;
	}

	result += `\n───────────────\n${events.length} Termin${events.length === 1 ? '' : 'e'} heute`;

	return result;
}

/**
 * Format help message
 */
export function formatHelpMessage(): string {
	return `🗓️ <b>Calendar Bot - Hilfe</b>

<b>Termine anzeigen:</b>
/today - Heutige Termine
/tomorrow - Morgige Termine
/week - Wochenübersicht
/next [n] - Nächste n Termine

<b>Termine erstellen:</b>
/add Meeting morgen um 14 Uhr
/add Arzt | 20.01.2025 10:00 | 1h

<b>Kalender:</b>
/calendars - Kalender-Übersicht

<b>Einstellungen:</b>
/remind - Erinnerungseinstellungen
/status - Verbindungsstatus

<b>Account:</b>
/link - ManaCore Account verknüpfen
/unlink - Verknüpfung trennen

───────────────
💡 Du kannst auch einfach Text senden, um schnell einen Termin zu erstellen!`;
}

/**
 * Format status message
 */
export function formatStatusMessage(
	isLinked: boolean,
	username?: string,
	lastActive?: Date
): string {
	if (!isLinked) {
		return `📊 <b>Status</b>

❌ Nicht mit ManaCore verknüpft

Nutze /link um deinen Account zu verknüpfen.`;
	}

	const lastActiveText = lastActive ? format(lastActive, 'd. MMM HH:mm', { locale: de }) : 'Nie';

	return `📊 <b>Status</b>

✅ Verknüpft mit ManaCore
👤 ${username || 'Unbekannt'}
🕐 Letzte Aktivität: ${lastActiveText}

Nutze /unlink um die Verknüpfung zu trennen.`;
}

/**
 * Format link instructions
 */
export function formatLinkInstructions(linkToken: string): string {
	return `🔗 <b>Account verknüpfen</b>

Um deinen ManaCore Account zu verknüpfen:

1. Öffne die Calendar Web App
2. Gehe zu Einstellungen → Telegram
3. Gib diesen Code ein:

<code>${linkToken}</code>

Der Code ist 10 Minuten gültig.`;
}

/**
 * Get time-appropriate greeting
 */
function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return 'Guten Morgen';
	if (hour < 18) return 'Guten Tag';
	return 'Guten Abend';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
