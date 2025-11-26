import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Deck } from '../../store/deckStore';
import { useThemeColors } from '~/utils/themeUtils';

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  showProgress?: boolean;
  isCompact?: boolean;
}

export const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  onPress,
  showProgress = false,
  isCompact = false,
}) => {
  const isFavorite = deck.metadata?.is_favorite || false;
  const colors = useThemeColors();

  if (isCompact) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({
        backgroundColor: colors.surfaceElevated,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 12,
        opacity: pressed ? 0.95 : 1,
      })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 16 }} numberOfLines={1}>
              {deck.title}
            </Text>
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="card-outline" size={14} color={colors.mutedForeground} library="Ionicons" />
              <Text style={{ marginLeft: 4, color: colors.mutedForeground, fontSize: 12 }}>
                {deck.card_count || 0} Karten
              </Text>
              {deck.is_public && (
                <>
                  <Text style={{ marginHorizontal: 8, color: colors.mutedForeground }}>•</Text>
                  <Icon name="globe-outline" size={14} color={colors.mutedForeground} library="Ionicons" />
                  <Text style={{ marginLeft: 4, color: colors.mutedForeground, fontSize: 12 }}>
                    Öffentlich
                  </Text>
                </>
              )}
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.mutedForeground} library="Ionicons" />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{
      backgroundColor: colors.surfaceElevated,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      overflow: 'hidden',
    }}>
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
      {deck.cover_image_url ? (
        <Image source={{ uri: deck.cover_image_url }} style={{ height: 140, width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16 }} resizeMode="cover" />
      ) : (
        <View style={{ 
          height: 140, 
          width: '100%', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: `${colors.primary}15`,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}>
          <Icon name="albums-outline" size={40} color={colors.primary} library="Ionicons" />
        </View>
      )}

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.foreground, marginBottom: 4 }} numberOfLines={1}>
              {deck.title}
            </Text>
            {deck.description && (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
                {deck.description}
              </Text>
            )}
          </View>
          {isFavorite && (
            <Icon
              name="heart"
              size={18}
              color={colors.destructive}
              style={{ marginLeft: 12, marginTop: 2 }}
              library="Ionicons"
            />
          )}
        </View>

        {showProgress && (
          <View style={{ marginTop: 16 }}>
            <View style={{ marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground }}>
                Fortschritt
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground }}>
                0%
              </Text>
            </View>
            <View style={{ height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: `${colors.muted}60` }}>
              <View style={{ height: '100%', borderRadius: 3, backgroundColor: colors.primary, width: '0%' }} />
            </View>
          </View>
        )}
      </View>
    </Pressable>
    </View>
  );
};
