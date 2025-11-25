import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTagStore, Tag } from '~/store/tagStore';
import { useTheme } from '~/contexts/ThemeContext';

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  selectedTags,
  onTagsChange,
  placeholder = "Add tags...",
  maxTags = 10
}: TagInputProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTagColor, setNewTagColor] = useState(theme.colors.primary.default);

  const { tags, fetchTags, createTag, getTagByName } = useTagStore();
  const inputRef = useRef<TextInput>(null);

  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#71717A', '#000000'
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (inputValue.trim()) {
      const searchTerm = inputValue.toLowerCase().trim();
      const filtered = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm) &&
        !selectedTags.some(st => st.id === tag.id)
      );
      setFilteredTags(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setFilteredTags([]);
    }
  }, [inputValue, tags, selectedTags]);

  const handleAddTag = async (tag?: Tag) => {
    if (selectedTags.length >= maxTags) {
      return;
    }

    if (tag) {
      onTagsChange([...selectedTags, tag]);
      setInputValue('');
      setShowSuggestions(false);
    } else if (inputValue.trim()) {
      const tagName = inputValue.trim().toLowerCase();
      const existingTag = getTagByName(tagName);
      
      if (existingTag) {
        if (!selectedTags.some(t => t.id === existingTag.id)) {
          onTagsChange([...selectedTags, existingTag]);
        }
      } else {
        setShowColorPicker(true);
      }
    }
  };

  const createNewTag = async () => {
    const tagName = inputValue.trim().toLowerCase();
    const newTag = await createTag(tagName, newTagColor);
    
    if (newTag) {
      onTagsChange([...selectedTags, newTag]);
      setInputValue('');
      setShowColorPicker(false);
      setNewTagColor(theme.colors.primary.default);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <View className="w-full">
      <View
        className="flex-row flex-wrap items-center rounded-lg p-2"
        style={{ backgroundColor: theme.colors.input }}
      >
        {selectedTags.map(tag => (
          <View
            key={tag.id}
            className="flex-row items-center rounded-full px-3 py-1 mr-2 mb-2"
            style={{
              backgroundColor: tag.color ? `${tag.color}20` : theme.colors.surface,
              borderColor: tag.color || theme.colors.border,
              borderWidth: 1
            }}
          >
            <Text style={{ color: tag.color || theme.colors.text.secondary }}>
              #{tag.name}
            </Text>
            <Pressable
              onPress={() => handleRemoveTag(tag.id)}
              className="ml-2"
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={tag.color || theme.colors.text.tertiary}
              />
            </Pressable>
          </View>
        ))}

        {selectedTags.length < maxTags && (
          <TextInput
            ref={inputRef}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={() => handleAddTag()}
            placeholder={selectedTags.length === 0 ? placeholder : "Add more..."}
            placeholderTextColor={theme.colors.text.tertiary}
            className="flex-1 min-w-[100px] py-1"
            style={{ color: theme.colors.text.primary }}
          />
        )}
      </View>

      {showSuggestions && (
        <View
          className="mt-2 rounded-lg shadow-lg max-h-40"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <ScrollView>
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => (
                <Pressable
                  key={tag.id}
                  onPress={() => handleAddTag(tag)}
                  className="flex-row items-center px-3 py-2"
                  style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
                >
                  <View
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: tag.color || theme.colors.text.tertiary }}
                  />
                  <Text style={{ color: theme.colors.text.primary }}>
                    #{tag.name}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Pressable
                onPress={() => handleAddTag()}
                className="px-3 py-2"
              >
                <Text style={{ color: theme.colors.primary.default }}>
                  Create new tag &quot;#{inputValue.trim().toLowerCase()}&quot;
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}

      {selectedTags.length > 0 && (
        <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.text.tertiary }}>
          {selectedTags.length}/{maxTags} tags selected
        </Text>
      )}

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <View className="bg-black/50 flex-1" />
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 16 }}>
              Choose a color for &quot;#{inputValue.trim().toLowerCase()}&quot;
            </Text>

            <View className="flex-row flex-wrap mb-6">
              {predefinedColors.map(color => (
                <Pressable
                  key={color}
                  onPress={() => setNewTagColor(color)}
                  className="w-12 h-12 rounded-full m-1 items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  {newTagColor === color && (
                    <Ionicons name="checkmark" size={24} color="white" />
                  )}
                </Pressable>
              ))}
            </View>

            <View className="flex-row justify-between">
              <Pressable
                onPress={() => {
                  setShowColorPicker(false);
                  setInputValue('');
                }}
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: theme.colors.input }}
              >
                <Text style={{ color: theme.colors.text.primary }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={createNewTag}
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: theme.colors.primary.default }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Create Tag</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}