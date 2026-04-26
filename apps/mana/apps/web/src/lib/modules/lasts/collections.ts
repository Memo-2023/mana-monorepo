import { db } from '$lib/data/database';
import type { LocalLast, LocalLastsCooldown } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const lastTable = db.table<LocalLast>('lasts');
export const lastsCooldownTable = db.table<LocalLastsCooldown>('lastsCooldown');
