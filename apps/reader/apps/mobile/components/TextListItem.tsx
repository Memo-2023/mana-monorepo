import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ActionMenu } from '~/components/ActionMenu';
import { MinimalAudioPlayer } from '~/components/MinimalAudioPlayer';
import { Text as TextType } from '~/types/database';
import { useTheme } from '~/hooks/useTheme';

interface TextListItemProps {
  item: TextType;
  onShare: (text: TextType) => void;
  onDelete: (textId: string, title: string) => void;
  formatDate: (dateString: string) => string;
  getAudioDuration: (item: TextType) => string | null;
}

export const TextListItem: React.FC<TextListItemProps> = ({
  item,
  onShare,
  onDelete,
  formatDate,
  getAudioDuration,
}) => {
  const { colors } = useTheme();

  const handleMenuSelect = (index: number) => {
    switch (index) {
      case 0: // Öffnen
        router.push(`/text/${item.id}`);
        break;
      case 1: // Teilen
        onShare(item);
        break;
      case 2: // Tags bearbeiten
        router.push(`/text/${item.id}`);
        break;
      case 3: // Löschen
        onDelete(item.id, item.title);
        break;
    }
  };

  return (
    <ActionMenu
      options={[
        { title: 'Öffnen', systemIcon: 'doc.text' },
        { title: 'Teilen', systemIcon: 'square.and.arrow.up' },
        { title: 'Tags bearbeiten', systemIcon: 'tag' },
        { title: 'Löschen', systemIcon: 'trash', destructive: true },
      ]}
      onSelect={handleMenuSelect}>
      <Pressable
        onPress={() => router.push(`/text/${item.id}`)}
        className={`mb-3 rounded-lg border ${colors.border} ${colors.surface} p-4 shadow-sm`}>
        {/* Header with title and date/duration */}
        <View className="mb-2 flex-row items-start justify-between">
          <Text className={`mr-2 flex-1 text-lg font-semibold ${colors.text}`} numberOfLines={1}>
            {item.title}
          </Text>
          <View className="flex-row items-center">
            <Text className={`text-sm ${colors.textTertiary}`}>{formatDate(item.updated_at)}</Text>
            {getAudioDuration(item) && (
              <>
                <Text className={`mx-1 text-sm ${colors.textTertiary}`}>•</Text>
                <Text className={`text-sm ${colors.textTertiary}`}>{getAudioDuration(item)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Content preview */}
        <Text className={`mb-3 ${colors.textSecondary}`} numberOfLines={2}>
          {item.content}
        </Text>

        {/* Footer with tags and audio player */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {item.data.tags?.map((tag, index) => (
              <View key={index} className={`mr-2 rounded-full ${colors.primaryLight} px-2 py-1`}>
                <Text className="text-xs text-blue-800">{tag}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center">
            <MinimalAudioPlayer text={item} />
          </View>
        </View>
      </Pressable>
    </ActionMenu>
  );
};
