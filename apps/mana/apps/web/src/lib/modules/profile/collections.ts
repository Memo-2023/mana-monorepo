/**
 * Profile module — Dexie table accessors.
 */

import { db } from '$lib/data/database';
import type { LocalUserContext } from './types';

export const userContextTable = db.table<LocalUserContext>('userContext');
