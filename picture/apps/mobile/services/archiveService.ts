import { supabase } from '~/utils/supabase';
import { logger } from '~/utils/logger';

/**
 * Archive an image by setting archived_at timestamp
 */
export async function archiveImage(imageId: string): Promise<void> {
  try {
    logger.info('Archiving image:', imageId);

    const { error } = await supabase
      .from('images')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', imageId);

    if (error) {
      logger.error('Failed to archive image:', error);
      throw error;
    }

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

    const { error } = await supabase
      .from('images')
      .update({ archived_at: null })
      .eq('id', imageId);

    if (error) {
      logger.error('Failed to restore image:', error);
      throw error;
    }

    logger.success('Image restored successfully');
  } catch (error) {
    logger.error('Restore error:', error);
    throw error;
  }
}

/**
 * Delete an archived image permanently (from storage and database)
 */
export async function deleteArchivedImage(imageId: string): Promise<void> {
  try {
    logger.info('Deleting archived image:', imageId);

    // 1. Get image details for storage_path
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('storage_path')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch image details:', fetchError);
      throw fetchError;
    }

    // 2. Delete from storage if path exists
    if (image?.storage_path) {
      logger.debug('Deleting from storage:', image.storage_path);
      const { error: storageError } = await supabase.storage
        .from('generated-images')
        .remove([image.storage_path]);

      if (storageError) {
        logger.warn('Storage deletion failed (file may not exist):', storageError);
        // Don't throw - continue with DB deletion
      }
    }

    // 3. Delete from database
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      logger.error('Failed to delete from database:', dbError);
      throw dbError;
    }

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
    const { count, error } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('archived_at', 'is', null);

    if (error) {
      logger.error('Failed to get archived count:', error);
      return 0;
    }

    return count || 0;
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
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('images')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .range(from, to);

    if (error) {
      logger.error('Failed to fetch archived images:', error);
      throw error;
    }

    return {
      items: data || [],
      total: count || 0,
      hasMore: count ? to < count - 1 : false,
    };
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

    const { error } = await supabase
      .from('images')
      .update({ archived_at: new Date().toISOString() })
      .in('id', imageIds);

    if (error) {
      logger.error('Failed to batch archive:', error);
      throw error;
    }

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

    const { error } = await supabase
      .from('images')
      .update({ archived_at: null })
      .in('id', imageIds);

    if (error) {
      logger.error('Failed to batch restore:', error);
      throw error;
    }

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

    // 1. Get all storage paths
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('storage_path')
      .in('id', imageIds);

    if (fetchError) {
      logger.error('Failed to fetch images for batch delete:', fetchError);
      throw fetchError;
    }

    // 2. Delete from storage
    const storagePaths = images?.map(img => img.storage_path).filter(Boolean) || [];
    if (storagePaths.length > 0) {
      logger.debug('Deleting from storage:', storagePaths.length, 'files');
      const { error: storageError } = await supabase.storage
        .from('generated-images')
        .remove(storagePaths);

      if (storageError) {
        logger.warn('Some storage deletions failed:', storageError);
        // Don't throw - continue with DB deletion
      }
    }

    // 3. Delete from database
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .in('id', imageIds);

    if (dbError) {
      logger.error('Failed to batch delete from database:', dbError);
      throw dbError;
    }

    logger.success('Batch delete successful');
  } catch (error) {
    logger.error('Batch delete error:', error);
    throw error;
  }
}
