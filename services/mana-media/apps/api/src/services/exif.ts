import exifr from 'exifr';

export interface ExifData {
	cameraMake?: string;
	cameraModel?: string;
	focalLength?: string;
	aperture?: string;
	iso?: number;
	exposureTime?: string;
	dateTaken?: Date;
	gpsLatitude?: string;
	gpsLongitude?: string;
	raw?: Record<string, unknown>;
}

export class ExifService {
	async extract(buffer: Buffer): Promise<ExifData | null> {
		try {
			const exif = await exifr.parse(buffer, {
				gps: true,
				tiff: true,
				exif: true,
			});

			if (!exif) return null;

			const result: ExifData = { raw: exif };

			if (exif.Make) result.cameraMake = String(exif.Make).trim();
			if (exif.Model) result.cameraModel = String(exif.Model).trim();
			if (exif.FocalLength) result.focalLength = `${exif.FocalLength}mm`;
			if (exif.FNumber) result.aperture = String(exif.FNumber);
			if (exif.ISO) result.iso = Number(exif.ISO);
			if (exif.ExposureTime) {
				result.exposureTime =
					exif.ExposureTime < 1
						? `1/${Math.round(1 / exif.ExposureTime)}`
						: `${exif.ExposureTime}s`;
			}
			if (exif.DateTimeOriginal) {
				result.dateTaken = new Date(exif.DateTimeOriginal);
			} else if (exif.CreateDate) {
				result.dateTaken = new Date(exif.CreateDate);
			}
			if (exif.latitude !== undefined && exif.longitude !== undefined) {
				result.gpsLatitude = String(exif.latitude);
				result.gpsLongitude = String(exif.longitude);
			}

			return result;
		} catch (error) {
			console.warn(`Failed to extract EXIF data: ${error}`);
			return null;
		}
	}
}
