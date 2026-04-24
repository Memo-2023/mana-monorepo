/**
 * Comic module — Dexie table accessor.
 */

import { db } from '$lib/data/database';
import type { LocalComicStory } from './types';

export const comicStoriesTable = db.table<LocalComicStory>('comicStories');
