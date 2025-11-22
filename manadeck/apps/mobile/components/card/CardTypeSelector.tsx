import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '../ui/Icon';

interface CardType {
  id: 'text' | 'flashcard' | 'quiz' | 'mixed';
  name: string;
  description: string;
  icon: string;
  color: string;
}

const cardTypes: CardType[] = [
  {
    id: 'text',
    name: 'Text',
    description: 'Einfache Textkarte mit Formatierung',
    icon: 'document-text-outline',
    color: 'bg-blue-500',
  },
  {
    id: 'flashcard',
    name: 'Flashcard',
    description: 'Vorder- und Rückseite zum Lernen',
    icon: 'card-outline',
    color: 'bg-green-500',
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Multiple Choice Frage',
    icon: 'help-circle-outline',
    color: 'bg-purple-500',
  },
  {
    id: 'mixed',
    name: 'Mixed',
    description: 'Kombiniert verschiedene Elemente',
    icon: 'grid-outline',
    color: 'bg-orange-500',
  },
];

interface CardTypeSelectorProps {
  selectedType: 'text' | 'flashcard' | 'quiz' | 'mixed';
  onTypeChange: (type: 'text' | 'flashcard' | 'quiz' | 'mixed') => void;
  showDescriptions?: boolean;
  layout?: 'grid' | 'list';
  compact?: boolean;
}

export const CardTypeSelector: React.FC<CardTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  showDescriptions = true,
  layout = 'grid',
  compact = false,
}) => {
  if (compact) {
    return (
      <View className="flex-row items-center space-x-2">
        {cardTypes.map((type) => (
          <Pressable
            key={type.id}
            onPress={() => onTypeChange(type.id)}
            className={`
              flex-row items-center rounded-lg border px-3 py-2
              ${selectedType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
            `}
            style={({ pressed }) => pressed && { opacity: 0.7 }}>
            <View className={`h-4 w-4 ${type.color} mr-2 items-center justify-center rounded`}>
              <Icon name={type.icon} size={10} color="white" library="Ionicons" />
            </View>
            <Text
              className={`text-sm font-medium ${
                selectedType === type.id ? 'text-blue-900' : 'text-gray-700'
              }`}>
              {type.name}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }
  if (layout === 'list') {
    return (
      <View className="space-y-2">
        {cardTypes.map((type) => (
          <Pressable
            key={type.id}
            onPress={() => onTypeChange(type.id)}
            className={`
              flex-row items-center rounded-lg border-2 p-3
              ${
                selectedType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }
            `}
            style={({ pressed }) => pressed && { opacity: 0.7 }}>
            <View className={`h-10 w-10 ${type.color} mr-3 items-center justify-center rounded-lg`}>
              <Icon name={type.icon} size={20} color="white" library="Ionicons" />
            </View>
            <View className="flex-1">
              <Text
                className={`text-base font-medium ${
                  selectedType === type.id ? 'text-blue-900' : 'text-gray-900'
                }`}>
                {type.name}
              </Text>
              {showDescriptions && (
                <Text
                  className={`text-sm ${
                    selectedType === type.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                  {type.description}
                </Text>
              )}
            </View>
            {selectedType === type.id && (
              <Icon name="checkmark-circle" size={24} color="#3B82F6" library="Ionicons" />
            )}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View className="-mx-2 flex-row flex-wrap">
      {cardTypes.map((type) => (
        <View key={type.id} className="mb-4 w-1/2 px-2">
          <Pressable
            onPress={() => onTypeChange(type.id)}
            className={`
              items-center rounded-xl border-2 p-4
              ${
                selectedType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }
            `}
            style={({ pressed }) => pressed && { opacity: 0.7 }}>
            <View className={`h-12 w-12 ${type.color} mb-2 items-center justify-center rounded-lg`}>
              <Icon name={type.icon} size={24} color="white" library="Ionicons" />
            </View>
            <Text
              className={`text-center text-base font-medium ${
                selectedType === type.id ? 'text-blue-900' : 'text-gray-900'
              }`}>
              {type.name}
            </Text>
            {showDescriptions && (
              <Text
                className={`mt-1 text-center text-xs ${
                  selectedType === type.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                {type.description}
              </Text>
            )}
            {selectedType === type.id && (
              <View className="absolute right-2 top-2">
                <Icon name="checkmark-circle" size={20} color="#3B82F6" library="Ionicons" />
              </View>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
};
