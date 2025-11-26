import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AnalysisStatusIndicatorProps {
  status: 'pending' | 'completed' | 'failed' | 'manual';
  mini?: boolean;
}

export const AnalysisStatusIndicator: React.FC<AnalysisStatusIndicatorProps> = ({
  status,
  mini = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: null,
          text: 'Wird analysiert...',
          showSpinner: true,
        };
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: 'checkmark-circle' as const,
          text: 'Analysiert',
          showSpinner: false,
        };
      case 'failed':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: 'alert-circle' as const,
          text: 'Analyse fehlgeschlagen',
          showSpinner: false,
        };
      case 'manual':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: 'create-outline' as const,
          text: 'Manuell',
          showSpinner: false,
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: 'help-circle-outline' as const,
          text: 'Unbekannt',
          showSpinner: false,
        };
    }
  };

  const config = getStatusConfig();

  if (mini) {
    return (
      <View className={`rounded-full px-2 py-1 ${config.bgColor}`}>
        <View className="flex-row items-center">
          {config.showSpinner ? (
            <LoadingSpinner size={12} color="#ca8a04" />
          ) : (
            config.icon && <Ionicons name={config.icon} size={12} color="#ca8a04" />
          )}
          <Text className={`ml-1 text-xs font-medium ${config.textColor}`}>{config.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`rounded-lg p-3 ${config.bgColor}`}>
      <View className="flex-row items-center">
        {config.showSpinner ? (
          <LoadingSpinner size={20} color="#ca8a04" />
        ) : (
          config.icon && (
            <Ionicons
              name={config.icon}
              size={20}
              color={
                config.textColor === 'text-green-800'
                  ? '#166534'
                  : config.textColor === 'text-red-800'
                    ? '#991b1b'
                    : config.textColor === 'text-yellow-800'
                      ? '#854d0e'
                      : '#1f2937'
              }
            />
          )
        )}
        <Text className={`ml-2 text-sm font-medium ${config.textColor}`}>{config.text}</Text>
      </View>
    </View>
  );
};
