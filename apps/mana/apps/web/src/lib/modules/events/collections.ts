/**
 * Events module — collection accessors.
 */

import { db } from '$lib/data/database';
import type {
	LocalSocialEvent,
	LocalEventGuest,
	LocalEventInvitation,
	LocalEventItem,
} from './types';

export const socialEventTable = db.table<LocalSocialEvent>('socialEvents');
export const eventGuestTable = db.table<LocalEventGuest>('eventGuests');
export const eventInvitationTable = db.table<LocalEventInvitation>('eventInvitations');
export const eventItemTable = db.table<LocalEventItem>('eventItems');
