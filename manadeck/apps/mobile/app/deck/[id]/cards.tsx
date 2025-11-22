import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';

import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCardStore, Card } from '../../../store/cardStore';
import { useDeckStore } from '../../../store/deckStore';
import { Button } from '../../../components/ui/Button';
import { Card as UICard } from '../../../components/ui/Card';
import { CardView } from '../../../components/card/CardView';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColors } from '~/utils/themeUtils';

type SortMode = 'position' | 'newest' | 'oldest' | 'alphabetical' | 'type';
type FilterType = 'all' | 'text' | 'flashcard' | 'quiz' | 'mixed' | 'favorites';

export default function CardManagementScreen() {
  const colors = useThemeColors();
  const { id: deckId } = useLocalSearchParams<{ id: string }>();
  const {
    cards,
    fetchCards,
    deleteCard,
    deleteMultipleCards,
    reorderCards,
    toggleFavorite,
    isLoading,
  } = useCardStore();
  const { currentDeck, fetchDeck } = useDeckStore();

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('position');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (deckId) {
      fetchCards(deckId);
      if (!currentDeck) {
        fetchDeck(deckId);
      }
    }
  }, [deckId]);

  const getFilteredAndSortedCards = () => {
    let filtered = [...cards];

    // Apply filter
    switch (filterType) {
      case 'favorites':
        filtered = filtered.filter((card) => card.is_favorite);
        break;
      case 'text':
      case 'flashcard':
      case 'quiz':
      case 'mixed':
        filtered = filtered.filter((card) => card.card_type === filterType);
        break;
    }

    // Apply sort
    switch (sortMode) {
      case 'newest':
        filtered.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'alphabetical':
        filtered.sort((a, b) => {
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleA.localeCompare(titleB);
        });
        break;
      case 'type':
        filtered.sort((a, b) => a.card_type.localeCompare(b.card_type));
        break;
      case 'position':
      default:
        filtered.sort((a, b) => a.position - b.position);
        break;
    }

    return filtered;
  };

  const displayCards = getFilteredAndSortedCards();

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
  };

  const selectAll = () => {
    setSelectedCards(new Set(displayCards.map((card) => card.id)));
  };

  const deselectAll = () => {
    setSelectedCards(new Set());
    setIsSelectionMode(false);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      `${selectedCards.size} Karten löschen`,
      'Möchtest du die ausgewählten Karten wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await deleteMultipleCards(Array.from(selectedCards));
            setSelectedCards(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleDragEnd = async ({ data }: { data: Card[] }) => {
    if (!deckId) return;
    const cardIds = data.map((card) => card.id);
    await reorderCards(deckId, cardIds);
  };

  const renderCard = ({ item, drag, isActive }: RenderItemParams<Card>) => {
    const isSelected = selectedCards.has(item.id);

    const cardContent = (
      <Pressable
        onPress={() => {
          if (isSelectionMode) {
            toggleCardSelection(item.id);
          } else {
            router.push(`/card/${item.id}`);
          }
        }}
        onLongPress={() => {
          if (isReordering) return;
          setIsSelectionMode(true);
          toggleCardSelection(item.id);
          drag();
        }}
        disabled={isActive}>
        <UICard
          variant={isSelected ? 'primary' : 'elevated'}
          padding="md"
          className={`mb-3 ${isSelected ? 'border-2 border-blue-500' : ''}`}>
          <View className="flex-row items-center">
            {isSelectionMode && (
              <View style={{ marginRight: 12 }}>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isSelected ? colors.primary : colors.mutedForeground}
                />
              </View>
            )}

            {isReordering && (
              <View style={{ marginRight: 12 }}>
                <Ionicons name="reorder-three-outline" size={24} color={colors.mutedForeground} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View
                  className={`${getCardTypeColor(item.card_type)}`}
                  style={{ height: 20, width: 20, marginRight: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                  <Ionicons
                    name={getCardTypeIcon(item.card_type) as any}
                    size={12}
                    color="white"
                  />
                </View>
                <Text style={{ flex: 1, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
                  {item.title || `${item.card_type} Karte`}
                </Text>
                {item.is_favorite && <Ionicons name="heart" size={16} color="#EF4444" />}
              </View>
              <Text style={{ fontSize: 14, color: colors.mutedForeground }} numberOfLines={2}>
                {getContentPreview(item)}
              </Text>
            </View>

            {!isSelectionMode && !isReordering && (
              <View style={{ marginLeft: 8, flexDirection: 'row' }}>
                <Pressable onPress={() => toggleFavorite(item.id)} style={{ padding: 8 }}>
                  <Ionicons
                    name={item.is_favorite ? 'heart' : 'heart-outline'}
                    size={20}
                    color={item.is_favorite ? '#EF4444' : colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/card/edit/${item.id}` as any)}
                  style={{ padding: 8 }}>
                  <Ionicons name="create-outline" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
            )}
          </View>
        </UICard>
      </Pressable>
    );

    return isReordering ? <ScaleDecorator>{cardContent}</ScaleDecorator> : cardContent;
  };

  const getCardTypeIcon = (type: Card['card_type']) => {
    switch (type) {
      case 'text':
        return 'document-text-outline';
      case 'flashcard':
        return 'card-outline';
      case 'quiz':
        return 'help-circle-outline';
      case 'mixed':
        return 'grid-outline';
      default:
        return 'document-outline';
    }
  };

  const getCardTypeColor = (type: Card['card_type']) => {
    switch (type) {
      case 'text':
        return 'bg-blue-500';
      case 'flashcard':
        return 'bg-green-500';
      case 'quiz':
        return 'bg-purple-500';
      case 'mixed':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getContentPreview = (card: Card) => {
    switch (card.card_type) {
      case 'text':
        return (card.content as any).text || '';
      case 'flashcard':
        return (card.content as any).front || '';
      case 'quiz':
        return (card.content as any).question || '';
      case 'mixed':
        const blocks = (card.content as any).blocks || [];
        const firstTextBlock = blocks.find((block: any) => block.type === 'text');
        return firstTextBlock?.data?.text || '';
      default:
        return '';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: currentDeck?.name || 'Karten verwalten',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isSelectionMode ? (
                <Pressable onPress={deselectAll}>
                  <Text style={{ marginRight: 16, fontWeight: '500', color: colors.primary }}>Abbrechen</Text>
                </Pressable>
              ) : (
                <>
                  {sortMode === 'position' && !isReordering && (
                    <Pressable onPress={() => setIsReordering(true)} style={{ marginRight: 12 }}>
                      <Ionicons name="swap-vertical-outline" size={24} color={colors.foreground} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => router.push(`/card/create?deckId=${deckId}` as any)}
                    style={{ marginRight: 12 }}>
                    <Ionicons name="add" size={24} color={colors.foreground} />
                  </Pressable>
                </>
              )}
            </View>
          ),
        }}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Action Bar */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 12 }}>
            {isSelectionMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '500', color: colors.foreground }}>{selectedCards.size} ausgewählt</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button onPress={selectAll} variant="outline" size="sm">
                    Alle
                  </Button>
                  <Button
                    onPress={handleDeleteSelected}
                    variant="danger"
                    size="sm"
                    disabled={selectedCards.size === 0}>
                    Löschen
                  </Button>
                </View>
              </View>
            ) : isReordering ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '500', color: colors.foreground }}>Karten neu anordnen</Text>
                <Button onPress={() => setIsReordering(false)} variant="primary" size="sm">
                  Fertig
                </Button>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => setShowSortMenu(!showSortMenu)}
                    style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Ionicons name="funnel-outline" size={16} color={colors.foreground} />
                    <Text style={{ marginLeft: 8, fontSize: 14, color: colors.foreground }}>
                      {sortMode === 'position' && 'Position'}
                      {sortMode === 'newest' && 'Neueste'}
                      {sortMode === 'oldest' && 'Älteste'}
                      {sortMode === 'alphabetical' && 'Alphabetisch'}
                      {sortMode === 'type' && 'Typ'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowFilterMenu(!showFilterMenu)}
                    style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Ionicons name="filter-outline" size={16} color={colors.foreground} />
                    <Text style={{ marginLeft: 8, fontSize: 14, color: colors.foreground }}>
                      {filterType === 'all' && 'Alle'}
                      {filterType === 'favorites' && 'Favoriten'}
                      {filterType === 'text' && 'Text'}
                      {filterType === 'flashcard' && 'Flashcard'}
                      {filterType === 'quiz' && 'Quiz'}
                      {filterType === 'mixed' && 'Mixed'}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    setIsSelectionMode(true);
                  }}
                  style={{ borderRadius: 8, backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.foreground} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Sort Menu */}
          {showSortMenu && (
            <View style={{ position: 'absolute', left: 16, top: 80, zIndex: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
              {(['position', 'newest', 'oldest', 'alphabetical', 'type'] as SortMode[]).map(
                (mode) => (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      setSortMode(mode);
                      setShowSortMenu(false);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ flex: 1, color: colors.foreground }}>
                      {mode === 'position' && 'Position'}
                      {mode === 'newest' && 'Neueste zuerst'}
                      {mode === 'oldest' && 'Älteste zuerst'}
                      {mode === 'alphabetical' && 'Alphabetisch'}
                      {mode === 'type' && 'Nach Typ'}
                    </Text>
                    {sortMode === mode && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </Pressable>
                )
              )}
            </View>
          )}

          {/* Filter Menu */}
          {showFilterMenu && (
            <View style={{ position: 'absolute', right: 16, top: 80, zIndex: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
              {(['all', 'favorites', 'text', 'flashcard', 'quiz', 'mixed'] as FilterType[]).map(
                (type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      setFilterType(type);
                      setShowFilterMenu(false);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ flex: 1, color: colors.foreground }}>
                      {type === 'all' && 'Alle Karten'}
                      {type === 'favorites' && 'Nur Favoriten'}
                      {type === 'text' && 'Text Karten'}
                      {type === 'flashcard' && 'Flashcards'}
                      {type === 'quiz' && 'Quiz Karten'}
                      {type === 'mixed' && 'Mixed Karten'}
                    </Text>
                    {filterType === type && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </Pressable>
                )
              )}
            </View>
          )}

          {/* Cards List */}
          {displayCards.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="card-outline" size={48} color={colors.mutedForeground} />
              <Text style={{ marginTop: 8, color: colors.mutedForeground }}>
                {filterType === 'all' ? 'Noch keine Karten' : 'Keine Karten gefunden'}
              </Text>
              <Button
                onPress={() => router.push(`/card/create?deckId=${deckId}` as any)}
                variant="primary"
                size="sm"
                className="mt-4">
                Erste Karte erstellen
              </Button>
            </View>
          ) : isReordering && sortMode === 'position' ? (
            <DraggableFlatList
              data={displayCards}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.id}
              renderItem={renderCard}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            />
          ) : (
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}>
              {displayCards.map((card) => (
                <View key={card.id}>
                  {renderCard({
                    item: card,
                    drag: () => {},
                    isActive: false,
                    getIndex: () => 0,
                  } as RenderItemParams<Card>)}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Stats Bar */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>{cards.length}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Gesamt</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
                  {cards.filter((c) => c.is_favorite).length}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Favoriten</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
                  {cards.filter((c) => c.card_type === 'flashcard').length}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Flashcards</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
                  {cards.filter((c) => c.card_type === 'quiz').length}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Quiz</Text>
              </View>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </>
  );
}
