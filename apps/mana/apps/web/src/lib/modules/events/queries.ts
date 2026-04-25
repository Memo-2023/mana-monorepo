/**
 * Reactive queries & helpers for the events module.
 *
 * Joins LocalSocialEvent with its TimeBlock to produce the UI-facing SocialEvent.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import { timeBlockTable } from '$lib/data/time-blocks/collections';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
import type {
	LocalSocialEvent,
	LocalEventGuest,
	LocalEventItem,
	SocialEvent,
	EventGuest,
	EventItem,
	RsvpSummary,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toSocialEvent(local: LocalSocialEvent, block: LocalTimeBlock | null): SocialEvent {
	const now = new Date().toISOString();
	return {
		id: local.id,
		title: local.title,
		description: local.description ?? null,
		location: local.location ?? null,
		locationUrl: local.locationUrl ?? null,
		locationLat: local.locationLat ?? null,
		locationLon: local.locationLon ?? null,
		hostContactId: local.hostContactId ?? null,
		coverImage: local.coverImage ?? null,
		color: local.color ?? null,
		capacity: local.capacity ?? null,
		isPublished: local.isPublished ?? false,
		publicToken: local.publicToken ?? null,
		status: local.status,
		timeBlockId: local.timeBlockId,
		startTime: block?.startDate ?? now,
		endTime: block?.endDate ?? block?.startDate ?? now,
		isAllDay: block?.allDay ?? false,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toEventItem(local: LocalEventItem): EventItem {
	const now = new Date().toISOString();
	return {
		id: local.id,
		eventId: local.eventId,
		label: local.label,
		quantity: local.quantity ?? null,
		order: local.order ?? 0,
		done: local.done ?? false,
		assignedGuestId: local.assignedGuestId ?? null,
		claimedByName: local.claimedByName ?? null,
		claimedAt: local.claimedAt ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toEventGuest(local: LocalEventGuest): EventGuest {
	const now = new Date().toISOString();
	return {
		id: local.id,
		eventId: local.eventId,
		contactId: local.contactId ?? null,
		name: local.name,
		email: local.email ?? null,
		phone: local.phone ?? null,
		rsvpStatus: local.rsvpStatus,
		rsvpAt: local.rsvpAt ?? null,
		plusOnes: local.plusOnes ?? 0,
		note: local.note ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

// ─── Reactive Hooks ────────────────────────────────────────

/** All non-deleted events, joined with their TimeBlock for time fields. */
export function useAllEvents() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSocialEvent, string>(
			'events',
			'socialEvents'
		).toArray();
		const visible = locals.filter((e) => !e.deletedAt);
		const active = await decryptRecords('socialEvents', visible);
		const blocks = await timeBlockTable.bulkGet(active.map((e) => e.timeBlockId));
		return active.map((e, i) => toSocialEvent(e, blocks[i] ?? null));
	}, [] as SocialEvent[]);
}

/** Upcoming events (startTime >= now), sorted ascending. */
export function useUpcomingEvents() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSocialEvent, string>(
			'events',
			'socialEvents'
		).toArray();
		const visible = locals.filter((e) => !e.deletedAt && e.status !== 'cancelled');
		const active = await decryptRecords('socialEvents', visible);
		const blocks = await timeBlockTable.bulkGet(active.map((e) => e.timeBlockId));
		const now = Date.now();
		return active
			.map((e, i) => toSocialEvent(e, blocks[i] ?? null))
			.filter((e) => new Date(e.startTime).getTime() >= now)
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
	}, [] as SocialEvent[]);
}

/** Past events. */
export function usePastEvents() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSocialEvent, string>(
			'events',
			'socialEvents'
		).toArray();
		const visible = locals.filter((e) => !e.deletedAt);
		const active = await decryptRecords('socialEvents', visible);
		const blocks = await timeBlockTable.bulkGet(active.map((e) => e.timeBlockId));
		const now = Date.now();
		return active
			.map((e, i) => toSocialEvent(e, blocks[i] ?? null))
			.filter((e) => new Date(e.startTime).getTime() < now)
			.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
	}, [] as SocialEvent[]);
}

/** Single event by ID. */
export function useEvent(eventId: () => string) {
	return useScopedLiveQuery(
		async () => {
			const id = eventId();
			if (!id) return null;
			const raw = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (!raw || raw.deletedAt) return null;
			const [local] = await decryptRecords('socialEvents', [raw]);
			const block = await timeBlockTable.get(local.timeBlockId);
			return toSocialEvent(local, block ?? null);
		},
		null as SocialEvent | null
	);
}

/** All guests across all events, grouped by eventId. Useful for list views. */
export function useGuestsByEvent() {
	return useScopedLiveQuery(
		async () => {
			const all = await scopedForModule<LocalEventGuest, string>('events', 'eventGuests').toArray();
			const visible = all.filter((g) => !g.deletedAt);
			const decrypted = await decryptRecords('eventGuests', visible);
			const map = new Map<string, EventGuest[]>();
			for (const g of decrypted) {
				const guest = toEventGuest(g);
				const arr = map.get(guest.eventId);
				if (arr) arr.push(guest);
				else map.set(guest.eventId, [guest]);
			}
			return map;
		},
		new Map() as Map<string, EventGuest[]>
	);
}

/** Guests for a single event. */
export function useEventGuests(eventId: () => string) {
	return useScopedLiveQuery(async () => {
		const id = eventId();
		if (!id) return [];
		const guests = await db
			.table<LocalEventGuest>('eventGuests')
			.where('eventId')
			.equals(id)
			.toArray();
		const visible = guests.filter((g) => !g.deletedAt);
		const decrypted = await decryptRecords('eventGuests', visible);
		return decrypted.map(toEventGuest);
	}, [] as EventGuest[]);
}

/** Bring-list items for a single event, sorted by order. */
export function useEventItems(eventId: () => string) {
	return useScopedLiveQuery(async () => {
		const id = eventId();
		if (!id) return [];
		const items = await db
			.table<LocalEventItem>('eventItems')
			.where('eventId')
			.equals(id)
			.toArray();
		return items
			.filter((i) => !i.deletedAt)
			.map(toEventItem)
			.sort((a, b) => a.order - b.order);
	}, [] as EventItem[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

export function summarizeRsvps(guests: EventGuest[]): RsvpSummary {
	const summary: RsvpSummary = { yes: 0, no: 0, maybe: 0, pending: 0, totalAttending: 0 };
	for (const g of guests) {
		summary[g.rsvpStatus]++;
		if (g.rsvpStatus === 'yes') summary.totalAttending += 1 + (g.plusOnes ?? 0);
	}
	return summary;
}

export function getEventById(events: SocialEvent[], id: string): SocialEvent | undefined {
	return events.find((e) => e.id === id);
}
