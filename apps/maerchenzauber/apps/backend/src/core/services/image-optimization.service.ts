import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { encode } from 'blurhash';

export interface OptimizedImages {
  original: Buffer;
  large: Buffer;
  medium: Buffer;
  thumbnail: Buffer;
}

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);

  /**
   * Optimize an image and generate multiple sizes
   * @param imageBuffer The original image buffer
   * @returns Object with different image sizes
   */
  async optimizeImage(imageBuffer: Buffer): Promise<OptimizedImages> {
    try {
      this.logger.log('Starting image optimization');

      // Generate all sizes in parallel for speed
      const [large, medium, thumbnail] = await Promise.all([
        // Large: 1200px width, high quality for detail views
        sharp(imageBuffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 90 })
          .toBuffer(),

        // Medium: 800px width, good balance for lists
        sharp(imageBuffer)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer(),

        // Thumbnail: 200px, fast loading
        sharp(imageBuffer)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 80 })
          .toBuffer(),
      ]);

      this.logger.log(
        `Image optimized - Original: ${(imageBuffer.length / 1024).toFixed(
          1,
        )}KB, ` +
          `Large: ${(large.length / 1024).toFixed(1)}KB, ` +
          `Medium: ${(medium.length / 1024).toFixed(1)}KB, ` +
          `Thumbnail: ${(thumbnail.length / 1024).toFixed(1)}KB`,
      );

      return {
        original: imageBuffer,
        large,
        medium,
        thumbnail,
      };
    } catch (error) {
      this.logger.error('Error optimizing image:', error);
      throw error;
    }
  }

  /**
   * Generate BlurHash for smooth placeholder loading
   * @param imageBuffer The image buffer
   * @returns BlurHash string
   */
  async generateBlurHash(imageBuffer: Buffer): Promise<string> {
    try {
      // Resize to tiny size for BlurHash encoding (faster and sufficient)
      const { data, info } = await sharp(imageBuffer)
        .resize(32, 32, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Encode to BlurHash (4x4 components is good balance)
      const blurHash = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        4,
        4,
      );

      this.logger.log(`Generated BlurHash: ${blurHash.substring(0, 20)}...`);
      return blurHash;
    } catch (error) {
      this.logger.error('Error generating BlurHash:', error);
      // Return default BlurHash on error (neutral gray)
      return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
    }
  }

  /**
   * Get image metadata
   * @param imageBuffer The image buffer
   * @returns Metadata object
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: imageBuffer.length,
      };
    } catch (error) {
      this.logger.error('Error getting image metadata:', error);
      throw error;
    }
  }

  /**
   * Convert any image format to WebP
   * @param imageBuffer The image buffer
   * @param quality Quality setting (1-100)
   * @returns WebP buffer
   */
  async convertToWebP(imageBuffer: Buffer, quality = 85): Promise<Buffer> {
    try {
      return await sharp(imageBuffer).webp({ quality }).toBuffer();
    } catch (error) {
      this.logger.error('Error converting to WebP:', error);
      throw error;
    }
  }
}
