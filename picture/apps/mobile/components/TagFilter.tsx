import { View, ScrollView } from 'react-native';
import { useTheme } from '~/contexts/ThemeContext';
import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { Tag } from '~/store/tagStore';

type TagFilterProps = {
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClearFilters: () => void;
  showLabel?: boolean;
};

export function TagFilter({
  tags,
  selectedTags,
  onToggleTag,
  onClearFilters,
  showLabel = true,
}: TagFilterProps) {
  const { theme } = useTheme();

  if (tags.length === 0) return null;

  return (
    <View style={{ backgroundColor: theme.colors.surface, padding: 8 }}>
      {showLabel && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text variant="bodySmall" color="secondary">
            {selectedTags.length > 0 ? 'Tags:' : 'Nach Tags filtern:'}
          </Text>
          {selectedTags.length > 0 && (
            <Button
              title="Zurücksetzen"
              size="sm"
              variant="secondary"
              onPress={onClearFilters}
            />
          )}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row' }}>
          {tags.map(tag => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <Button
                key={tag.id}
                variant="ghost"
                size="sm"
                onPress={() => onToggleTag(tag.id)}
                className="mr-2 rounded-full border"
                style={{
                  backgroundColor: isSelected ? `${tag.color}30` : 'transparent',
                  borderColor: isSelected ? tag.color : theme.colors.border,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? tag.color : theme.colors.text.secondary,
                    fontSize: 14,
                  }}
                >
                  #{tag.name}
                </Text>
              </Button>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
