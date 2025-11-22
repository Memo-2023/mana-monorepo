import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, FlatList, Platform, Pressable } from 'react-native';
import { Text } from '~/components/ui/Text';
import { Icon } from '~/components/ui/Icon';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { FilterBar, FilterOption } from '~/components/ui/FilterBar';
import { FloatingActionButton } from '~/components/ui/FloatingActionButton';
import { router } from 'expo-router';
import { useDeckStore } from '~/store/deckStore';
import { DeckCard } from '~/components/deck/DeckCard';
import { useThemeColors } from '~/utils/themeUtils';
import { PageHeader } from '~/components/ui/PageHeader';
import { spacing } from '~/utils/spacing';

// Conditional imports for Expo UI
let Host: any = null, Picker: any = null;
if (Platform.OS === 'ios') {
  try {
    const SwiftUI = require('@expo/ui/swift-ui');
    Host = SwiftUI?.Host;
    Picker = SwiftUI?.Picker;
    // Verify the components are actually available and have the expected shape
    if (!Host || !Picker || !Picker.Item) {
      Host = null;
      Picker = null;
    }
  } catch (e) {
    // Fallback if @expo/ui is not available
  }
} else if (Platform.OS === 'android') {
  try {
    const JetpackCompose = require('@expo/ui/jetpack-compose');
    Host = JetpackCompose?.Host;
    Picker = JetpackCompose?.Picker;
    // Verify the components are actually available and have the expected shape
    if (!Host || !Picker || !Picker.Item) {
      Host = null;
      Picker = null;
    }
  } catch (e) {
    // Fallback if @expo/ui is not available
  }
}

export default function DecksScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const colors = useThemeColors();

  const { decks, fetchDecks, isLoading } = useDeckStore();

  useEffect(() => {
    fetchDecks();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  }, [fetchDecks]);

  const filteredDecks = React.useMemo(() => {
    if (filter === 'favorites') {
      return decks.filter((deck) => deck.metadata?.is_favorite);
    }
    return decks;
  }, [decks, filter]);

  const favoritesCount = React.useMemo(
    () => decks.filter((deck) => deck.metadata?.is_favorite).length,
    [decks]
  );

  const filterOptions: FilterOption[] = [
    { id: 'all', label: 'Alle', count: decks.length },
    { id: 'favorites', label: 'Favoriten', icon: 'heart', count: favoritesCount },
  ];

  // Native iOS SwiftUI Picker component
  const NativeIOSPicker = () => {
    if (Host && Picker && Picker.Item) {
      try {
        return (
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'transparent',
          }}>
            <Host style={{ height: 36 }} matchContents>
              <Picker
                variant="segmented"
                value={filter}
                onValueChange={(value: string) => setFilter(value)}
              >
                <Picker.Item value="all">{`Alle (${decks.length})`}</Picker.Item>
                <Picker.Item value="favorites">{`Favoriten (${favoritesCount})`}</Picker.Item>
              </Picker>
            </Host>
          </View>
        );
      } catch (error) {
        return <IOSSegmentedControl />;
      }
    }
    // Fallback to custom component if Expo UI is not available
    return <IOSSegmentedControl />;
  };

  // Native Android Jetpack Compose component
  const NativeAndroidPicker = () => {
    if (Host && Picker && Picker.Item) {
      try {
        return (
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'transparent',
          }}>
            <Host style={{ height: 48 }}>
              <Picker
                variant="chips"
                value={filter}
                onValueChange={(value: string) => setFilter(value)}
                multiple={false}
              >
                <Picker.Item value="all">{`Alle (${decks.length})`}</Picker.Item>
                <Picker.Item value="favorites">{`Favoriten (${favoritesCount})`}</Picker.Item>
              </Picker>
            </Host>
          </View>
        );
      } catch (error) {
        return <FilterBar options={filterOptions} activeFilter={filter} onFilterChange={setFilter} />;
      }
    }
    // Fallback to FilterBar for Android if Expo UI is not available
    return <FilterBar options={filterOptions} activeFilter={filter} onFilterChange={setFilter} />;
  };

  // Custom iOS-style segmented control as fallback
  const IOSSegmentedControl = () => (
    <View style={{
      alignItems: 'center',
      paddingVertical: 12,
    }}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.muted,
        borderRadius: 9,
        padding: 2,
        height: 32,
        minWidth: 280,
        maxWidth: 360,
      }}>
        <Pressable
          onPress={() => setFilter('all')}
          style={{
            flex: 1,
            backgroundColor: filter === 'all' ? colors.background : 'transparent',
            borderRadius: 7,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: filter === 'all' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: filter === 'all' ? 0.15 : 0,
            shadowRadius: 2,
            elevation: filter === 'all' ? 2 : 0,
          }}>
          <Text style={{ 
            fontSize: 13, 
            fontWeight: '600',
            color: filter === 'all' ? colors.foreground : colors.mutedForeground 
          }}>
            Alle {decks.length > 0 ? `(${decks.length})` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('favorites')}
          style={{
            flex: 1,
            backgroundColor: filter === 'favorites' ? colors.background : 'transparent',
            borderRadius: 7,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: filter === 'favorites' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: filter === 'favorites' ? 0.15 : 0,
            shadowRadius: 2,
            elevation: filter === 'favorites' ? 2 : 0,
          }}>
          <Text style={{ 
            fontSize: 13, 
            fontWeight: '600',
            color: filter === 'favorites' ? colors.foreground : colors.mutedForeground 
          }}>
            Favoriten {favoritesCount > 0 ? `(${favoritesCount})` : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
        {filteredDecks.length === 0 ? (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />
            }>
            <PageHeader title="Meine Decks" />
            <View style={{ paddingHorizontal: spacing.container.horizontal, paddingTop: spacing.container.top }}>
              <Card padding="lg" variant="elevated">
                <View style={{ alignItems: 'center', paddingVertical: spacing.content.title }}>
                  <View
                    style={{
                      marginBottom: spacing.content.title,
                      height: 96,
                      width: 96,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 48,
                      backgroundColor: colors.muted,
                    }}>
                    <Icon name="albums-outline" size={48} color={colors.mutedForeground} library="Ionicons" />
                  </View>
                  <Text
                    style={{
                      marginBottom: spacing.content.small,
                      fontSize: 20,
                      fontWeight: '600',
                      color: colors.foreground,
                    }}>
                    {filter === 'favorites' ? 'Keine Favoriten' : 'Keine Decks vorhanden'}
                  </Text>
                  <Text
                    style={{
                      marginBottom: spacing.content.title,
                      paddingHorizontal: spacing.lg,
                      textAlign: 'center',
                      color: colors.mutedForeground,
                    }}>
                    {filter === 'favorites'
                      ? 'Markiere Decks als Favoriten, um sie hier zu sehen'
                      : 'Erstelle dein erstes Deck oder entdecke öffentliche Decks von anderen Nutzern'}
                  </Text>
                  {filter === 'all' && (
                    <View style={{ gap: spacing.content.small, width: '100%', maxWidth: 300 }}>
                      <Button
                        onPress={() => router.push('/deck/create')}
                        variant="primary"
                        leftIcon={
                          <Icon
                            name="add-circle-outline"
                            size={20}
                            color="white"
                            library="Ionicons"
                          />
                        }>
                        Deck erstellen
                      </Button>
                      <Button
                        onPress={() => router.push('/(tabs)/explore')}
                        variant="outline"
                        leftIcon={
                          <Icon
                            name="compass-outline"
                            size={20}
                            color="currentColor"
                            library="Ionicons"
                          />
                        }>
                        Decks entdecken
                      </Button>
                    </View>
                  )}
                </View>
              </Card>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ListHeaderComponent={
              <>
                <PageHeader title="Meine Decks" withHorizontalPadding={false} />
                <View style={{ height: spacing.container.top }} />
              </>
            }
            data={filteredDecks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DeckCard
                deck={item}
                onPress={() => router.push(`/deck/${item.id}`)}
                showProgress={true}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing.container.horizontal,
              paddingBottom: spacing.lg,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          />
          )}

        {/* Floating Action Button */}
        <View style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 100 : 80,
          right: 20,
          zIndex: 1000,
        }}>
          <FloatingActionButton
            icon={filter === 'all' ? 'heart' : 'albums'}
            onPress={() => setFilter(filter === 'all' ? 'favorites' : 'all')}
          />
        </View>
    </View>
  );
}
