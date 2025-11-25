import { View, Pressable, Switch } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '~/contexts/ThemeContext';
import { useGenerationDefaults } from '~/store/generationDefaultsStore';
import { useModelSelection } from '~/store/modelStore';
import { aspectRatios } from '~/hooks/useImageGeneration';
import { Ionicons } from '@expo/vector-icons';

export function GenerationSettings() {
  const { theme } = useTheme();
  const {
    defaultModelId,
    defaultAspectRatio,
    defaultImageCount,
    useAdvancedByDefault,
    setDefaultModel,
    setDefaultAspectRatio,
    setDefaultImageCount,
    setUseAdvancedByDefault,
  } = useGenerationDefaults();

  const { models } = useModelSelection();

  const selectedModel = models.find(m => m.id === defaultModelId);
  const selectedRatio = aspectRatios.find(r => r.value === defaultAspectRatio);

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      ...theme.shadows.sm,
    }}>
      <Text variant="body" color="secondary" style={{ marginBottom: 16 }}>
        Voreinstellungen für neue Generierungen
      </Text>

      {/* Default Model */}
      <View style={{ marginBottom: 16 }}>
        <Text variant="bodySmall" color="secondary" style={{ marginBottom: 8 }}>
          Standard-Modell
        </Text>
        <Pressable
          onPress={() => {
            // We'll cycle through models or show a picker
            const currentIndex = models.findIndex(m => m.id === defaultModelId);
            const nextIndex = (currentIndex + 1) % (models.length + 1);
            const nextModel = nextIndex === models.length ? null : models[nextIndex];
            setDefaultModel(nextModel?.id || null);
          }}
          style={{
            backgroundColor: theme.colors.input,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text variant="body" weight="medium">
            {selectedModel?.name || 'Kein Standard (manuell wählen)'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      {/* Default Aspect Ratio */}
      <View style={{ marginBottom: 16 }}>
        <Text variant="bodySmall" color="secondary" style={{ marginBottom: 8 }}>
          Standard-Seitenverhältnis
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {aspectRatios.map(ratio => {
            const isSelected = ratio.value === defaultAspectRatio;
            return (
              <Pressable
                key={ratio.value}
                onPress={() => setDefaultAspectRatio(ratio.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isSelected ? theme.colors.primary.default : theme.colors.input,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.primary.default : theme.colors.border,
                }}
              >
                <Text
                  variant="bodySmall"
                  weight={isSelected ? 'semibold' : 'medium'}
                  style={{ color: isSelected ? '#fff' : theme.colors.text.primary }}
                >
                  {ratio.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Default Image Count */}
      <View style={{ marginBottom: 16 }}>
        <Text variant="bodySmall" color="secondary" style={{ marginBottom: 8 }}>
          Standard-Anzahl Varianten
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 4].map(count => {
            const isSelected = count === defaultImageCount;
            return (
              <Pressable
                key={count}
                onPress={() => setDefaultImageCount(count)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isSelected ? theme.colors.primary.default : theme.colors.input,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.primary.default : theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <Text
                  variant="body"
                  weight={isSelected ? 'bold' : 'medium'}
                  style={{ color: isSelected ? '#fff' : theme.colors.text.primary }}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Advanced Settings by Default */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text variant="body" weight="medium">
            Erweiterte Einstellungen immer anzeigen
          </Text>
          <Text variant="bodySmall" color="tertiary" style={{ marginTop: 4 }}>
            Zeigt erweiterte Optionen standardmäßig ausgeklappt
          </Text>
        </View>
        <Switch
          value={useAdvancedByDefault}
          onValueChange={setUseAdvancedByDefault}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary.default }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}
