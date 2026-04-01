/**
 * Picture module — collection accessors and guest seed data.
 *
 * Uses prefixed table names in the unified DB: pictureTags (not 'tags').
 */

import { db } from '$lib/data/database';
import type {
	LocalImage,
	LocalBoard,
	LocalBoardItem,
	LocalPictureTag,
	LocalImageTag,
} from './types';

// ─── Collection Accessors ──────────────────────────────────

export const imageTable = db.table<LocalImage>('images');
export const boardTable = db.table<LocalBoard>('boards');
export const boardItemTable = db.table<LocalBoardItem>('boardItems');
export const pictureTagTable = db.table<LocalPictureTag>('pictureTags');
export const imageTagTable = db.table<LocalImageTag>('imageTags');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_BOARD_ID = 'demo-moodboard';

export const PICTURE_GUEST_SEED = {
	boards: [
		{
			id: DEMO_BOARD_ID,
			name: 'Willkommen bei Picture',
			description: 'Dein erstes Moodboard — erstelle eigene Bilder mit KI!',
			canvasWidth: 2000,
			canvasHeight: 1500,
			backgroundColor: '#1e1e2e',
			isPublic: false,
		},
	] satisfies LocalBoard[],
	boardItems: [
		{
			id: 'text-welcome',
			boardId: DEMO_BOARD_ID,
			itemType: 'text' as const,
			textContent: 'Willkommen bei Picture!',
			fontSize: 48,
			color: '#ffffff',
			positionX: 600,
			positionY: 200,
			scaleX: 1,
			scaleY: 1,
			rotation: 0,
			zIndex: 10,
			opacity: 1,
			width: 800,
			height: null,
			properties: { fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center' },
		},
		{
			id: 'text-hint-1',
			boardId: DEMO_BOARD_ID,
			itemType: 'text' as const,
			textContent: 'Erstelle KI-Bilder mit einem Prompt',
			fontSize: 24,
			color: '#a0a0c0',
			positionX: 650,
			positionY: 400,
			scaleX: 1,
			scaleY: 1,
			rotation: 0,
			zIndex: 9,
			opacity: 1,
			width: 700,
			height: null,
			properties: { fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'center' },
		},
	] satisfies LocalBoardItem[],
	pictureTags: [
		{ id: 'tag-landscape', name: 'Landschaft', color: '#22c55e' },
		{ id: 'tag-portrait', name: 'Portrait', color: '#3b82f6' },
		{ id: 'tag-abstract', name: 'Abstrakt', color: '#a855f7' },
	] satisfies LocalPictureTag[],
};
