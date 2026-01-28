import { Injectable, Logger } from '@nestjs/common';
import ICAL from 'ical.js';

export interface ParsedEvent {
	uid: string;
	summary: string;
	description?: string;
	location?: string;
	dtstart: Date;
	dtend: Date;
	isAllDay: boolean;
	rrule?: string;
	status?: string;
	organizer?: string;
	attendees?: Array<{ email: string; name?: string; status?: string }>;
	lastModified?: Date;
	created?: Date;
	sequence?: number;
}

export interface CalendarExport {
	name: string;
	events: ParsedEvent[];
}

@Injectable()
export class ICalService {
	private readonly logger = new Logger(ICalService.name);

	/**
	 * Parse iCal/ICS data into structured events
	 */
	parseICalData(icalData: string): ParsedEvent[] {
		const events: ParsedEvent[] = [];

		try {
			const jcalData = ICAL.parse(icalData);
			const vcalendar = new ICAL.Component(jcalData);
			const vevents = vcalendar.getAllSubcomponents('vevent');

			for (const vevent of vevents) {
				try {
					const event = this.parseVEvent(vevent);
					if (event) {
						events.push(event);
					}
				} catch (error) {
					this.logger.warn(`Failed to parse event: ${error}`);
				}
			}
		} catch (error) {
			this.logger.error(`Failed to parse iCal data: ${error}`);
			throw new Error('Invalid iCal data format');
		}

		return events;
	}

	/**
	 * Parse a single VEVENT component
	 */
	private parseVEvent(vevent: ICAL.Component): ParsedEvent | null {
		const event = new ICAL.Event(vevent);

		const uid = event.uid;
		const summary = event.summary;

		if (!uid || !summary) {
			return null;
		}

		const dtstart = event.startDate;
		const dtend = event.endDate;

		if (!dtstart || !dtend) {
			return null;
		}

		// Check if all-day event (DATE vs DATE-TIME)
		const isAllDay = dtstart.isDate;

		// Extract RRULE if present
		let rrule: string | undefined;
		const rruleProp = vevent.getFirstProperty('rrule');
		if (rruleProp) {
			rrule = rruleProp.toICALString().replace('RRULE:', '');
		}

		// Extract attendees
		const attendees: Array<{ email: string; name?: string; status?: string }> = [];
		const attendeeProps = vevent.getAllProperties('attendee');
		for (const attendee of attendeeProps) {
			const email = attendee.getFirstValue()?.toString().replace('mailto:', '') || '';
			const cn = attendee.getParameter('cn');
			const partstat = attendee.getParameter('partstat');
			if (email) {
				attendees.push({
					email,
					name: cn?.toString(),
					status: this.mapPartstat(partstat?.toString()),
				});
			}
		}

		// Extract organizer
		let organizer: string | undefined;
		const organizerProp = vevent.getFirstProperty('organizer');
		if (organizerProp) {
			organizer = organizerProp.getFirstValue()?.toString().replace('mailto:', '');
		}

		// Extract timestamps
		const lastModifiedProp = vevent.getFirstProperty('last-modified');
		const createdProp = vevent.getFirstProperty('created');
		const sequenceProp = vevent.getFirstProperty('sequence');

		return {
			uid,
			summary,
			description: event.description || undefined,
			location: event.location || undefined,
			dtstart: dtstart.toJSDate(),
			dtend: dtend.toJSDate(),
			isAllDay,
			rrule,
			status: this.mapStatus(vevent.getFirstPropertyValue('status')?.toString()),
			organizer,
			attendees: attendees.length > 0 ? attendees : undefined,
			lastModified: lastModifiedProp?.getFirstValue()
				? new Date(lastModifiedProp.getFirstValue()?.toString() || '')
				: undefined,
			created: createdProp?.getFirstValue()
				? new Date(createdProp.getFirstValue()?.toString() || '')
				: undefined,
			sequence: sequenceProp
				? parseInt(sequenceProp.getFirstValue()?.toString() || '0', 10)
				: undefined,
		};
	}

	/**
	 * Map iCal PARTSTAT to our status
	 */
	private mapPartstat(partstat?: string): string | undefined {
		if (!partstat) return undefined;
		const mapping: Record<string, string> = {
			ACCEPTED: 'accepted',
			DECLINED: 'declined',
			TENTATIVE: 'tentative',
			'NEEDS-ACTION': 'pending',
		};
		return mapping[partstat.toUpperCase()] || 'pending';
	}

	/**
	 * Map iCal STATUS to our status
	 */
	private mapStatus(status?: string): string | undefined {
		if (!status) return 'confirmed';
		const mapping: Record<string, string> = {
			CONFIRMED: 'confirmed',
			TENTATIVE: 'tentative',
			CANCELLED: 'cancelled',
		};
		return mapping[status.toUpperCase()] || 'confirmed';
	}

	/**
	 * Generate iCal/ICS data from events
	 */
	generateICalData(
		calendarName: string,
		events: Array<{
			id: string;
			title: string;
			description?: string | null;
			location?: string | null;
			startTime: Date;
			endTime: Date;
			isAllDay?: boolean | null;
			recurrenceRule?: string | null;
			status?: string | null;
		}>
	): string {
		const vcalendar = new ICAL.Component(['vcalendar', [], []]);

		// Set calendar properties
		vcalendar.addPropertyWithValue('version', '2.0');
		vcalendar.addPropertyWithValue('prodid', '-//ManaCore Calendar//EN');
		vcalendar.addPropertyWithValue('calscale', 'GREGORIAN');
		vcalendar.addPropertyWithValue('method', 'PUBLISH');
		vcalendar.addPropertyWithValue('x-wr-calname', calendarName);

		for (const event of events) {
			const vevent = new ICAL.Component('vevent');

			// Required properties
			vevent.addPropertyWithValue('uid', `${event.id}@manacore.app`);
			vevent.addPropertyWithValue('summary', event.title);

			// Timestamps
			const dtstart = ICAL.Time.fromJSDate(event.startTime, false);
			const dtend = ICAL.Time.fromJSDate(event.endTime, false);

			if (event.isAllDay) {
				dtstart.isDate = true;
				dtend.isDate = true;
			}

			vevent.addPropertyWithValue('dtstart', dtstart);
			vevent.addPropertyWithValue('dtend', dtend);

			// Optional properties
			if (event.description) {
				vevent.addPropertyWithValue('description', event.description);
			}
			if (event.location) {
				vevent.addPropertyWithValue('location', event.location);
			}
			if (event.recurrenceRule) {
				const rruleProp = new ICAL.Property('rrule');
				rruleProp.setValue(ICAL.Recur.fromString(event.recurrenceRule));
				vevent.addProperty(rruleProp);
			}

			// Status
			const status = (event.status || 'confirmed').toUpperCase();
			vevent.addPropertyWithValue('status', status);

			// Metadata
			vevent.addPropertyWithValue('dtstamp', ICAL.Time.now());
			vevent.addPropertyWithValue('created', ICAL.Time.fromJSDate(new Date(), false));

			vcalendar.addSubcomponent(vevent);
		}

		return vcalendar.toString();
	}

	/**
	 * Fetch and parse iCal from URL
	 */
	async fetchAndParseICalUrl(url: string): Promise<ParsedEvent[]> {
		try {
			const response = await fetch(url, {
				headers: {
					Accept: 'text/calendar',
					'User-Agent': 'ManaCore Calendar/1.0',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch iCal: ${response.status} ${response.statusText}`);
			}

			const icalData = await response.text();
			return this.parseICalData(icalData);
		} catch (error) {
			this.logger.error(`Failed to fetch iCal from ${url}: ${error}`);
			throw error;
		}
	}
}
