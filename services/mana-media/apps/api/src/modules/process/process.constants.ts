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

export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg'];

export const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];

export const SUPPORTED_DOCUMENT_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
