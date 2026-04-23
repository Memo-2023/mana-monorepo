/**
 * Wardrobe module — Dexie table accessors.
 */

import { db } from '$lib/data/database';
import type { LocalWardrobeGarment, LocalWardrobeOutfit } from './types';

export const wardrobeGarmentsTable = db.table<LocalWardrobeGarment>('wardrobeGarments');
export const wardrobeOutfitsTable = db.table<LocalWardrobeOutfit>('wardrobeOutfits');
