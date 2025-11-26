/**
 * Image utility functions for handling Supabase Storage transformations
 */

export type ThumbnailSize = 'tiny' | 'small' | 'medium' | 'full';

/**
 * Get the appropriate thumbnail URL based on the view mode or size requirement
 *
 * Supabase Storage Transformations: https://supabase.com/docs/guides/storage/serving/image-transformations
 * Format: {storage-url}/render/image/authenticated/{bucket}/{path}?width={w}&height={h}
 */
export function getThumbnailUrl(
  publicUrl: string | null,
  size: ThumbnailSize = 'medium'
): string | null {
  if (!publicUrl) return null;

  // If it's already a full URL with transformations, return as is
  if (publicUrl.includes('?width=') || publicUrl.includes('&width=')) {
    return publicUrl;
  }

  // Determine dimensions based on size
  const dimensions: Record<ThumbnailSize, number> = {
    tiny: 100,    // For grid5 view
    small: 200,   // For grid3 view
    medium: 400,  // For single view
    full: 0,      // No transformation, use original
  };

  const targetSize = dimensions[size];

  // If full resolution requested, return original URL
  if (targetSize === 0) {
    return publicUrl;
  }

  // Parse the Supabase Storage URL
  // Expected format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const url = new URL(publicUrl);

  // Add transformation parameters
  url.searchParams.set('width', targetSize.toString());
  url.searchParams.set('height', targetSize.toString());
  url.searchParams.set('resize', 'cover'); // Crop to fill the dimensions
  url.searchParams.set('quality', '80'); // Good balance between quality and file size

  return url.toString();
}

/**
 * Get thumbnail size based on view mode
 */
export function getSizeForViewMode(viewMode: 'single' | 'grid3' | 'grid5'): ThumbnailSize {
  switch (viewMode) {
    case 'grid5':
      return 'tiny';
    case 'grid3':
      return 'small';
    case 'single':
      return 'medium';
    default:
      return 'medium';
  }
}
