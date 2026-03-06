import type { MatrixClient } from 'matrix-js-sdk';

export interface UploadResult {
	mxcUrl: string;
	mimetype: string;
	size: number;
	width?: number;
	height?: number;
	filename?: string;
}

/**
 * Upload a local file URI to the Matrix homeserver.
 * Returns the mxc:// URL and metadata.
 */
export async function uploadMedia(
	client: MatrixClient,
	fileUri: string,
	filename: string,
	mimetype: string,
): Promise<UploadResult> {
	// Fetch the file as a blob
	const response = await fetch(fileUri);
	const blob = await response.blob();

	// Use the matrix-js-sdk upload endpoint
	const uploadResponse = await (client as any).uploadContent(blob, {
		name: filename,
		type: mimetype,
		rawResponse: false,
	});

	const mxcUrl: string = uploadResponse?.content_uri ?? uploadResponse;

	return {
		mxcUrl,
		mimetype,
		size: blob.size,
		filename,
	};
}

export function getMimetypeFromFilename(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	const map: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		heic: 'image/heic',
		mp4: 'video/mp4',
		mov: 'video/quicktime',
		mp3: 'audio/mpeg',
		m4a: 'audio/mp4',
		ogg: 'audio/ogg',
		pdf: 'application/pdf',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		zip: 'application/zip',
	};
	return map[ext] ?? 'application/octet-stream';
}
