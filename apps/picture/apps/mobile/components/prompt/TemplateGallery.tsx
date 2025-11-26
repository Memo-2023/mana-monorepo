import { View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Text } from '../Text';
import { useTheme } from '~/contexts/ThemeContext';
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORY_LABELS, PromptTemplate } from '~/constants/promptTemplates';

type TemplateGalleryProps = {
  onSelectTemplate: (template: PromptTemplate) => void;
};

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<PromptTemplate['category'] | 'all'>('all');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === 'all'
    ? PROMPT_TEMPLATES
    : PROMPT_TEMPLATES.filter(t => t.category === selectedCategory);

  const categories: Array<PromptTemplate['category'] | 'all'> = ['all', 'portrait', 'landscape', 'product', 'abstract', 'architecture', 'food'];

  return (
    <View>
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 16 }}
      >
        {categories.map(category => {
          const isSelected = selectedCategory === category;
          const label = category === 'all' ? 'Alle' : TEMPLATE_CATEGORY_LABELS[category];

          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isSelected ? theme.colors.primary.default : theme.colors.surface,
                borderWidth: 1,
                borderColor: isSelected ? theme.colors.primary.default : theme.colors.border,
              }}
            >
              <Text
                variant="bodySmall"
                weight={isSelected ? 'semibold' : 'medium'}
                style={{ color: isSelected ? '#fff' : theme.colors.text.primary }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Templates Grid */}
      <View style={{ gap: 12 }}>
        {filteredTemplates.map(template => {
          const isExpanded = expandedTemplate === template.id;

          return (
            <Pressable
              key={template.id}
              onPress={() => setExpandedTemplate(isExpanded ? null : template.id)}
              style={{
                padding: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>{template.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="body" weight="semibold" color="primary">
                    {template.name}
                  </Text>
                  <Text variant="bodySmall" color="tertiary">
                    {TEMPLATE_CATEGORY_LABELS[template.category]}
                  </Text>
                </View>
              </View>

              {isExpanded && (
                <View style={{ marginTop: 12, gap: 12 }}>
                  {/* Example */}
                  <View>
                    <Text variant="bodySmall" color="secondary" style={{ marginBottom: 4 }}>
                      Beispiel:
                    </Text>
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: theme.colors.input,
                        borderRadius: 8,
                      }}
                    >
                      <Text variant="bodySmall" color="primary" style={{ fontStyle: 'italic' }}>
                        {template.example}
                      </Text>
                    </View>
                  </View>

                  {/* Keywords */}
                  <View>
                    <Text variant="bodySmall" color="secondary" style={{ marginBottom: 4 }}>
                      Keywords:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {template.keywords.map(keyword => (
                        <View
                          key={keyword}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            backgroundColor: theme.colors.background,
                            borderRadius: 12,
                          }}
                        >
                          <Text variant="bodySmall" color="tertiary">
                            {keyword}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Use Button */}
                  <Pressable
                    onPress={() => onSelectTemplate(template)}
                    style={{
                      padding: 12,
                      backgroundColor: theme.colors.primary.default,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="body" weight="semibold" style={{ color: '#fff' }}>
                      Vorlage verwenden
                    </Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
