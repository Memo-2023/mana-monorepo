import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { CameraView } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCamera } from '../../hooks/useCamera';
import { useAppStore } from '../../store/AppStore';
import { useMealStore } from '../../store/MealStore';
import { PhotoButton } from './PhotoButton';
import { PhotoPreview } from './PhotoPreview';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../Button';
import { GeminiService } from '../../services/api/GeminiService';
import { PhotoService } from '../../services/storage/PhotoService';
import { LocationService } from '../../services/LocationService';
import { UserPreferencesService } from '../../services/UserPreferencesService';
import { LocationPermissionModal } from '../location/LocationPermissionModal';

interface CameraModalProps {
  mode: 'camera' | 'gallery';
}

export const CameraModal: React.FC<CameraModalProps> = ({ mode }) => {
  const [capturedPhoto, setCapturedPhoto] = useState<{
    uri: string;
    path: string;
    size: number;
    dimensions: any;
  } | null>(null);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);

  const { showCameraModal, toggleCameraModal, setPhotoProcessing } = useAppStore();
  const { createMeal, updateMeal, createFoodItemsBatch } = useMealStore();

  const {
    hasPermission,
    canAskPermission,
    requestPermission,
    isReady,
    setIsReady,
    isCapturing,
    facing,
    cameraRef,
    toggleCameraFacing,
    takePicture,
    pickImageFromGallery,
  } = useCamera();

  const handleClose = () => {
    setCapturedPhoto(null);
    setIsGalleryLoading(false);
    toggleCameraModal(false);
  };

  const handleTakePicture = async () => {
    try {
      const photo = await takePicture();
      if (photo) {
        setCapturedPhoto(photo);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      // TODO: Show error toast
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleLocationPermissionAllow = async () => {
    const prefsService = UserPreferencesService.getInstance();
    const locationService = LocationService.getInstance();

    // Mark that we've asked
    await prefsService.markLocationPermissionAsked();

    // Request permission
    const granted = await locationService.requestPermissions();

    if (granted) {
      await prefsService.setLocationEnabled(true);
    } else {
      await prefsService.setLocationEnabled(false);
    }

    setShowLocationPermission(false);

    // Continue with photo processing
    if (capturedPhoto) {
      handleUsePhoto();
    }
  };

  const handleLocationPermissionDeny = async () => {
    const prefsService = UserPreferencesService.getInstance();

    // Mark that we've asked and user denied
    await prefsService.markLocationPermissionAsked();
    await prefsService.setLocationEnabled(false);

    setShowLocationPermission(false);

    // Continue with photo processing without location
    if (capturedPhoto) {
      handleUsePhoto();
    }
  };

  // Auto-trigger gallery picker when mode is 'gallery'
  React.useEffect(() => {
    if (showCameraModal && mode === 'gallery' && !capturedPhoto && !isGalleryLoading) {
      const pickFromGallery = async () => {
        try {
          setIsGalleryLoading(true);
          const photo = await pickImageFromGallery();
          if (photo) {
            setCapturedPhoto(photo);
          } else {
            // User cancelled, close modal
            toggleCameraModal(false);
          }
        } catch (error) {
          console.error('Failed to pick image from gallery:', error);
          toggleCameraModal(false);
        } finally {
          setIsGalleryLoading(false);
        }
      };
      pickFromGallery();
    }
  }, [
    showCameraModal,
    mode,
    capturedPhoto,
    isGalleryLoading,
    pickImageFromGallery,
    toggleCameraModal,
  ]);

  const handleUsePhoto = async () => {
    if (!capturedPhoto) return;

    try {
      setPhotoProcessing(true);

      // Check location preferences and permissions
      let locationInfo: any = {};
      
      try {
        const prefsService = UserPreferencesService.getInstance();
        const locationEnabled = await prefsService.isLocationEnabled();

        if (locationEnabled) {
          const locationService = LocationService.getInstance();

          // Check if we need to ask for permission first time
          const hasAskedBefore = await prefsService.hasAskedLocationPermission();
          if (!hasAskedBefore) {
            const hasPermission = await locationService.checkPermissions();
            if (!hasPermission) {
              // Show permission modal
              setShowLocationPermission(true);
              setPhotoProcessing(false);
              return; // Wait for user response
            }
          }

          // Get location
          try {
            const locationData = await locationService.getCurrentLocation();
            if (locationData && locationData.latitude && locationData.longitude) {
              locationInfo = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                location_accuracy: locationData.accuracy,
                location: locationData.address
                  ? locationService.formatLocationForDisplay(locationData.address)
                  : undefined,
              };
              console.log('Location captured:', locationInfo);
            }
          } catch (locationError) {
            console.warn('Failed to get location:', locationError);
            // Continue without location
          }
        }
      } catch (prefsError) {
        console.error('Failed to check location preferences:', prefsError);
        // Continue without location
      }

      // Create meal record with initial data including location
      const mealId = await createMeal({
        photo_path: capturedPhoto.path,
        photo_size: capturedPhoto.size,
        photo_dimensions: capturedPhoto.dimensions,
        meal_type: 'lunch', // Default, will be updated by AI
        analysis_status: 'pending',
        ...locationInfo,
      });

      console.log('Meal created with ID:', mealId);

      // Convert temporary photo to permanent storage
      const photoService = PhotoService.getInstance();
      const permanentPhoto = await photoService.makePhotoPermanent(capturedPhoto.path, mealId);

      // Update meal record with permanent photo path
      await updateMeal(mealId, {
        photo_path: permanentPhoto.path,
        photo_size: permanentPhoto.size,
        photo_dimensions: permanentPhoto.dimensions,
      });

      console.log('Photo converted to permanent storage:', permanentPhoto.path);

      // Close modal immediately, analysis will happen in background
      handleClose();

      // Start AI analysis in background
      try {
        console.log('Starting Gemini analysis...');
        const geminiService = GeminiService.getInstance();

        // Get current time for meal type context
        const hour = new Date().getHours();
        let mealTypeContext: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';

        if (hour >= 5 && hour < 11) mealTypeContext = 'breakfast';
        else if (hour >= 11 && hour < 16) mealTypeContext = 'lunch';
        else if (hour >= 16 && hour < 22) mealTypeContext = 'dinner';
        else mealTypeContext = 'snack';

        const analysisResult = await geminiService.analyzeFoodImage(permanentPhoto.path, {
          mealType: mealTypeContext,
        });

        console.log('Gemini analysis completed:', analysisResult);

        // Update meal with AI analysis results
        await updateMeal(mealId, {
          // Aggregate nutrition data
          total_calories: analysisResult.meal_analysis.total_calories,
          total_protein: analysisResult.meal_analysis.total_protein,
          total_carbs: analysisResult.meal_analysis.total_carbs,
          total_fat: analysisResult.meal_analysis.total_fat,
          total_fiber: analysisResult.meal_analysis.total_fiber || 0,
          total_sugar: analysisResult.meal_analysis.total_sugar || 0,

          // Health assessment
          health_score: analysisResult.meal_analysis.health_score,
          health_category: analysisResult.meal_analysis.health_category,

          // AI metadata
          analysis_result: JSON.stringify(analysisResult),
          analysis_confidence: analysisResult.meal_analysis.confidence,
          analysis_status: 'completed',
          meal_type: analysisResult.meal_analysis.meal_type_suggestion || mealTypeContext,

          // API metadata
          api_provider: 'gemini',
          processing_time: analysisResult._metadata?.processingTime || 0,
        });

        // Create all food items in a single batch
        const foodItemsToCreate = analysisResult.food_items.map((item) => ({
          meal_id: mealId,
          name: item.name,
          category: item.category,
          portion_size: item.portion_size,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber || 0,
          sugar: item.sugar || 0,
          confidence: item.confidence,
          is_organic: item.is_organic ? 1 : 0,
          is_processed: item.is_processed ? 1 : 0,
          allergens: JSON.stringify(item.allergens || []),
        }));

        await createFoodItemsBatch(foodItemsToCreate);

        console.log('Meal analysis completed and saved to database');
      } catch (analysisError) {
        console.error('AI analysis failed:', analysisError);

        // Update meal status to failed
        await updateMeal(mealId, {
          analysis_status: 'failed',
          analysis_result: JSON.stringify({
            error: analysisError instanceof Error ? analysisError.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }),
        });
      }
    } catch (error) {
      console.error('Failed to save meal:', error);
      // TODO: Show error toast
    } finally {
      setPhotoProcessing(false);
    }
  };

  const renderPermissionRequest = () => (
    <View className="flex-1 items-center justify-center bg-black">
      <View className="items-center space-y-6 px-8">
        <Text className="text-6xl">📷</Text>
        <Text className="text-center text-xl font-semibold text-white">
          Camera Permission Required
        </Text>
        <Text className="text-center text-gray-300">
          Nutriphi needs camera access to take photos of your meals for nutritional analysis.
        </Text>

        {canAskPermission ? (
          <Button title="Grant Permission" onPress={requestPermission} className="px-8" />
        ) : (
          <View className="items-center space-y-4">
            <Text className="text-center text-sm text-gray-300">
              Camera permission was denied. Please enable it in your device settings.
            </Text>
            <Button title="Close" onPress={handleClose} className="px-8" />
          </View>
        )}
      </View>
    </View>
  );

  const renderCamera = () => (
    <View className="flex-1">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        onCameraReady={() => setIsReady(true)}>
        {/* Header */}
        <SafeAreaView className="absolute left-0 right-0 top-0 z-10">
          <View className="flex-row items-center justify-between px-6 py-4">
            <TouchableOpacity
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50">
              <Text className="text-lg text-white">✕</Text>
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-white">Take a Photo</Text>

            <TouchableOpacity
              onPress={toggleCameraFacing}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50">
              <Text className="text-lg text-white">🔄</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0">
          <SafeAreaView className="items-center pb-8">
            <View className="items-center space-y-4">
              <Text className="px-8 text-center text-sm text-white">
                Position your food in the frame and tap the capture button
              </Text>

              <PhotoButton
                onPress={handleTakePicture}
                disabled={!isReady}
                isCapturing={isCapturing}
              />
            </View>
          </SafeAreaView>
        </View>
      </CameraView>
    </View>
  );

  if (!showCameraModal) return null;

  return (
    <>
      <Modal visible={showCameraModal} animationType="slide" presentationStyle="fullScreen">
        <StatusBar barStyle="light-content" backgroundColor="black" />

        {capturedPhoto ? (
          <PhotoPreview uri={capturedPhoto.uri} onRetake={handleRetake} onUse={handleUsePhoto} />
        ) : mode === 'camera' ? (
          hasPermission ? (
            renderCamera()
          ) : (
            renderPermissionRequest()
          )
        ) : (
          // Gallery mode - show loading while picking or error state
          <View className="flex-1 items-center justify-center bg-black">
            {isGalleryLoading ? (
              <LoadingSpinner text="Opening gallery..." color="#ffffff" />
            ) : (
              <View className="items-center space-y-6 px-8">
                <Text className="text-6xl">🖼️</Text>
                <Text className="text-center text-xl font-semibold text-white">Gallery Access</Text>
                <Text className="text-center text-gray-300">
                  Please wait while we access your photo library...
                </Text>
                <Button title="Cancel" onPress={handleClose} className="px-8" />
              </View>
            )}
          </View>
        )}
      </Modal>

      <LocationPermissionModal
        visible={showLocationPermission}
        onAllow={handleLocationPermissionAllow}
        onDeny={handleLocationPermissionDeny}
      />
    </>
  );
};
