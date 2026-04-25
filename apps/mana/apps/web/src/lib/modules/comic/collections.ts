/**
 * Comic module — Dexie table accessors.
 */

import { db } from '$lib/data/database';
import type { LocalComicStory, LocalComicCharacter } from './types';

export const comicStoriesTable = db.table<LocalComicStory>('comicStories');
export const comicCharactersTable = db.table<LocalComicCharacter>('comicCharacters');
