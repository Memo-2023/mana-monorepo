/**
 * Who module — collection accessors.
 *
 * Two tables: whoGames (game sessions) and whoMessages (chat
 * scrollback). No guest seed — the picker UI handles empty state.
 */

import { db } from '$lib/data/database';
import type { LocalWhoGame, LocalWhoMessage } from './types';

export const whoGameTable = db.table<LocalWhoGame>('whoGames');
export const whoMessageTable = db.table<LocalWhoMessage>('whoMessages');
