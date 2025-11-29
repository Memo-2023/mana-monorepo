import { useState, useCallback, useEffect } from 'react';
import { ImagePickerAsset } from 'expo-image-picker';
import { MemoPhoto } from '../storage.types';
import { photoStorageService } from '../photoStorage.service';
import { useToast } from '~/features/toast/contexts/ToastContext';
import { useTranslation } from 'react-i18next';

interface UsePhotoUploadReturn {
	photos: MemoPhoto[];
	uploading: boolean;
	loading: boolean;
	selectAndUploadPhotos: () => Promise<void>;
	uploadSelectedPhotos: (selectedPhotos: ImagePickerAsset[]) => Promise<void>;
	deletePhoto: (photoId: string) => Promise<void>;
	loadPhotos: () => Promise<void>;
	refreshPhotos: () => Promise<void>;
}

export function usePhotoUpload(memoId: string | undefined): UsePhotoUploadReturn {
	const [photos, setPhotos] = useState<MemoPhoto[]>([]);
	const [uploading, setUploading] = useState(false);
	const [loading, setLoading] = useState(false);

	const { showSuccess, showError } = useToast();
	const { t } = useTranslation();

	/**
	 * Loads photos for the current memo
	 */
	const loadPhotos = useCallback(async () => {
		if (!memoId) return;

		try {
			setLoading(true);
			const memoPhotos = await photoStorageService.getPhotosForMemo(memoId);

			// Add signed URLs for display
			const photosWithUrls = await photoStorageService.addSignedUrlsToPhotos(memoPhotos);

			setPhotos(photosWithUrls);
		} catch (error) {
			console.debug('Error loading photos:', error);
			showError(t('memo.photos_load_error', 'Fehler beim Laden der Fotos'));
		} finally {
			setLoading(false);
		}
	}, [memoId, showError, t]);

	/**
	 * Refreshes photos (alias for loadPhotos)
	 */
	const refreshPhotos = useCallback(async () => {
		await loadPhotos();
	}, [loadPhotos]);

	/**
	 * Opens photo picker and uploads selected photos
	 */
	const selectAndUploadPhotos = useCallback(async () => {
		if (!memoId) {
			showError(t('memo.memo_id_required', 'Memo-ID ist erforderlich'));
			return;
		}

		try {
			setUploading(true);

			// Select photos using the service
			const selectedPhotos = await photoStorageService.selectPhotos({
				allowsMultipleSelection: true,
				quality: 0.8,
			});

			if (selectedPhotos.length === 0) {
				return; // User cancelled selection
			}

			// Upload photos
			const uploadResults = await photoStorageService.uploadPhotos(memoId, selectedPhotos);

			// Process results
			const successfulUploads = uploadResults.filter((result) => result.success);
			const failedUploads = uploadResults.filter((result) => !result.success);

			if (successfulUploads.length > 0) {
				showSuccess(
					t('memo.photos_upload_success', '{{count}} Foto(s) erfolgreich hochgeladen!', {
						count: successfulUploads.length,
					})
				);

				// Reload photos to get the latest data with signed URLs
				await loadPhotos();
			}

			if (failedUploads.length > 0) {
				showError(
					t(
						'memo.photos_upload_partial_error',
						'{{failed}} von {{total}} Fotos konnten nicht hochgeladen werden.',
						{ failed: failedUploads.length, total: uploadResults.length }
					)
				);
			}
		} catch (error) {
			console.debug('Error uploading photos:', error);

			if (error instanceof Error) {
				if (error.message.includes('permission')) {
					showError(t('memo.photo_permission_error', 'Berechtigung für Fotos erforderlich'));
				} else {
					showError(t('memo.photos_upload_error', 'Fehler beim Hochladen der Fotos'));
				}
			} else {
				showError(t('memo.photos_upload_error', 'Fehler beim Hochladen der Fotos'));
			}
		} finally {
			setUploading(false);
		}
	}, [memoId, showSuccess, showError, t, loadPhotos]);

	/**
	 * Uploads already selected photos
	 */
	const uploadSelectedPhotos = useCallback(
		async (selectedPhotos: ImagePickerAsset[]) => {
			if (!memoId) {
				showError(t('memo.memo_id_required', 'Memo-ID ist erforderlich'));
				return;
			}

			if (selectedPhotos.length === 0) {
				return; // No photos to upload
			}

			try {
				setUploading(true);

				// Upload photos
				const uploadResults = await photoStorageService.uploadPhotos(memoId, selectedPhotos);

				// Process results
				const successfulUploads = uploadResults.filter((result) => result.success);
				const failedUploads = uploadResults.filter((result) => !result.success);

				if (successfulUploads.length > 0) {
					showSuccess(
						t('memo.photos_upload_success', '{{count}} Foto(s) erfolgreich hochgeladen!', {
							count: successfulUploads.length,
						})
					);

					// Reload photos to get the latest data with signed URLs
					await loadPhotos();
				}

				if (failedUploads.length > 0) {
					showError(
						t(
							'memo.photos_upload_partial_error',
							'{{failed}} von {{total}} Fotos konnten nicht hochgeladen werden.',
							{ failed: failedUploads.length, total: uploadResults.length }
						)
					);
				}
			} catch (error) {
				console.debug('Error uploading selected photos:', error);

				if (error instanceof Error) {
					if (error.message.includes('permission')) {
						showError(t('memo.photo_permission_error', 'Berechtigung für Fotos erforderlich'));
					} else {
						showError(t('memo.photos_upload_error', 'Fehler beim Hochladen der Fotos'));
					}
				} else {
					showError(t('memo.photos_upload_error', 'Fehler beim Hochladen der Fotos'));
				}
			} finally {
				setUploading(false);
			}
		},
		[memoId, showSuccess, showError, t, loadPhotos]
	);

	/**
	 * Deletes a photo
	 */
	const deletePhoto = useCallback(
		async (photoPath: string) => {
			if (!memoId) {
				showError(t('memo.memo_id_required', 'Memo-ID ist erforderlich'));
				return;
			}

			try {
				const success = await photoStorageService.deletePhoto(memoId, photoPath);

				if (success) {
					showSuccess(t('memo.photo_delete_success', 'Foto erfolgreich gelöscht!'));

					// Remove from local state immediately for better UX
					setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.path !== photoPath));
				} else {
					showError(t('memo.photo_delete_error', 'Fehler beim Löschen des Fotos'));
				}
			} catch (error) {
				console.debug('Error deleting photo:', error);
				showError(t('memo.photo_delete_error', 'Fehler beim Löschen des Fotos'));
			}
		},
		[memoId, showSuccess, showError, t]
	);

	/**
	 * Load photos when memoId changes
	 */
	useEffect(() => {
		if (memoId) {
			loadPhotos();
		}
	}, [memoId, loadPhotos]);

	return {
		photos,
		uploading,
		loading,
		selectAndUploadPhotos,
		uploadSelectedPhotos,
		deletePhoto,
		loadPhotos,
		refreshPhotos,
	};
}
