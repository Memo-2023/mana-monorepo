/**
 * Mail module — collection accessors.
 *
 * mailDrafts are local-first (stored in Dexie, encrypted).
 * Threads/messages are fetched from the mana-mail API (not cached in Dexie).
 */

import { db } from '$lib/data/database';
import type { LocalMailDraft } from './types';

export const mailDraftTable = db.table<LocalMailDraft>('mailDrafts');
