export const PROCESS_QUEUE = 'media-process';

export const IMAGE_VARIANTS = {
	thumbnail: { width: 200, height: 200, fit: 'cover' as const },
	medium: { width: 800, height: 800, fit: 'inside' as const },
	large: { width: 1920, height: 1920, fit: 'inside' as const },
};

export const SUPPORTED_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/avif',
	'image/heic',
	'image/heif',
];
