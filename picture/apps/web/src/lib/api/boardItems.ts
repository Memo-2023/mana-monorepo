import { supabase } from '$lib/supabase';
import type { Database } from '@picture/shared/types';

type BoardItemRow = Database['public']['Tables']['board_items']['Row'];
type BoardItemInsert = Database['public']['Tables']['board_items']['Insert'];
type BoardItemUpdate = Database['public']['Tables']['board_items']['Update'];

// ===== BASE TYPES =====

interface BoardItemBase {
	id: string;
	board_id: string;
	item_type: 'image' | 'text';
	position_x: number;
	position_y: number;
	scale_x: number;
	scale_y: number;
	rotation: number;
	z_index: number;
	opacity: number;
	width: number | null;
	height: number | null;
	properties: Record<string, any>;
	created_at: string;
}

// ===== IMAGE ITEM =====

export interface BoardImageItem extends BoardItemBase {
	item_type: 'image';
	image_id: string;
	text_content: null;
	font_size: null;
	color: null;
	image?: {
		id: string;
		public_url: string;
		width: number | null;
		height: number | null;
		prompt: string | null;
		blurhash: string | null;
	};
}

// ===== TEXT ITEM =====

export interface TextProperties {
	fontFamily?: string;
	fontWeight?: 'normal' | 'bold';
	fontStyle?: 'normal' | 'italic';
	textAlign?: 'left' | 'center' | 'right';
	lineHeight?: number;
	letterSpacing?: number;
	backgroundColor?: string;
	padding?: number;
}

export interface BoardTextItem extends BoardItemBase {
	item_type: 'text';
	image_id: null;
	text_content: string;
	font_size: number;
	color: string;
	properties: TextProperties;
}

// ===== DISCRIMINATED UNION =====

export type BoardItem = BoardImageItem | BoardTextItem;

// ===== TYPE GUARDS =====

export function isImageItem(item: BoardItem): item is BoardImageItem {
	return item.item_type === 'image';
}

export function isTextItem(item: BoardItem): item is BoardTextItem {
	return item.item_type === 'text';
}

// ===== LEGACY (for backwards compatibility) =====

export interface BoardItemWithImage extends BoardImageItem {
	image: {
		id: string;
		public_url: string;
		width: number | null;
		height: number | null;
		prompt: string | null;
		blurhash: string | null;
	};
}

// ===== HELPER FUNCTIONS =====

async function getNextZIndex(boardId: string): Promise<number> {
	const { data: maxZIndex, error } = await supabase
		.from('board_items')
		.select('z_index')
		.eq('board_id', boardId)
		.order('z_index', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) throw error;
	return (maxZIndex?.z_index ?? -1) + 1;
}

/**
 * Get all items for a board (images and texts)
 */
export async function getBoardItems(boardId: string): Promise<BoardItem[]> {
	const { data, error } = await supabase
		.from('board_items')
		.select(`
			*,
			image:images(
				id,
				public_url,
				width,
				height,
				prompt,
				blurhash
			)
		`)
		.eq('board_id', boardId)
		.order('z_index', { ascending: true });

	if (error) throw error;
	return data as BoardItem[];
}

/**
 * Add an image to a board
 */
export async function addImageToBoard(params: {
	boardId: string;
	imageId: string;
	position?: { x: number; y: number };
}): Promise<BoardImageItem> {
	const { boardId, imageId, position = { x: 100, y: 100 } } = params;

	const item: BoardItemInsert = {
		board_id: boardId,
		item_type: 'image',
		image_id: imageId,
		position_x: position.x,
		position_y: position.y,
		z_index: await getNextZIndex(boardId)
	};

	const { data, error } = await supabase
		.from('board_items')
		.insert(item)
		.select(`
			*,
			image:images(
				id,
				public_url,
				width,
				height,
				prompt,
				blurhash
			)
		`)
		.single();

	if (error) throw error;
	return data as BoardImageItem;
}

/**
 * Add text to a board
 */
export async function addTextToBoard(params: {
	boardId: string;
	content?: string;
	position?: { x: number; y: number };
	fontSize?: number;
	color?: string;
	fontFamily?: string;
}): Promise<BoardTextItem> {
	const {
		boardId,
		content = 'Doppelklick zum Bearbeiten',
		position = { x: 100, y: 100 },
		fontSize = 24,
		color = '#000000',
		fontFamily = 'Arial'
	} = params;

	const item: BoardItemInsert = {
		board_id: boardId,
		item_type: 'text',
		text_content: content,
		font_size: fontSize,
		color: color,
		position_x: position.x,
		position_y: position.y,
		width: 300, // Default text box width
		z_index: await getNextZIndex(boardId),
		properties: {
			fontFamily,
			fontWeight: 'normal',
			fontStyle: 'normal',
			textAlign: 'left',
			lineHeight: 1.2
		}
	};

	const { data, error } = await supabase
		.from('board_items')
		.insert(item)
		.select()
		.single();

	if (error) throw error;
	return data as BoardTextItem;
}

/**
 * Legacy function for backwards compatibility
 */
export async function addBoardItem(item: BoardItemInsert) {
	const nextZIndex = await getNextZIndex(item.board_id);

	const { data, error } = await supabase
		.from('board_items')
		.insert({
			...item,
			z_index: nextZIndex
		})
		.select(`
			*,
			image:images(
				id,
				public_url,
				width,
				height,
				prompt,
				blurhash
			)
		`)
		.single();

	if (error) throw error;
	return data as BoardItem;
}

/**
 * Update a board item (position, scale, rotation, text content, etc.)
 */
export async function updateBoardItem(id: string, updates: BoardItemUpdate): Promise<BoardItem> {
	const { data, error } = await supabase
		.from('board_items')
		.update(updates)
		.eq('id', id)
		.select(`
			*,
			image:images(
				id,
				public_url,
				width,
				height,
				prompt,
				blurhash
			)
		`)
		.single();

	if (error) throw error;
	return data as BoardItem;
}

/**
 * Update multiple board items at once (for batch operations)
 */
export async function updateBoardItems(items: Array<{ id: string } & BoardItemUpdate>) {
	const promises = items.map(({ id, ...updates }) =>
		supabase
			.from('board_items')
			.update(updates)
			.eq('id', id)
	);

	const results = await Promise.all(promises);
	const errors = results.filter(r => r.error).map(r => r.error);

	if (errors.length > 0) throw errors[0];
}

/**
 * Remove an item from a board
 */
export async function removeBoardItem(id: string) {
	const { error } = await supabase
		.from('board_items')
		.delete()
		.eq('id', id);

	if (error) throw error;
}

/**
 * Remove multiple items from a board
 */
export async function removeBoardItems(ids: string[]) {
	const { error } = await supabase
		.from('board_items')
		.delete()
		.in('id', ids);

	if (error) throw error;
}

/**
 * Change z-index (layer order) of an item
 */
export async function changeBoardItemZIndex(id: string, direction: 'up' | 'down' | 'top' | 'bottom') {
	// Get current item
	const { data: currentItem, error: currentError } = await supabase
		.from('board_items')
		.select('*')
		.eq('id', id)
		.single();

	if (currentError) throw currentError;

	// Get all items in the same board
	const { data: allItems, error: allError } = await supabase
		.from('board_items')
		.select('id, z_index')
		.eq('board_id', currentItem.board_id)
		.order('z_index', { ascending: true });

	if (allError) throw allError;

	const currentIndex = allItems.findIndex(item => item.id === id);
	let newZIndex = currentItem.z_index;

	switch (direction) {
		case 'up':
			if (currentIndex < allItems.length - 1) {
				newZIndex = allItems[currentIndex + 1].z_index;
				// Swap z-indexes
				await supabase
					.from('board_items')
					.update({ z_index: currentItem.z_index })
					.eq('id', allItems[currentIndex + 1].id);
			}
			break;
		case 'down':
			if (currentIndex > 0) {
				newZIndex = allItems[currentIndex - 1].z_index;
				// Swap z-indexes
				await supabase
					.from('board_items')
					.update({ z_index: currentItem.z_index })
					.eq('id', allItems[currentIndex - 1].id);
			}
			break;
		case 'top':
			newZIndex = allItems[allItems.length - 1].z_index + 1;
			break;
		case 'bottom':
			newZIndex = allItems[0].z_index - 1;
			break;
	}

	// Update current item
	return updateBoardItem(id, { z_index: newZIndex });
}

/**
 * Get a single board item by ID
 */
export async function getBoardItemById(id: string): Promise<BoardItem> {
	const { data, error } = await supabase
		.from('board_items')
		.select(`
			*,
			image:images(
				id,
				public_url,
				width,
				height,
				prompt,
				blurhash
			)
		`)
		.eq('id', id)
		.single();

	if (error) throw error;
	return data as BoardItem;
}

/**
 * Check if an image is already on a board
 */
export async function isImageOnBoard(boardId: string, imageId: string) {
	const { data, error } = await supabase
		.from('board_items')
		.select('id')
		.eq('board_id', boardId)
		.eq('image_id', imageId)
		.maybeSingle();

	if (error) throw error;
	return !!data;
}
