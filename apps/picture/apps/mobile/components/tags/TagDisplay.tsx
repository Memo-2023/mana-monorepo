import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Tag } from '~/store/tagStore';

interface TagDisplayProps {
  tags: Tag[];
  onTagPress?: (tag: Tag) => void;
  scrollable?: boolean;
  size?: 'small' | 'medium' | 'large';
  showColors?: boolean;
}

export function TagDisplay({ 
  tags, 
  onTagPress,
  scrollable = true,
  size = 'medium',
  showColors = true 
}: TagDisplayProps) {
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const TagChip = ({ tag }: { tag: Tag }) => (
    <Pressable
      onPress={() => onTagPress?.(tag)}
      disabled={!onTagPress}
      className={`rounded-full mr-2 mb-2 ${sizeClasses[size]} ${
        showColors ? 'border' : 'bg-gray-100 dark:bg-gray-800'
      }`}
      style={showColors && tag.color ? {
        backgroundColor: `${tag.color}20`,
        borderColor: tag.color,
        borderWidth: 1
      } : undefined}
    >
      <Text 
        className={showColors && tag.color ? '' : 'text-gray-700 dark:text-gray-300'}
        style={showColors && tag.color ? { color: tag.color } : undefined}
      >
        #{tag.name}
      </Text>
    </Pressable>
  );

  if (tags.length === 0) {
    return null;
  }

  const content = (
    <View className="flex-row flex-wrap">
      {tags.map(tag => (
        <TagChip key={tag.id} tag={tag} />
      ))}
    </View>
  );

  if (scrollable && tags.length > 3) {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0"
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}