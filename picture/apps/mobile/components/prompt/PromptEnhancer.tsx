import { View, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Text';
import { useTheme } from '~/contexts/ThemeContext';

type PromptEnhancerProps = {
  prompt: string;
  onEnhancedPrompt: (enhanced: string) => void;
};

// Simple rule-based prompt enhancement
function enhancePrompt(prompt: string): string {
  if (!prompt.trim()) return prompt;

  let enhanced = prompt.trim();

  // Add quality keywords if not present
  const qualityKeywords = ['high quality', '8k', '4k', 'detailed', 'masterpiece'];
  const hasQuality = qualityKeywords.some(keyword =>
    enhanced.toLowerCase().includes(keyword)
  );

  if (!hasQuality) {
    enhanced += ', highly detailed, high quality';
  }

  // Add technical details if it seems like a photo
  const photoKeywords = ['photo', 'photograph', 'portrait', 'picture'];
  const isPhoto = photoKeywords.some(keyword =>
    enhanced.toLowerCase().includes(keyword)
  );

  if (isPhoto && !enhanced.toLowerCase().includes('sharp focus')) {
    enhanced += ', sharp focus';
  }

  if (isPhoto && !enhanced.toLowerCase().includes('lighting')) {
    enhanced += ', professional lighting';
  }

  // Add artistic terms if it's art-related
  const artKeywords = ['painting', 'art', 'drawing', 'illustration'];
  const isArt = artKeywords.some(keyword =>
    enhanced.toLowerCase().includes(keyword)
  );

  if (isArt && !enhanced.toLowerCase().includes('style')) {
    enhanced += ', artistic style';
  }

  // Ensure proper capitalization
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

  // Remove duplicate commas and spaces
  enhanced = enhanced.replace(/,+/g, ',').replace(/\s+/g, ' ').trim();

  return enhanced;
}

export function PromptEnhancer({ prompt, onEnhancedPrompt }: PromptEnhancerProps) {
  const { theme } = useTheme();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState('');

  const handleEnhance = async () => {
    if (!prompt.trim()) return;

    setIsEnhancing(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const enhanced = enhancePrompt(prompt);
    setEnhancedPreview(enhanced);
    setShowPreview(true);
    setIsEnhancing(false);
  };

  const handleApply = () => {
    onEnhancedPrompt(enhancedPreview);
    setShowPreview(false);
  };

  const handleCancel = () => {
    setShowPreview(false);
    setEnhancedPreview('');
  };

  return (
    <View>
      {!showPreview ? (
        <Pressable
          onPress={handleEnhance}
          disabled={!prompt.trim() || isEnhancing}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: !prompt.trim() || isEnhancing ? 0.5 : 1,
          }}
        >
          {isEnhancing ? (
            <ActivityIndicator size="small" color={theme.colors.primary.default} />
          ) : (
            <Ionicons name="sparkles" size={18} color={theme.colors.primary.default} />
          )}
          <Text
            variant="body"
            weight="semibold"
            color="primary"
            style={{ marginLeft: 8 }}
          >
            {isEnhancing ? 'Verbessere Prompt...' : 'Prompt verbessern ✨'}
          </Text>
        </Pressable>
      ) : (
        <View
          style={{
            padding: 16,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.colors.primary.default,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sparkles" size={20} color={theme.colors.primary.default} />
            <Text variant="body" weight="semibold" color="primary" style={{ marginLeft: 8 }}>
              Verbesserter Prompt
            </Text>
          </View>

          <View
            style={{
              padding: 12,
              backgroundColor: theme.colors.background,
              borderRadius: 8,
            }}
          >
            <Text variant="body" color="primary">
              {enhancedPreview}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={handleApply}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: theme.colors.primary.default,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text variant="body" weight="semibold" style={{ color: '#fff' }}>
                Übernehmen
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCancel}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: theme.colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
              }}
            >
              <Text variant="body" weight="semibold" color="secondary">
                Abbrechen
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
