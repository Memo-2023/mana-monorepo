/**
 * Events module — social gatherings (parties, dinners, workshops).
 *
 * Distinct from the `calendar` module's events table: these have guest lists,
 * RSVPs, and shareable invitation tokens. The time dimension lives on a
 * TimeBlock (sourceModule: 'events') so the event surfaces in the calendar.
 */

import type { BaseRecord } from '@mana/local-store';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'past';

export type RsvpStatus = 'pending' | 'yes' | 'no' | 'maybe';

export type InvitationChannel = 'link' | 'manual';

// ─── Local Records (Dexie) ─────────────────────────────────

export interface LocalSocialEvent extends BaseRecord {
	timeBlockId: string;
	title: string;
	description?: string | null;
	location?: string | null;
	locationUrl?: string | null;
	/** Geocoded latitude — plaintext (coordinates stay unencrypted for map rendering). */
	locationLat?: number | null;
	/** Geocoded longitude — plaintext. */
	locationLon?: number | null;
	hostContactId?: string | null;
	coverImage?: string | null;
	color?: string | null;
	capacity?: number | null;
	isPublished: boolean;
	publicToken?: string | null;
	status: EventStatus;
}

export interface LocalEventGuest extends BaseRecord {
	eventId: string;
	contactId?: string | null;
	name: string;
	email?: string | null;
	phone?: string | null;
	rsvpStatus: RsvpStatus;
	rsvpAt?: string | null;
	plusOnes: number;
	note?: string | null;
}

export interface LocalEventInvitation extends BaseRecord {
	eventId: string;
	guestId: string;
	channel: InvitationChannel;
	sentAt?: string | null;
	openedAt?: string | null;
	token: string;
}

export interface LocalEventItem extends BaseRecord {
	eventId: string;
	label: string;
	quantity?: number | null;
	order: number;
	done: boolean;
	// Either a local guest the host assigned…
	assignedGuestId?: string | null;
	// …or a public visitor who claimed it via the share link.
	claimedByName?: string | null;
	claimedAt?: string | null;
}

// ─── Domain (UI-facing) ────────────────────────────────────

export interface SocialEvent {
	id: string;
	title: string;
	description: string | null;
	location: string | null;
	locationUrl: string | null;
	locationLat: number | null;
	locationLon: number | null;
	hostContactId: string | null;
	coverImage: string | null;
	color: string | null;
	capacity: number | null;
	isPublished: boolean;
	publicToken: string | null;
	status: EventStatus;
	timeBlockId: string;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface EventGuest {
	id: string;
	eventId: string;
	contactId: string | null;
	name: string;
	email: string | null;
	phone: string | null;
	rsvpStatus: RsvpStatus;
	rsvpAt: string | null;
	plusOnes: number;
	note: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface RsvpSummary {
	yes: number;
	no: number;
	maybe: number;
	pending: number;
	totalAttending: number; // yes + plusOnes
}

export interface EventItem {
	id: string;
	eventId: string;
	label: string;
	quantity: number | null;
	order: number;
	done: boolean;
	assignedGuestId: string | null;
	claimedByName: string | null;
	claimedAt: string | null;
	createdAt: string;
	updatedAt: string;
}
