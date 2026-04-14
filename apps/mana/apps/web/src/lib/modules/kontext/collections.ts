/**
 * Kontext module — Dexie table accessor for the singleton document.
 */

import { db } from '$lib/data/database';
import type { LocalKontextDoc } from './types';

export const kontextDocTable = db.table<LocalKontextDoc>('kontextDoc');
