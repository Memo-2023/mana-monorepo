import { supabase } from '$lib/supabase';
import type { Database } from '@picture/shared/types';

type Board = Database['public']['Tables']['boards']['Row'];
type BoardInsert = Database['public']['Tables']['boards']['Insert'];
type BoardUpdate = Database['public']['Tables']['boards']['Update'];

export interface BoardWithCount extends Board {
	item_count: number;
}

export interface GetBoardsParams {
	userId: string;
	page?: number;
	limit?: number;
	includePublic?: boolean;
}

/**
 * Get all boards for a user with item counts
 */
export async function getBoards({ userId, page = 1, limit = 20, includePublic = false }: GetBoardsParams) {
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	let query = supabase
		.from('boards')
		.select(`
			*,
			board_items(count)
		`)
		.eq('user_id', userId)
		.order('updated_at', { ascending: false })
		.range(start, end);

	if (includePublic) {
		query = query.or(`user_id.eq.${userId},is_public.eq.true`);
	}

	const { data, error } = await query;

	if (error) throw error;

	// Transform the data to include item_count
	const boards = data?.map((board: any) => ({
		...board,
		item_count: board.board_items?.[0]?.count || 0,
		board_items: undefined // Remove the nested object
	})) as BoardWithCount[];

	return boards;
}

/**
 * Get a single board by ID
 */
export async function getBoardById(id: string) {
	const { data, error } = await supabase
		.from('boards')
		.select('*')
		.eq('id', id)
		.single();

	if (error) throw error;
	return data as Board;
}

/**
 * Create a new board
 */
export async function createBoard(board: BoardInsert) {
	const { data, error } = await supabase
		.from('boards')
		.insert(board)
		.select()
		.single();

	if (error) throw error;
	return data as Board;
}

/**
 * Update an existing board
 */
export async function updateBoard(id: string, updates: BoardUpdate) {
	const { data, error } = await supabase
		.from('boards')
		.update(updates)
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data as Board;
}

/**
 * Delete a board (cascade deletes all board_items)
 */
export async function deleteBoard(id: string) {
	const { error } = await supabase
		.from('boards')
		.delete()
		.eq('id', id);

	if (error) throw error;
}

/**
 * Duplicate a board with all its items
 */
export async function duplicateBoard(boardId: string, userId: string) {
	// Get the original board
	const board = await getBoardById(boardId);

	// Create new board with same settings
	const newBoard = await createBoard({
		user_id: userId,
		name: `${board.name} (Copy)`,
		description: board.description,
		canvas_width: board.canvas_width,
		canvas_height: board.canvas_height,
		background_color: board.background_color,
		is_public: false
	});

	// Get all items from original board
	const { data: items, error } = await supabase
		.from('board_items')
		.select('*')
		.eq('board_id', boardId);

	if (error) throw error;

	// Copy items to new board
	if (items && items.length > 0) {
		const newItems = items.map(item => ({
			board_id: newBoard.id,
			image_id: item.image_id,
			position_x: item.position_x,
			position_y: item.position_y,
			scale_x: item.scale_x,
			scale_y: item.scale_y,
			rotation: item.rotation,
			z_index: item.z_index,
			opacity: item.opacity,
			width: item.width,
			height: item.height
		}));

		const { error: insertError } = await supabase
			.from('board_items')
			.insert(newItems);

		if (insertError) throw insertError;
	}

	return newBoard;
}

/**
 * Generate thumbnail for board (exports to storage)
 */
export async function generateBoardThumbnail(boardId: string, dataUrl: string) {
	// Convert data URL to blob
	const response = await fetch(dataUrl);
	const blob = await response.blob();

	// Upload to Supabase Storage
	const fileName = `board-thumbnails/${boardId}.png`;
	const { data, error } = await supabase.storage
		.from('images')
		.upload(fileName, blob, {
			upsert: true,
			contentType: 'image/png'
		});

	if (error) throw error;

	// Get public URL
	const { data: urlData } = supabase.storage
		.from('images')
		.getPublicUrl(fileName);

	// Update board with thumbnail URL
	await updateBoard(boardId, {
		thumbnail_url: urlData.publicUrl
	});

	return urlData.publicUrl;
}

/**
 * Get public boards for explore/sharing
 */
export async function getPublicBoards(page = 1, limit = 20) {
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	const { data, error } = await supabase
		.from('boards')
		.select(`
			*,
			board_items(count)
		`)
		.eq('is_public', true)
		.order('updated_at', { ascending: false })
		.range(start, end);

	if (error) throw error;

	const boards = data?.map((board: any) => ({
		...board,
		item_count: board.board_items?.[0]?.count || 0,
		board_items: undefined
	})) as BoardWithCount[];

	return boards;
}

/**
 * Toggle board visibility (public/private)
 */
export async function toggleBoardVisibility(id: string, isPublic: boolean) {
	return updateBoard(id, { is_public: isPublic });
}
