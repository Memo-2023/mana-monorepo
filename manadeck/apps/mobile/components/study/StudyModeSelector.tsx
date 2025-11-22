import React from 'react';
import { View, Pressable, Modal } from 'react-native';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useThemeColors } from '~/utils/themeUtils';

export type StudyMode = 'all' | 'new' | 'review' | 'favorites' | 'random';

interface StudyModeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (mode: StudyMode) => void;
  cardStats?: {
    total: number;
    favorites: number;
    new: number;
    review: number;
  };
}

interface StudyModeOption {
  id: StudyMode;
  name: string;
  description: string;
  icon: string;
  getColor: (colors: ReturnType<typeof useThemeColors>) => string;
  disabled?: boolean;
}

const getStudyModes = (colors: ReturnType<typeof useThemeColors>): StudyModeOption[] => [
  {
    id: 'all' as StudyMode,
    name: 'Alle Karten',
    description: 'Alle Karten der Reihe nach durchgehen',
    icon: 'albums-outline',
    getColor: (c) => c.primary,
  },
  {
    id: 'random' as StudyMode,
    name: 'Zufällig',
    description: 'Karten in zufälliger Reihenfolge',
    icon: 'shuffle-outline',
    getColor: (c) => c.secondary,
  },
  {
    id: 'favorites' as StudyMode,
    name: 'Favoriten',
    description: 'Nur als Favorit markierte Karten',
    icon: 'heart-outline',
    getColor: (c) => c.destructive,
  },
  {
    id: 'new' as StudyMode,
    name: 'Neue Karten',
    description: 'Noch nicht gelernte Karten',
    icon: 'sparkles-outline',
    getColor: (c) => c.accent,
    disabled: false,
  },
  {
    id: 'review' as StudyMode,
    name: 'Wiederholung',
    description: 'Fällige Karten wiederholen',
    icon: 'refresh-outline',
    getColor: (c) => c.secondary,
    disabled: false,
  },
];

export const StudyModeSelector: React.FC<StudyModeSelectorProps> = ({
  visible,
  onClose,
  onSelectMode,
  cardStats,
}) => {
  const colors = useThemeColors();
  const studyModes = getStudyModes(colors);
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface, paddingBottom: 32, paddingTop: 24 }}>
          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>Lernmodus wählen</Text>
            <Pressable onPress={onClose} style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <Icon name="close" library="Ionicons" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            {studyModes.map((mode) => (
              <Pressable
                key={mode.id}
                onPress={() => {
                  if (!mode.disabled) {
                    onSelectMode(mode.id);
                    onClose();
                  }
                }}
                disabled={mode.disabled}
                style={({ pressed }) => ({ opacity: pressed && !mode.disabled ? 0.7 : 1 })}>
                <Card
                  variant={mode.disabled ? 'outlined' : 'elevated'}
                  padding="md"
                  style={{ marginBottom: 12, opacity: mode.disabled ? 0.5 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        height: 48,
                        width: 48,
                        backgroundColor: mode.disabled ? colors.muted : mode.getColor(colors),
                        marginRight: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                      }}>
                      <Icon name={mode.icon} library="Ionicons" size={24} color={mode.disabled ? colors.mutedForeground : "white"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{mode.name}</Text>
                        {mode.disabled && (
                          <View style={{ marginLeft: 8, borderRadius: 12, backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Bald verfügbar</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ marginTop: 4, fontSize: 14, color: colors.mutedForeground }}>{mode.description}</Text>
                      {cardStats && mode.id === 'all' && (
                        <Text style={{ marginTop: 4, fontSize: 12, color: colors.mutedForeground }}>
                          {cardStats.total} Karten verfügbar
                        </Text>
                      )}
                      {cardStats && mode.id === 'favorites' && (
                        <Text style={{ marginTop: 4, fontSize: 12, color: colors.mutedForeground }}>
                          {cardStats.favorites} Favoriten verfügbar
                        </Text>
                      )}
                    </View>
                    {!mode.disabled && (
                      <Icon name="chevron-forward" library="Ionicons" size={20} color={colors.mutedForeground} />
                    )}
                  </View>
                </Card>
              </Pressable>
            ))}

            <View style={{ marginTop: 16 }}>
              <Button onPress={onClose} variant="outline" fullWidth>
                Abbrechen
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
