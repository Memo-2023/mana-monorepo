/**
 * Profile module — Dexie table accessors.
 */

import { db } from '$lib/data/database';
import type { LocalUserContext, LocalMeImage } from './types';

export const userContextTable = db.table<LocalUserContext>('userContext');
export const meImagesTable = db.table<LocalMeImage>('meImages');
