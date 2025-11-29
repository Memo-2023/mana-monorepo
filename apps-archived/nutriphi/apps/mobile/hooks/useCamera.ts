import { useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { PhotoService } from '../services/storage/PhotoService';

export function useCamera() {
	const [permission, requestPermission] = useCameraPermissions();
	const [isReady, setIsReady] = useState(false);
	const [isCapturing, setIsCapturing] = useState(false);
	const [facing, setFacing] = useState<CameraType>('back');
	const cameraRef = useRef<CameraView>(null);

	const photoService = PhotoService.getInstance();

	const toggleCameraFacing = () => {
		setFacing((current) => (current === 'back' ? 'front' : 'back'));
	};

	const takePicture = async () => {
		if (!cameraRef.current || isCapturing) return null;

		try {
			setIsCapturing(true);

			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.8,
				base64: false,
				exif: false,
			});

			if (!photo) return null;

			// Save photo using PhotoService
			const savedPhoto = await photoService.savePhoto(photo.uri);

			return {
				uri: photo.uri,
				...savedPhoto,
			};
		} catch (error) {
			console.error('Failed to take picture:', error);
			throw error;
		} finally {
			setIsCapturing(false);
		}
	};

	const pickImageFromGallery = async () => {
		try {
			// Request permission
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permissionResult.granted) {
				throw new Error('Permission to access gallery denied');
			}

			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (result.canceled) {
				return null;
			}

			const asset = result.assets[0];

			// Save photo using PhotoService
			const savedPhoto = await photoService.savePhoto(asset.uri);

			return {
				uri: asset.uri,
				...savedPhoto,
			};
		} catch (error) {
			console.error('Failed to pick image from gallery:', error);
			throw error;
		}
	};

	const hasPermission = permission?.granted ?? false;
	const canAskPermission = permission?.canAskAgain ?? true;

	return {
		// Permission state
		hasPermission,
		canAskPermission,
		requestPermission,

		// Camera state
		isReady,
		setIsReady,
		isCapturing,
		facing,
		cameraRef,

		// Actions
		toggleCameraFacing,
		takePicture,
		pickImageFromGallery,
	};
}
