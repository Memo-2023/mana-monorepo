/**
 * Guest seed data for the Picture app.
 *
 * Provides a demo board with text items to showcase the moodboard feature.
 * No actual images are included since generation requires authentication.
 */

import type { LocalBoard, LocalBoardItem, LocalTag } from './local-store';

const DEMO_BOARD_ID = 'demo-moodboard';

export const guestBoards: LocalBoard[] = [
	{
		id: DEMO_BOARD_ID,
		name: 'Willkommen bei Picture',
		description: 'Dein erstes Moodboard — erstelle eigene Bilder mit KI!',
		canvasWidth: 2000,
		canvasHeight: 1500,
		backgroundColor: '#1e1e2e',
		isPublic: false,
	},
];

export const guestBoardItems: LocalBoardItem[] = [
	{
		id: 'text-welcome',
		boardId: DEMO_BOARD_ID,
		itemType: 'text',
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
		properties: {
			fontFamily: 'Arial',
			fontWeight: 'bold',
			textAlign: 'center',
		},
	},
	{
		id: 'text-hint-1',
		boardId: DEMO_BOARD_ID,
		itemType: 'text',
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
		properties: {
			fontFamily: 'Arial',
			fontWeight: 'normal',
			textAlign: 'center',
		},
	},
	{
		id: 'text-hint-2',
		boardId: DEMO_BOARD_ID,
		itemType: 'text',
		textContent: 'Organisiere Bilder in Moodboards',
		fontSize: 24,
		color: '#a0a0c0',
		positionX: 650,
		positionY: 500,
		scaleX: 1,
		scaleY: 1,
		rotation: 0,
		zIndex: 8,
		opacity: 1,
		width: 700,
		height: null,
		properties: {
			fontFamily: 'Arial',
			fontWeight: 'normal',
			textAlign: 'center',
		},
	},
	{
		id: 'text-hint-3',
		boardId: DEMO_BOARD_ID,
		itemType: 'text',
		textContent: 'Melde dich an, um loszulegen →',
		fontSize: 20,
		color: '#6366f1',
		positionX: 700,
		positionY: 650,
		scaleX: 1,
		scaleY: 1,
		rotation: 0,
		zIndex: 7,
		opacity: 1,
		width: 600,
		height: null,
		properties: {
			fontFamily: 'Arial',
			fontWeight: 'bold',
			textAlign: 'center',
		},
	},
];

export const guestTags: LocalTag[] = [
	{
		id: 'tag-landscape',
		name: 'Landschaft',
		color: '#22c55e',
	},
	{
		id: 'tag-portrait',
		name: 'Portrait',
		color: '#3b82f6',
	},
	{
		id: 'tag-abstract',
		name: 'Abstrakt',
		color: '#a855f7',
	},
];
