/**
 * Archive Service - Using NestJS Backend API
 */

import {
  archiveImage as apiArchiveImage,
  restoreImage as apiRestoreImage,
  deleteImage as apiDeleteImage,
  getArchivedCount as apiGetArchivedCount,
  getArchivedImages as apiGetArchivedImages,
  batchArchiveImages as apiBatchArchiveImages,
  batchRestoreImages as apiBatchRestoreImages,
  batchDeleteImages as apiBatchDeleteImages,
  type Image,
} from './api/images';
import { logger } from '~/utils/logger';

/**
 * Archive an image by setting archived_at timestamp
 */
export async function archiveImage(imageId: string): Promise<void> {
  try {
    logger.info('Archiving image:', imageId);
    await apiArchiveImage(imageId);
    logger.success('Image archived successfully');
  } catch (error) {
    logger.error('Archive error:', error);
    throw error;
  }
}

/**
 * Restore an archived image by setting archived_at to null
 */
export async function restoreImage(imageId: string): Promise<void> {
  try {
    logger.info('Restoring image:', imageId);
    await apiRestoreImage(imageId);
    logger.success('Image restored successfully');
  } catch (error) {
    logger.error('Restore error:', error);
    throw error;
  }
}

/**
 * Delete an archived image permanently
 */
export async function deleteArchivedImage(imageId: string): Promise<void> {
  try {
    logger.info('Deleting archived image:', imageId);
    await apiDeleteImage(imageId);
    logger.success('Image deleted successfully');
  } catch (error) {
    logger.error('Delete error:', error);
    throw error;
  }
}

/**
 * Get count of archived images for a user
 */
export async function getArchivedCount(userId: string): Promise<number> {
  try {
    // Note: userId is no longer needed as the backend uses the JWT token
    return await apiGetArchivedCount();
  } catch (error) {
    logger.error('Count error:', error);
    return 0;
  }
}

/**
 * Get all archived images for a user
 */
export async function getArchivedImages(userId: string, page: number = 0, limit: number = 20) {
  try {
    // Note: userId is no longer needed as the backend uses the JWT token
    // API uses 1-based pagination, so add 1 to page
    return await apiGetArchivedImages(page + 1, limit);
  } catch (error) {
    logger.error('Fetch archived images error:', error);
    throw error;
  }
}

/**
 * Batch archive multiple images
 */
export async function batchArchiveImages(imageIds: string[]): Promise<void> {
  try {
    logger.info('Batch archiving images:', imageIds.length);
    await apiBatchArchiveImages(imageIds);
    logger.success('Batch archive successful');
  } catch (error) {
    logger.error('Batch archive error:', error);
    throw error;
  }
}

/**
 * Batch restore multiple archived images
 */
export async function batchRestoreImages(imageIds: string[]): Promise<void> {
  try {
    logger.info('Batch restoring images:', imageIds.length);
    await apiBatchRestoreImages(imageIds);
    logger.success('Batch restore successful');
  } catch (error) {
    logger.error('Batch restore error:', error);
    throw error;
  }
}

/**
 * Batch delete multiple archived images
 */
export async function batchDeleteArchivedImages(imageIds: string[]): Promise<void> {
  try {
    logger.info('Batch deleting images:', imageIds.length);
    await apiBatchDeleteImages(imageIds);
    logger.success('Batch delete successful');
  } catch (error) {
    logger.error('Batch delete error:', error);
    throw error;
  }
}
