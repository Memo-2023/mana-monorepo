import { Injectable, Logger } from '@nestjs/common';
import exifr from 'exifr';

export interface ExifData {
	// Camera info
	cameraMake?: string;
	cameraModel?: string;
	// Lens info
	focalLength?: string;
	aperture?: string;
	// Exposure
	iso?: number;
	exposureTime?: string;
	// Date/time
	dateTaken?: Date;
	// GPS
	gpsLatitude?: string;
	gpsLongitude?: string;
	// Full raw EXIF data
	raw?: Record<string, unknown>;
}

@Injectable()
export class ExifService {
	private readonly logger = new Logger(ExifService.name);

	/**
	 * Extract EXIF data from an image buffer
	 */
	async extract(buffer: Buffer): Promise<ExifData | null> {
		try {
			const exif = await exifr.parse(buffer, {
				// Include GPS data
				gps: true,
				// Parse all EXIF data
				tiff: true,
				exif: true,
			});

			if (!exif) {
				return null;
			}

			const result: ExifData = {
				raw: exif,
			};

			// Camera info
			if (exif.Make) {
				result.cameraMake = String(exif.Make).trim();
			}
			if (exif.Model) {
				result.cameraModel = String(exif.Model).trim();
			}

			// Lens/exposure settings
			if (exif.FocalLength) {
				result.focalLength = `${exif.FocalLength}mm`;
			}
			if (exif.FNumber) {
				result.aperture = String(exif.FNumber);
			}
			if (exif.ISO) {
				result.iso = Number(exif.ISO);
			}
			if (exif.ExposureTime) {
				// Format as fraction (e.g., "1/125")
				if (exif.ExposureTime < 1) {
					result.exposureTime = `1/${Math.round(1 / exif.ExposureTime)}`;
				} else {
					result.exposureTime = `${exif.ExposureTime}s`;
				}
			}

			// Date taken
			if (exif.DateTimeOriginal) {
				result.dateTaken = new Date(exif.DateTimeOriginal);
			} else if (exif.CreateDate) {
				result.dateTaken = new Date(exif.CreateDate);
			}

			// GPS coordinates
			if (exif.latitude !== undefined && exif.longitude !== undefined) {
				result.gpsLatitude = String(exif.latitude);
				result.gpsLongitude = String(exif.longitude);
			}

			this.logger.debug(
				`Extracted EXIF: camera=${result.cameraMake} ${result.cameraModel}, date=${result.dateTaken}`
			);

			return result;
		} catch (error) {
			this.logger.warn(`Failed to extract EXIF data: ${error}`);
			return null;
		}
	}

	/**
	 * Check if the buffer likely contains EXIF data (quick check)
	 */
	hasExif(buffer: Buffer): boolean {
		// JPEG files with EXIF start with FFD8 and contain "Exif" marker
		if (buffer[0] === 0xff && buffer[1] === 0xd8) {
			const exifMarker = buffer.indexOf('Exif');
			return exifMarker !== -1 && exifMarker < 100;
		}
		return false;
	}
}
