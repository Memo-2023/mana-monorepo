import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'content-images';

export async function uploadImage(
	supabase: SupabaseClient,
	userId: string,
	nodeId: string,
	imageData: string | Blob,
	fileName?: string
): Promise<{ url: string; path: string } | null> {
	try {
		// Generate unique file name
		const timestamp = Date.now();
		const extension = fileName?.split('.').pop() || 'png';
		const filePath = `${userId}/${nodeId}/${timestamp}.${extension}`;

		// Convert base64 to blob if needed
		let uploadData: Blob;
		if (typeof imageData === 'string') {
			// Remove data URL prefix if present
			const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
			const byteCharacters = atob(base64Data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			uploadData = new Blob([byteArray], { type: `image/${extension}` });
		} else {
			uploadData = imageData;
		}

		// Upload to Supabase Storage
		const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, uploadData, {
			contentType: `image/${extension}`,
			upsert: true,
		});

		if (error) {
			console.error('Upload error:', error);
			return null;
		}

		// Get public URL
		const {
			data: { publicUrl },
		} = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

		return {
			url: publicUrl,
			path: filePath,
		};
	} catch (error) {
		console.error('Error uploading image:', error);
		return null;
	}
}

export async function deleteImage(supabase: SupabaseClient, filePath: string): Promise<boolean> {
	try {
		const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

		if (error) {
			console.error('Delete error:', error);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Error deleting image:', error);
		return false;
	}
}

export function getImageUrl(supabase: SupabaseClient, filePath: string): string {
	const {
		data: { publicUrl },
	} = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

	return publicUrl;
}
