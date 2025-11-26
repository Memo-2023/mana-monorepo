import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from './fileSystemUtils';
import { ImagePickerAsset } from 'expo-image-picker';
import { getAuthenticatedClient } from '../auth/lib/supabaseClient';
import { authService } from '../auth/services/authService';
import { 
  MemoPhoto, 
  PhotoUploadResult, 
  PhotoProcessingConfig, 
  DEFAULT_PHOTO_CONFIG 
} from './storage.types';

/**
 * Service for photo storage operations
 */
class PhotoStorageService {
  private config: PhotoProcessingConfig = { ...DEFAULT_PHOTO_CONFIG };

  /**
   * Sets the photo processing configuration
   */
  setConfig(config: Partial<PhotoProcessingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Requests permission to access the photo library
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.debug('Error requesting photo permissions:', error);
      return false;
    }
  }

  /**
   * Opens the image picker to select multiple photos
   */
  async selectPhotos(options?: {
    allowsMultipleSelection?: boolean;
    quality?: number;
    aspect?: [number, number];
  }): Promise<ImagePickerAsset[]> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Photo library permission not granted');
      }

      // Use the appropriate mediaTypes based on what's available
      console.debug('ImagePicker API check:', {
        hasMediaType: !!ImagePicker.MediaType,
        hasMediaTypeOptions: !!ImagePicker.MediaTypeOptions,
        MediaTypeImages: ImagePicker.MediaType?.Images,
        MediaTypeOptionsImages: ImagePicker.MediaTypeOptions?.Images
      });
      
      const mediaTypes = ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || 'images';
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsMultipleSelection: options?.allowsMultipleSelection ?? true,
        quality: options?.quality ?? this.config.quality,
        aspect: options?.aspect,
        allowsEditing: false,
        exif: false,
      });

      if (result.canceled) {
        return [];
      }

      return result.assets;
    } catch (error) {
      console.debug('Error selecting photos:', error);
      
      // Handle specific iOS FileProvider errors that are common in simulator
      if (error instanceof Error && error.message.includes('FileProvider')) {
        console.debug('FileProvider error detected (common in iOS simulator), retrying...');
        // This is a common iOS simulator issue, the actual functionality usually works
      }
      
      throw error;
    }
  }

  /**
   * Resizes and compresses an image
   */
  async processImage(
    uri: string,
    config: Partial<PhotoProcessingConfig> = {}
  ): Promise<string> {
    try {
      const processConfig = { ...this.config, ...config };
      
      // Check if ImageManipulator is available
      if (!ImagePicker.manipulateAsync) {
        console.debug('ImageManipulator not available, returning original URI');
        return uri; // Return original if manipulator not available
      }
      
      // Use ImagePicker's manipulateAsync for image processing
      const manipulatedImage = await ImagePicker.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: processConfig.maxWidth,
              height: processConfig.maxHeight,
            },
          },
        ],
        {
          compress: processConfig.quality,
          format: processConfig.format === 'jpeg' 
            ? ImagePicker.SaveFormat.JPEG 
            : ImagePicker.SaveFormat.PNG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.debug('Error processing image:', error);
      // Return original URI if processing fails
      return uri;
    }
  }

  /**
   * Gets image dimensions
   */
  async getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    try {
      const info = await FileSystem.getFileInfo(uri);
      if (!info.exists) {
        throw new Error('Image file does not exist');
      }

      // For now, we'll return default dimensions since expo-file-system
      // doesn't provide image dimensions directly
      // You might want to use expo-image or react-native-image-size for this
      return { width: 0, height: 0 };
    } catch (error) {
      console.debug('Error getting image dimensions:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * Generates a unique filename for a photo
   */
  private generatePhotoFilename(originalName?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName?.split('.').pop() || 'jpg';
    
    return `photo-${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Uploads multiple photos to Supabase Storage and updates memo.source
   */
  async uploadPhotos(
    memoId: string, 
    photos: ImagePickerAsset[]
  ): Promise<PhotoUploadResult[]> {
    const results: PhotoUploadResult[] = [];

    for (const photo of photos) {
      try {
        const result = await this.uploadSinglePhoto(memoId, photo);
        results.push(result);
      } catch (error) {
        console.debug('Error uploading photo:', error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // If any uploads were successful, update the memo.source
    const successfulPhotos = results
      .filter(result => result.success && result.photo)
      .map(result => result.photo!);

    if (successfulPhotos.length > 0) {
      await this.updateMemoWithPhotos(memoId, successfulPhotos);
    }

    return results;
  }

  /**
   * Uploads a single photo to Supabase Storage
   */
  private async uploadSinglePhoto(
    memoId: string, 
    photo: ImagePickerAsset
  ): Promise<PhotoUploadResult> {
    try {
      // Get authenticated client and user info with automatic refresh
      const { tokenManager } = await import('~/features/auth/services/tokenManager');
      const appToken = await tokenManager.getValidToken();
      const userData = await authService.getUserFromToken();
      
      if (!appToken || !userData?.id) {
        throw new Error('Authentication required');
      }

      // Process the image (resize/compress)
      const processedUri = await this.processImage(photo.uri);
      
      // Generate filename and storage path
      const filename = this.generatePhotoFilename(photo.fileName);
      const storagePath = `${userData.id}/${memoId}/photos/${filename}`;

      // Get file info
      const fileInfo = await FileSystem.getFileInfo(processedUri);
      if (!fileInfo.exists) {
        throw new Error('Processed image file not found');
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: processedUri,
        type: photo.mimeType || 'image/jpeg',
        name: filename,
      } as any);

      // Upload to Supabase Storage
      const { supabaseUrl } = await import('../auth');
      const uploadUrl = `${supabaseUrl}/storage/v1/object/user-uploads/${storagePath}`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${appToken}`,
          'x-upsert': 'true',
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      // Get image dimensions
      const dimensions = await this.getImageDimensions(processedUri);

      // Clean up processed file if it's different from original
      if (processedUri !== photo.uri) {
        try {
          await FileSystem.deleteFile(processedUri);
        } catch (deleteError) {
          console.debug('Error cleaning up processed file:', deleteError);
        }
      }

      // Create photo object for memo.source
      const memoPhoto: MemoPhoto = {
        path: storagePath,
        type: 'photo',
        filename,
        uploadedAt: new Date().toISOString(),
        fileSize: fileInfo.size,
        dimensions: dimensions.width > 0 ? dimensions : undefined,
        metadata: {
          originalName: photo.fileName,
          mimeType: photo.mimeType,
          orientation: photo.orientation,
        },
      };

      return {
        success: true,
        photo: memoPhoto,
      };

    } catch (error) {
      console.debug('Error in uploadSinglePhoto:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Updates memo.source with new photos
   */
  private async updateMemoWithPhotos(memoId: string, newPhotos: MemoPhoto[]): Promise<void> {
    try {
      const supabase = await getAuthenticatedClient();
      
      // Get current memo
      const { data: memo, error: fetchError } = await supabase
        .from('memos')
        .select('source')
        .eq('id', memoId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch memo: ${fetchError.message}`);
      }

      // Update source with new photos
      const currentSource = memo.source || {};
      const existingPhotos = currentSource.photos || [];
      
      const updatedSource = {
        ...currentSource,
        photos: [...existingPhotos, ...newPhotos]
      };

      // Update memo in database
      const { error: updateError } = await supabase
        .from('memos')
        .update({
          source: updatedSource,
          updated_at: new Date().toISOString()
        })
        .eq('id', memoId);

      if (updateError) {
        throw new Error(`Failed to update memo: ${updateError.message}`);
      }

      console.debug('Successfully updated memo with photos');
    } catch (error) {
      console.debug('Error updating memo with photos:', error);
      throw error;
    }
  }

  /**
   * Checks if a memo has any photos without loading the full photo data
   */
  async hasPhotosForMemo(memoId: string): Promise<boolean> {
    try {
      
      const supabase = await getAuthenticatedClient();
      
      const { data: memo, error } = await supabase
        .from('memos')
        .select('source')
        .eq('id', memoId)
        .single();

      

      if (error) {
        
        return false;
      }

      if (!memo) {
        
        return false;
      }

      if (!memo.source) {
        
        return false;
      }

      if (!memo.source.photos) {
        
        return false;
      }

      // Parse the photos array and check if any photo exists
      const photos = Array.isArray(memo.source.photos) 
        ? memo.source.photos 
        : JSON.parse(memo.source.photos || '[]');

      // Check if any photos exist
      const hasPhotos = Array.isArray(photos) && photos.length > 0;
      return hasPhotos;
    } catch (error) {
      console.debug('Error in hasPhotosForMemo:', error);
      return false;
    }
  }

  /**
   * Loads photos for a specific memo from memo.source
   */
  async getPhotosForMemo(memoId: string): Promise<MemoPhoto[]> {
    try {
      const supabase = await getAuthenticatedClient();
      
      const { data: memo, error } = await supabase
        .from('memos')
        .select('source')
        .eq('id', memoId)
        .single();

      if (error) {
        console.debug('Error loading memo:', error);
        return [];
      }

      // Extract photos from memo.source
      const photos = memo.source?.photos || [];
      return photos.filter((photo: any) => photo.type === 'photo');
    } catch (error) {
      console.debug('Error in getPhotosForMemo:', error);
      return [];
    }
  }

  /**
   * Generates a signed URL for viewing a photo
   */
  async getSignedPhotoUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const supabase = await getAuthenticatedClient();
      
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        console.debug('Error creating signed URL:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.debug('Error in getSignedPhotoUrl:', error);
      throw error;
    }
  }

  /**
   * Deletes a photo from storage and memo.source
   */
  async deletePhoto(memoId: string, photoPath: string): Promise<boolean> {
    try {
      const supabase = await getAuthenticatedClient();

      // Get current memo
      const { data: memo, error: fetchError } = await supabase
        .from('memos')
        .select('source')
        .eq('id', memoId)
        .single();

      if (fetchError || !memo) {
        console.debug('Error fetching memo:', fetchError);
        return false;
      }

      // Remove photo from memo.source
      const currentSource = memo.source || {};
      const existingPhotos = currentSource.photos || [];
      const updatedPhotos = existingPhotos.filter((photo: MemoPhoto) => photo.path !== photoPath);
      
      const updatedSource = {
        ...currentSource,
        photos: updatedPhotos
      };

      // Update memo in database
      const { error: updateError } = await supabase
        .from('memos')
        .update({
          source: updatedSource,
          updated_at: new Date().toISOString()
        })
        .eq('id', memoId);

      if (updateError) {
        console.debug('Error updating memo:', updateError);
        return false;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-uploads')
        .remove([photoPath]);

      if (storageError) {
        console.debug('Error deleting from storage:', storageError);
        // Don't return false here, since memo was already updated
      }

      return true;
    } catch (error) {
      console.debug('Error in deletePhoto:', error);
      return false;
    }
  }

  /**
   * Updates photos with signed URLs for display
   */
  async addSignedUrlsToPhotos(photos: MemoPhoto[]): Promise<MemoPhoto[]> {
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        try {
          const signedUrl = await this.getSignedPhotoUrl(photo.path);
          return { ...photo, signedUrl };
        } catch (error) {
          console.debug(`Error getting signed URL for photo ${photo.path}:`, error);
          return photo;
        }
      })
    );

    return photosWithUrls;
  }
}

// Export singleton instance
const photoStorageServiceInstance = new PhotoStorageService();
export { photoStorageServiceInstance as photoStorageService };