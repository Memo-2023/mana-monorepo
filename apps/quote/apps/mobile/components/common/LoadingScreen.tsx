import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import Text from '../Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  fullScreen = true,
}) => {
  const { t } = useTranslation();
  const Container = fullScreen ? SafeAreaView : View;
  const displayMessage = message || t('common.loading');
  
  return (
    <Container className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text variant="body" color="tertiary" className="mt-4">{displayMessage}</Text>
      </View>
    </Container>
  );
};