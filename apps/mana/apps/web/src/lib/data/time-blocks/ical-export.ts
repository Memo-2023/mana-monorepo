/**
 * iCal Export — Convert TimeBlocks to .ics (iCalendar) format.
 *
 * Generates valid VCALENDAR files with VEVENT entries.
 * RFC 5545 compliant.
 */

import type { TimeBlock } from './types';

/** Format a Date to iCal date-time string (YYYYMMDDTHHMMSSZ). */
function formatICalDate(isoStr: string): string {
	return isoStr.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Format a Date to iCal date-only string (YYYYMMDD). */
function formatICalDateOnly(isoStr: string): string {
	return isoStr.split('T')[0].replace(/-/g, '');
}

/** Escape special characters in iCal text fields. */
function escapeICalText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n');
}

/** Convert a single TimeBlock to a VEVENT string. */
function timeBlockToVEvent(block: TimeBlock): string {
	const lines: string[] = [];
	lines.push('BEGIN:VEVENT');
	lines.push(`UID:${block.id}@mana`);
	lines.push(`DTSTAMP:${formatICalDate(new Date().toISOString())}`);

	if (block.allDay) {
		lines.push(`DTSTART;VALUE=DATE:${formatICalDateOnly(block.startDate)}`);
		if (block.endDate) {
			lines.push(`DTEND;VALUE=DATE:${formatICalDateOnly(block.endDate)}`);
		}
	} else {
		lines.push(`DTSTART:${formatICalDate(block.startDate)}`);
		if (block.endDate) {
			lines.push(`DTEND:${formatICalDate(block.endDate)}`);
		}
	}

	lines.push(`SUMMARY:${escapeICalText(block.title)}`);

	if (block.description) {
		lines.push(`DESCRIPTION:${escapeICalText(block.description)}`);
	}

	if (block.recurrenceRule) {
		lines.push(`RRULE:${block.recurrenceRule}`);
	}

	// Add custom properties for Mana metadata
	lines.push(`X-MANACORE-TYPE:${block.type}`);
	lines.push(`X-MANACORE-KIND:${block.kind}`);
	lines.push(`X-MANACORE-MODULE:${block.sourceModule}`);

	if (block.color) {
		lines.push(`COLOR:${block.color}`);
	}

	lines.push(`CREATED:${formatICalDate(block.createdAt)}`);
	lines.push(`LAST-MODIFIED:${formatICalDate(block.updatedAt)}`);
	lines.push('END:VEVENT');

	return lines.join('\r\n');
}

/** Generate a complete .ics file from TimeBlocks. */
export function generateICalendar(blocks: TimeBlock[], calendarName: string = 'Mana'): string {
	const lines: string[] = [];
	lines.push('BEGIN:VCALENDAR');
	lines.push('VERSION:2.0');
	lines.push(`PRODID:-//Mana//TimeBlocks//EN`);
	lines.push(`X-WR-CALNAME:${escapeICalText(calendarName)}`);
	lines.push('CALSCALE:GREGORIAN');
	lines.push('METHOD:PUBLISH');

	for (const block of blocks) {
		lines.push(timeBlockToVEvent(block));
	}

	lines.push('END:VCALENDAR');
	return lines.join('\r\n');
}

/** Download a .ics file to the browser. */
export function downloadICalendar(
	blocks: TimeBlock[],
	filename: string = 'mana-export.ics',
	calendarName?: string
): void {
	const icsContent = generateICalendar(blocks, calendarName);
	const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
