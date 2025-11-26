import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../Button';

interface PhotoPreviewProps {
  uri: string;
  onRetake: () => void;
  onUse: () => void;
  isProcessing?: boolean;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  uri,
  onRetake,
  onUse,
  isProcessing = false,
}) => {
  return (
    <View className="flex-1 bg-black">
      {/* Photo */}
      <View className="flex-1 justify-center">
        <Image source={{ uri }} className="h-full w-full" resizeMode="contain" />
      </View>

      {/* Controls */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-6">
        <Card className="bg-white/90 backdrop-blur">
          <View className="space-y-4">
            <Text className="text-center text-lg font-semibold text-gray-900">
              How does this look?
            </Text>

            <Text className="text-center text-sm text-gray-600">
              Make sure your food is clearly visible and well-lit for the best analysis results.
            </Text>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={onRetake}
                disabled={isProcessing}
                className={`
                  flex-1 items-center rounded-lg border-2 px-4 py-3
                  ${isProcessing ? 'border-gray-300 bg-gray-100' : 'border-gray-300 bg-white'}
                `}>
                <Text className={`font-medium ${isProcessing ? 'text-gray-400' : 'text-gray-700'}`}>
                  Retake
                </Text>
              </TouchableOpacity>

              <Button
                title={isProcessing ? 'Analyzing...' : 'Use Photo'}
                onPress={onUse}
                disabled={isProcessing}
                className="flex-1"
              />
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};
