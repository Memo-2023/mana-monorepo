/**
 * Board Items API - Now using Backend API instead of direct Supabase calls
 */

import { fetchApi } from './client';

// ===== BASE TYPES =====

interface BoardItemBase {
  id: string;
  boardId: string;
  itemType: 'image' | 'text';
  positionX: number;
  positionY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  width: number | null;
  height: number | null;
  properties: Record<string, any>;
  createdAt: string;
}

// ===== IMAGE ITEM =====

export interface BoardImageItem extends BoardItemBase {
  itemType: 'image';
  imageId: string;
  textContent: null;
  fontSize: null;
  color: null;
  image?: {
    id: string;
    publicUrl: string;
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
  itemType: 'text';
  imageId: null;
  textContent: string;
  fontSize: number;
  color: string;
  properties: TextProperties;
}

// ===== DISCRIMINATED UNION =====

export type BoardItem = BoardImageItem | BoardTextItem;

// ===== TYPE GUARDS =====

export function isImageItem(item: BoardItem): item is BoardImageItem {
  return item.itemType === 'image';
}

export function isTextItem(item: BoardItem): item is BoardTextItem {
  return item.itemType === 'text';
}

// ===== LEGACY (for backwards compatibility) =====

export interface BoardItemWithImage extends BoardImageItem {
  image: {
    id: string;
    publicUrl: string;
    width: number | null;
    height: number | null;
    prompt: string | null;
    blurhash: string | null;
  };
}

// ===== INPUT TYPES =====

export interface AddImageToBoardInput {
  imageId: string;
  position?: { x: number; y: number };
}

export interface AddTextToBoardInput {
  content?: string;
  position?: { x: number; y: number };
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}

export interface UpdateBoardItemInput {
  positionX?: number;
  positionY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  zIndex?: number;
  opacity?: number;
  width?: number;
  height?: number;
  textContent?: string;
  fontSize?: number;
  color?: string;
  properties?: Record<string, any>;
}

// ===== API FUNCTIONS =====

/**
 * Get all items for a board (images and texts)
 */
export async function getBoardItems(boardId: string): Promise<BoardItem[]> {
  const { data, error } = await fetchApi<BoardItem[]>(`/board-items/board/${boardId}`);
  if (error) throw error;
  return data || [];
}

/**
 * Get a single board item by ID
 */
export async function getBoardItemById(id: string): Promise<BoardItem> {
  const { data, error } = await fetchApi<BoardItem>(`/board-items/${id}`);
  if (error) throw error;
  if (!data) throw new Error('Board item not found');
  return data;
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

  const { data, error } = await fetchApi<BoardImageItem>(`/board-items/board/${boardId}/image`, {
    method: 'POST',
    body: {
      imageId,
      positionX: position.x,
      positionY: position.y,
    },
  });

  if (error) throw error;
  if (!data) throw new Error('Failed to add image to board');
  return data;
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
    fontFamily = 'Arial',
  } = params;

  const { data, error } = await fetchApi<BoardTextItem>(`/board-items/board/${boardId}/text`, {
    method: 'POST',
    body: {
      textContent: content,
      positionX: position.x,
      positionY: position.y,
      fontSize,
      color,
      properties: {
        fontFamily,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
      },
    },
  });

  if (error) throw error;
  if (!data) throw new Error('Failed to add text to board');
  return data;
}

/**
 * Legacy function for backwards compatibility
 */
export async function addBoardItem(item: {
  boardId: string;
  itemType: 'image' | 'text';
  imageId?: string;
  textContent?: string;
  positionX?: number;
  positionY?: number;
  fontSize?: number;
  color?: string;
  properties?: Record<string, any>;
}): Promise<BoardItem> {
  const { data, error } = await fetchApi<BoardItem>(`/board-items/board/${item.boardId}`, {
    method: 'POST',
    body: item,
  });

  if (error) throw error;
  if (!data) throw new Error('Failed to add board item');
  return data;
}

/**
 * Update a board item (position, scale, rotation, text content, etc.)
 */
export async function updateBoardItem(id: string, updates: UpdateBoardItemInput): Promise<BoardItem> {
  const { data, error } = await fetchApi<BoardItem>(`/board-items/${id}`, {
    method: 'PATCH',
    body: updates,
  });

  if (error) throw error;
  if (!data) throw new Error('Failed to update board item');
  return data;
}

/**
 * Update multiple board items at once (for batch operations)
 */
export async function updateBoardItems(
  items: Array<{ id: string } & UpdateBoardItemInput>,
): Promise<void> {
  const { error } = await fetchApi('/board-items/batch', {
    method: 'PATCH',
    body: { items },
  });

  if (error) throw error;
}

/**
 * Remove an item from a board
 */
export async function removeBoardItem(id: string): Promise<void> {
  const { error } = await fetchApi(`/board-items/${id}`, {
    method: 'DELETE',
  });

  if (error) throw error;
}

/**
 * Remove multiple items from a board
 */
export async function removeBoardItems(ids: string[]): Promise<void> {
  const { error } = await fetchApi('/board-items/batch', {
    method: 'DELETE',
    body: { ids },
  });

  if (error) throw error;
}

/**
 * Change z-index (layer order) of an item
 */
export async function changeBoardItemZIndex(
  id: string,
  direction: 'up' | 'down' | 'top' | 'bottom',
): Promise<BoardItem> {
  const { data, error } = await fetchApi<BoardItem>(`/board-items/${id}/z-index`, {
    method: 'PATCH',
    body: { direction },
  });

  if (error) throw error;
  if (!data) throw new Error('Failed to change z-index');
  return data;
}

/**
 * Check if an image is already on a board
 */
export async function isImageOnBoard(boardId: string, imageId: string): Promise<boolean> {
  const { data, error } = await fetchApi<{ exists: boolean }>(
    `/board-items/board/${boardId}/image/${imageId}/exists`,
  );

  if (error) throw error;
  return data?.exists || false;
}
