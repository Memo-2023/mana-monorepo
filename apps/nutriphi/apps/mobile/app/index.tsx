import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MealList } from '../components/meals/MealList';
import { FloatingActionButton } from '../components/ui/FloatingActionButton';
import { CameraModal } from '../components/camera/CameraModal';
import { MealWithItems } from '../types/Database';
import { useAppStore } from '../store/AppStore';

export default function Home() {
	const { toggleCameraModal, showCameraModal, cameraMode } = useAppStore();

	const handleMealPress = (meal: MealWithItems) => {
		router.push(`/meal/${meal.id}`);
	};

	const handleCameraPress = () => {
		toggleCameraModal(true, 'camera');
	};

	const handleGalleryPress = () => {
		toggleCameraModal(true, 'gallery');
	};

	return (
		<>
			<SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
				<MealList onMealPress={handleMealPress} />

				{/* Camera Button (larger, centered) */}
				<FloatingActionButton
					onPress={handleCameraPress}
					sfSymbol="camera"
					fallbackIcon="camera"
					size="large"
					position="center"
				/>

				{/* Gallery Button (smaller, right) */}
				<FloatingActionButton
					onPress={handleGalleryPress}
					sfSymbol="photo"
					fallbackIcon="image"
					size="normal"
					position="right"
				/>
			</SafeAreaView>

			{showCameraModal && <CameraModal mode={cameraMode || 'camera'} />}
		</>
	);
}
