/**
 * Events module — collection accessors.
 */

import { db } from '$lib/data/database';
import type { LocalSocialEvent, LocalEventGuest, LocalEventInvitation } from './types';

export const socialEventTable = db.table<LocalSocialEvent>('socialEvents');
export const eventGuestTable = db.table<LocalEventGuest>('eventGuests');
export const eventInvitationTable = db.table<LocalEventInvitation>('eventInvitations');
