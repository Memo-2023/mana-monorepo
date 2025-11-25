/**
 * BlurHash utility functions
 *
 * BlurHash is a compact representation of an image placeholder that can be
 * decoded into a blurred version of the original image.
 */

import { encode } from 'blurhash';

/**
 * Generate a BlurHash from an image URL
 *
 * @param imageUrl - URL of the image to generate BlurHash for
 * @param componentX - Number of horizontal components (default: 4)
 * @param componentY - Number of vertical components (default: 3)
 * @returns BlurHash string or null on error
 */
export async function generateBlurHash(
  imageUrl: string,
  componentX: number = 4,
  componentY: number = 3
): Promise<string | null> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to fetch image for BlurHash generation');
      return null;
    }

    const blob = await response.blob();

    // Create image bitmap for pixel data extraction
    const imageBitmap = await createImageBitmap(blob);

    // Create canvas to get pixel data
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get canvas context');
      return null;
    }

    context.drawImage(imageBitmap, 0, 0);

    // Get pixel data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Generate BlurHash
    const blurHash = encode(
      imageData.data,
      imageData.width,
      imageData.height,
      componentX,
      componentY
    );

    return blurHash;
  } catch (error) {
    console.error('Error generating BlurHash:', error);
    return null;
  }
}

/**
 * Generate BlurHash from Image Uint8Array (for Edge Functions)
 *
 * This is a server-side compatible version that works with Deno
 */
export async function generateBlurHashFromBuffer(
  imageBuffer: Uint8Array,
  width: number,
  height: number,
  componentX: number = 4,
  componentY: number = 3
): Promise<string | null> {
  try {
    // This would need an image decoding library in Deno
    // For now, we return a placeholder
    // TODO: Implement proper image decoding in Deno environment
    console.log('BlurHash generation from buffer not yet implemented for Deno');
    return null;
  } catch (error) {
    console.error('Error generating BlurHash from buffer:', error);
    return null;
  }
}

/**
 * Default BlurHash fallback
 * A neutral gray blur that works well for most images
 */
export const DEFAULT_BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';
