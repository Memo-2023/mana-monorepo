import React, { useEffect } from 'react';
import { View, FlatList, Pressable, Alert } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { useCardStore, Card } from '../../store/cardStore';
import { router } from 'expo-router';
import { Card as UICard } from '../ui/Card';
import { Button } from '../ui/Button';
import { useThemeColors } from '~/utils/themeUtils';

interface CardListProps {
  deckId: string;
  isCompact?: boolean;
  showActions?: boolean;
  limit?: number;
  onCardPress?: (card: Card) => void;
}

interface CardItemProps {
  card: Card;
  isCompact: boolean;
  showActions: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  isCompact,
  showActions,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const colors = useThemeColors();
  
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
        return colors.primary;
      case 'flashcard':
        return colors.accent;
      case 'quiz':
        return colors.secondary;
      case 'mixed':
        return colors.destructive;
      default:
        return colors.mutedForeground;
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

  if (isCompact) {
    return (
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View
            style={{
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
              opacity: pressed ? 0.7 : 1,
            }}>
            {/* Icon Container */}
            <View
              style={{
                width: 50,
                height: 50,
                backgroundColor: getCardTypeColor(card.card_type),
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
              <Icon
                name={getCardTypeIcon(card.card_type)}
                size={26}
                color="#FFFFFF"
                library="Ionicons"
              />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1F2937',
                  marginBottom: 4,
                }}
                numberOfLines={1}>
                {card.title || `${card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)} Karte`}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                }}
                numberOfLines={1}>
                {getContentPreview(card)}
              </Text>
            </View>

            {/* Chevron */}
            <Icon
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              library="Ionicons"
              style={{ marginLeft: 8 }}
            />
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <UICard onPress={onPress} variant="elevated" padding="lg" style={{ marginBottom: 16 }}>
      <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                height: 24,
                width: 24,
                backgroundColor: getCardTypeColor(card.card_type),
                marginRight: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}>
              <Icon
                name={getCardTypeIcon(card.card_type)}
                size={12}
                color="white"
                library="Ionicons"
              />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.mutedForeground }}>
              {card.card_type}
            </Text>
            {card.is_favorite && (
              <Icon
                name="heart"
                size={14}
                color={colors.destructive}
                style={{ marginLeft: 8 }}
                library="Ionicons"
              />
            )}
          </View>

          <Text style={{ marginBottom: 4, fontSize: 18, fontWeight: '600', color: colors.foreground }}>
            {card.title || `Position ${card.position}`}
          </Text>

          <Text style={{ color: colors.mutedForeground }} numberOfLines={3}>
            {getContentPreview(card)}
          </Text>
        </View>

        {showActions && (
          <View style={{ marginLeft: 12, flexDirection: 'row' }}>
            <Pressable
              onPress={onToggleFavorite}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.7 : 1 })}>
              <Icon
                name={card.is_favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={card.is_favorite ? colors.destructive : colors.mutedForeground}
                library="Ionicons"
              />
            </Pressable>
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.7 : 1 })}>
              <Icon name="create-outline" size={20} color={colors.mutedForeground} library="Ionicons" />
            </Pressable>
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.7 : 1 })}>
              <Icon name="trash-outline" size={20} color={colors.destructive} library="Ionicons" />
            </Pressable>
          </View>
        )}
      </View>

      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Position {card.position}</Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
          {new Date(card.updated_at).toLocaleDateString('de-DE')}
        </Text>
      </View>
    </UICard>
  );
};

export const CardList: React.FC<CardListProps> = ({
  deckId,
  isCompact = false,
  showActions = true,
  limit,
  onCardPress,
}) => {
  const { cards, fetchCards, deleteCard, toggleFavorite, isLoading } = useCardStore();
  const colors = useThemeColors();

  useEffect(() => {
    fetchCards(deckId);
  }, [deckId]);

  const displayCards = limit ? cards.slice(0, limit) : cards;

  const handleCardPress = (card: Card) => {
    if (onCardPress) {
      onCardPress(card);
    } else {
      router.push(`/card/${card.id}`);
    }
  };

  const handleEdit = (card: Card) => {
    router.push(`/card/edit/${card.id}`);
  };

  const handleDelete = (card: Card) => {
    Alert.alert('Karte löschen', 'Möchtest du diese Karte wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => deleteCard(card.id),
      },
    ]);
  };

  const handleToggleFavorite = (card: Card) => {
    toggleFavorite(card.id);
  };

  if (cards.length === 0 && !isLoading) {
    return (
      <UICard padding="lg" variant="outlined">
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Icon name="card-outline" size={48} color={colors.mutedForeground} library="Ionicons" />
          <Text style={{ marginTop: 8, color: colors.mutedForeground }}>Noch keine Karten</Text>
          <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 14, color: colors.mutedForeground }}>
            Füge deine erste Karte hinzu, um zu beginnen
          </Text>
          <View style={{ marginTop: 16 }}>
            <Button
              onPress={() => router.push(`/card/create?deckId=${deckId}`)}
              variant="primary"
              size="sm">
              Erste Karte erstellen
            </Button>
          </View>
        </View>
      </UICard>
    );
  }

  return (
    <View>
      <FlatList
        data={displayCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardItem
            card={item}
            isCompact={isCompact}
            showActions={showActions}
            onPress={() => handleCardPress(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
            onToggleFavorite={() => handleToggleFavorite(item)}
          />
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={isCompact ? undefined : () => <View style={{ height: 8 }} />}
      />

      {limit && cards.length > limit && (
        <Pressable
          onPress={() => router.push(`/deck/${deckId}/cards`)}
          style={({ pressed }) => ({ marginTop: 12, opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ textAlign: 'center', fontWeight: '500', color: colors.primary }}>
            Alle {cards.length} Karten anzeigen
          </Text>
        </Pressable>
      )}
    </View>
  );
};
