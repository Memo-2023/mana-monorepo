import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

// Initialize R2 Client (S3-compatible)
const r2Client = new S3Client({
	region: 'auto',
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID || '',
		secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
	},
});

export type Bucket = 'avatars' | 'qr-codes';

/**
 * Upload a file to Cloudflare R2
 * @param file - File to upload
 * @param bucket - Target bucket ('avatars' | 'qr-codes')
 * @param userId - User ID for file naming
 * @returns Public URL of uploaded file
 */
export async function uploadFile(file: File, bucket: Bucket, userId: string): Promise<string> {
	const ext = file.name.split('.').pop();
	const fileName = `${userId}-${Date.now()}.${ext}`;
	const bucketName = bucket === 'avatars' ? env.R2_BUCKET_AVATARS : env.R2_BUCKET_QR;

	try {
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: fileName,
			Body: Buffer.from(await file.arrayBuffer()),
			ContentType: file.type,
			CacheControl: 'public, max-age=31536000', // 1 year cache
		});

		await r2Client.send(command);

		// Return public URL
		const publicUrl = `${env.R2_PUBLIC_URL}/${bucket}/${fileName}`;
		return publicUrl;
	} catch (error) {
		console.error('File upload error:', error);
		throw new Error('Failed to upload file');
	}
}

/**
 * Delete a file from R2
 * @param bucket - Bucket name
 * @param fileName - File name to delete
 */
export async function deleteFile(bucket: Bucket, fileName: string): Promise<void> {
	const bucketName = bucket === 'avatars' ? env.R2_BUCKET_AVATARS : env.R2_BUCKET_QR;

	try {
		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: fileName,
		});

		await r2Client.send(command);
	} catch (error) {
		console.error('File deletion error:', error);
		throw new Error('Failed to delete file');
	}
}

/**
 * Generate a presigned URL for temporary file access
 * @param bucket - Bucket name
 * @param fileName - File name
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
	bucket: Bucket,
	fileName: string,
	expiresIn: number = 3600
): Promise<string> {
	const bucketName = bucket === 'avatars' ? env.R2_BUCKET_AVATARS : env.R2_BUCKET_QR;

	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: fileName,
	});

	return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Extract file name from URL
 * @param url - Full file URL
 * @returns File name
 */
export function extractFileNameFromUrl(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const parts = urlObj.pathname.split('/');
		return parts[parts.length - 1];
	} catch {
		return null;
	}
}

/**
 * Validate file size and type
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Allowed MIME types
 */
export function validateFile(
	file: File,
	maxSizeMB: number = 5,
	allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): { valid: boolean; error?: string } {
	// Check size
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	if (file.size > maxSizeBytes) {
		return {
			valid: false,
			error: `File size exceeds ${maxSizeMB}MB limit`,
		};
	}

	// Check type
	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`,
		};
	}

	return { valid: true };
}
