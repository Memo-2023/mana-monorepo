/**
 * Boards API - Now using Backend API instead of direct Supabase calls
 */

import { fetchApi } from './client';

export interface Board {
  id: string;
  userId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardWithCount extends Board {
  itemCount: number;
}

export interface GetBoardsParams {
  page?: number;
  limit?: number;
  includePublic?: boolean;
}

export interface CreateBoardInput {
  name: string;
  description?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundColor?: string;
  isPublic?: boolean;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundColor?: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
}

/**
 * Get all boards for the current user with item counts
 */
export async function getBoards({
  page = 1,
  limit = 20,
  includePublic = false,
}: GetBoardsParams = {}): Promise<BoardWithCount[]> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    includePublic: String(includePublic),
  });

  const { data, error } = await fetchApi<BoardWithCount[]>(`/boards?${params}`);
  if (error) throw error;
  return data || [];
}

/**
 * Get a single board by ID
 */
export async function getBoardById(id: string): Promise<Board> {
  const { data, error } = await fetchApi<Board>(`/boards/${id}`);
  if (error) throw error;
  if (!data) throw new Error('Board not found');
  return data;
}

/**
 * Create a new board
 */
export async function createBoard(board: CreateBoardInput): Promise<Board> {
  const { data, error } = await fetchApi<Board>('/boards', {
    method: 'POST',
    body: board,
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to create board');
  return data;
}

/**
 * Update an existing board
 */
export async function updateBoard(id: string, updates: UpdateBoardInput): Promise<Board> {
  const { data, error } = await fetchApi<Board>(`/boards/${id}`, {
    method: 'PATCH',
    body: updates,
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to update board');
  return data;
}

/**
 * Delete a board (cascade deletes all board_items)
 */
export async function deleteBoard(id: string): Promise<void> {
  const { error } = await fetchApi(`/boards/${id}`, {
    method: 'DELETE',
  });
  if (error) throw error;
}

/**
 * Duplicate a board with all its items
 */
export async function duplicateBoard(boardId: string): Promise<Board> {
  const { data, error } = await fetchApi<Board>(`/boards/${boardId}/duplicate`, {
    method: 'POST',
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to duplicate board');
  return data;
}

/**
 * Generate thumbnail for board (uploads to storage)
 */
export async function generateBoardThumbnail(boardId: string, dataUrl: string): Promise<string> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Create form data
  const formData = new FormData();
  formData.append('thumbnail', blob, 'thumbnail.png');

  // Upload via backend API
  const { data, error } = await fetchApi<{ thumbnailUrl: string }>(
    `/boards/${boardId}/thumbnail`,
    {
      method: 'POST',
      body: formData,
      isFormData: true,
    },
  );

  if (error) throw error;
  if (!data) throw new Error('Failed to generate thumbnail');
  return data.thumbnailUrl;
}

/**
 * Get public boards for explore/sharing
 */
export async function getPublicBoards(page = 1, limit = 20): Promise<BoardWithCount[]> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const { data, error } = await fetchApi<BoardWithCount[]>(`/boards/public?${params}`);
  if (error) throw error;
  return data || [];
}

/**
 * Toggle board visibility (public/private)
 */
export async function toggleBoardVisibility(id: string, isPublic: boolean): Promise<Board> {
  return updateBoard(id, { isPublic });
}
