import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImage = async (file: Blob, path: string): Promise<string> => {
	try {
		const storageRef = ref(storage, path);
		const metadata = {
			contentType: 'image/jpeg',
			cacheControl: 'public,max-age=3600',
		};
		const snapshot = await uploadBytes(storageRef, file, metadata);
		const downloadURL = await getDownloadURL(snapshot.ref);
		return downloadURL;
	} catch (error) {
		console.error('[Storage] Error uploading image:', error);
		throw error;
	}
};

export const uploadImages = async (files: Blob[], basePath: string): Promise<string[]> => {
	try {
		const uploadPromises = files.map((file, index) => {
			const path = `${basePath}/${index}_${Date.now()}.jpg`;
			return uploadImage(file, path);
		});
		return await Promise.all(uploadPromises);
	} catch (error) {
		console.error('[Storage] Error uploading images:', error);
		throw error;
	}
};
