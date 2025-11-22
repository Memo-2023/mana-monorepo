import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '~/components/ui/Text';
import { Card } from '~/components/ui/Card';
import { Icon } from '~/components/ui/Icon';
import { useThemeColors } from '~/utils/themeUtils';
import { PageHeader } from '~/components/ui/PageHeader';
import { spacing } from '~/utils/spacing';

export default function ExploreScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const colors = useThemeColors(); // This triggers theme reactivity

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const categories = [
    { name: 'Sprachen', icon: 'language-outline', color: colors.primary },
    { name: 'Wissenschaft', icon: 'flask-outline', color: colors.secondary },
    { name: 'Mathematik', icon: 'calculator-outline', color: colors.accent },
    { name: 'Geschichte', icon: 'time-outline', color: colors.primary },
    { name: 'Kunst', icon: 'color-palette-outline', color: colors.secondary },
    { name: 'Technologie', icon: 'hardware-chip-outline', color: colors.accent },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <PageHeader title="Entdecken" />

          {/* Content Wrapper */}
          <View style={{ paddingHorizontal: spacing.container.horizontal, paddingTop: spacing.container.top }}>
            {/* Kategorien Card */}
            <Card padding="lg" variant="elevated" style={{ marginBottom: spacing.section }}>
              <Text style={{ marginBottom: spacing.content.title, fontSize: 18, fontWeight: '600', color: colors.foreground }}>Kategorien</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {categories.map((category, index) => (
                  <View key={index} style={{ width: '33.333%', paddingHorizontal: 4, marginBottom: 8 }}>
                    <Card
                      padding="none"
                      variant="elevated"
                      onPress={() => {}}
                      style={{
                        aspectRatio: 1,
                        padding: 12,
                      }}>
                      <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <View
                          style={{
                            height: 40,
                            width: 40,
                            backgroundColor: category.color,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 20,
                            marginBottom: 8
                          }}>
                          <Icon name={category.icon} size={20} color="white" library="Ionicons" />
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: '500',
                            color: colors.foreground,
                            width: '100%'
                          }}>
                          {category.name}
                        </Text>
                      </View>
                    </Card>
                  </View>
                ))}
              </View>
            </Card>

            {/* Beliebte Decks Card */}
            <Card padding="lg" variant="elevated" style={{ marginBottom: spacing.section }}>
              <Text style={{ marginBottom: spacing.content.title, fontSize: 18, fontWeight: '600', color: colors.foreground }}>Beliebte Decks</Text>
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Icon name="compass-outline" size={48} color={colors.mutedForeground} library="Ionicons" />
                <Text style={{ marginTop: 8, color: colors.mutedForeground }}>Noch keine öffentlichen Decks</Text>
                <Text style={{ marginTop: 4, fontSize: 14, color: colors.mutedForeground }}>
                  Sei der Erste, der ein Deck teilt!
                </Text>
              </View>
            </Card>
          </View>
      </ScrollView>
    </View>
  );
}
