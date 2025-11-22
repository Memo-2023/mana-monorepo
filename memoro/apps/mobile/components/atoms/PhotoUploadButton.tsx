import React from 'react';
import { ImagePickerAsset } from 'expo-image-picker';
import Button from './Button';
import { useTranslation } from 'react-i18next';
import { photoStorageService } from '~/features/storage/photoStorage.service';

interface PhotoUploadButtonProps {
  onPhotosSelected: (photos: ImagePickerAsset[]) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  title?: string;
  iconName?: string;
  style?: any;
  allowsMultipleSelection?: boolean;
}

export default function PhotoUploadButton({
  onPhotosSelected,
  loading = false,
  disabled = false,
  variant = 'secondary',
  title,
  iconName = 'image-outline',
  style,
  allowsMultipleSelection = true,
}: PhotoUploadButtonProps) {
  const { t } = useTranslation();

  const handlePress = async () => {
    try {
      const photos = await photoStorageService.selectPhotos({
        allowsMultipleSelection,
        quality: 0.8,
      });

      if (photos.length > 0) {
        onPhotosSelected(photos);
      }
    } catch (error) {
      console.debug('Error selecting photos:', error);
      // You might want to show an error toast here
    }
  };

  return (
    <Button
      variant={variant}
      title={title || t('memo.add_photos_button', 'Add Photos')}
      iconName={iconName}
      onPress={handlePress}
      loading={loading}
      disabled={disabled || loading}
      style={style}
    />
  );
}