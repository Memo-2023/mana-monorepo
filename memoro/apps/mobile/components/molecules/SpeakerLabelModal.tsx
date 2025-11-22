import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import Input from '~/components/atoms/Input';
import BaseModal from '~/components/atoms/BaseModal';
import { useTranslation } from 'react-i18next';

interface SpeakerMapping {
  id: string;
  label: string;
}

interface SpeakerLabelModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (speakerMappings: SpeakerMapping[]) => void;
  speakers: string[];
  initialMappings?: Record<string, string>;
}

/**
 * Modal-Komponente zur Benennung von Sprechern im Transkript
 *
 * Ermöglicht die Zuweisung von Namen zu Sprechern, die im Transkript identifiziert wurden.
 */
const SpeakerLabelModal: React.FC<SpeakerLabelModalProps> = ({
  visible,
  onClose,
  onSubmit,
  speakers,
  initialMappings = {},
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // State für die Sprecher-Mappings
  const [speakerMappings, setSpeakerMappings] = useState<SpeakerMapping[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialisiere die Sprecher-Mappings nur beim ersten Öffnen des Modals
  useEffect(() => {
    if (visible && !hasInitialized) {
      // Wenn keine Sprecher vorhanden sind, erstelle Standardsprecher
      if (speakers.length === 0) {
        // Erstelle zwei Standardsprecher, wenn keine vorhanden sind
        const defaultSpeakers = [
          {
            id: 'speaker1',
            label:
              initialMappings['speaker1'] ||
              t('memo.speaker_default', 'Sprecher {{number}}', { number: 1 }),
          },
          {
            id: 'speaker2',
            label:
              initialMappings['speaker2'] ||
              t('memo.speaker_default', 'Sprecher {{number}}', { number: 2 }),
          },
        ];
        setSpeakerMappings(defaultSpeakers);
      } else {
        const initializedMappings = speakers.map((speakerId) => ({
          id: speakerId,
          label:
            initialMappings[speakerId] ||
            t('memo.speaker_default', 'Sprecher {{number}}', {
              number: speakerId.replace('speaker', ''),
            }),
        }));
        setSpeakerMappings(initializedMappings);
      }
      setHasInitialized(true);
    }

    // Reset initialization flag when modal is closed
    if (!visible && hasInitialized) {
      setHasInitialized(false);
    }
  }, [visible, speakers, initialMappings, hasInitialized]);

  // Handler für die Änderung eines Sprecher-Labels
  const handleLabelChange = (speakerId: string, newLabel: string) => {
    setSpeakerMappings((prevMappings) =>
      prevMappings.map((mapping) =>
        mapping.id === speakerId ? { ...mapping, label: newLabel } : mapping
      )
    );
  };

  // Handler für das Absenden des Formulars
  const handleSubmit = () => {
    onSubmit(speakerMappings);
  };

  // Helper function to format speaker display label
  const getSpeakerLabel = (speakerId: string): string => {
    // Handle prefixed speaker IDs from additional recordings (e.g., rec0_speaker1)
    const prefixedMatch = speakerId.match(/^rec(\d+)_speaker(\d+)$/i);
    if (prefixedMatch) {
      const recordingIndex = parseInt(prefixedMatch[1], 10);
      const speakerNumber = prefixedMatch[2];
      // Format as "Recording X - Speaker Y"
      return t(
        'memo.recording_speaker',
        'Aufnahme {{recordingNumber}} - Sprecher {{speakerNumber}}',
        {
          recordingNumber: recordingIndex + 1,
          speakerNumber: speakerNumber,
        }
      );
    }

    // Handle regular speaker IDs
    const match = speakerId.match(/speaker(\d+)/i);
    if (match) {
      const number = match[1];
      return t('memo.speaker_default', 'Sprecher {{number}}', { number });
    }

    // Fallback
    return speakerId;
  };

  // Render the content of the modal
  const renderContent = () => (
    <View className="w-full">
      <Text className={`mb-6 text-center text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
        {t('memo.name_speakers_description', 'Ordne jedem Sprecher im Transkript einen Namen zu')}
      </Text>

      <ScrollView className="max-h-[400px] w-full">
        {speakerMappings.map((mapping) => (
          <View key={mapping.id} className="mb-4 w-full">
            <Text className={`mb-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {getSpeakerLabel(mapping.id)}:
            </Text>
            <Input
              value={mapping.label}
              onChangeText={(text) => handleLabelChange(mapping.id, text)}
              placeholder={t('memo.speaker_name_placeholder', 'Namen eingeben', {
                id: mapping.id.replace('speaker', ''),
              })}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Render the footer with action buttons
  const renderFooter = () => (
    <View className="w-full flex-row justify-between">
      <Button
        title={t('common.cancel', 'Abbrechen')}
        onPress={onClose}
        variant="secondary"
        style={{ flex: 1, marginRight: 8 }}
      />
      <Button
        title={t('common.save', 'Speichern')}
        onPress={handleSubmit}
        variant="primary"
        style={{ flex: 1 }}
      />
    </View>
  );

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      title={t('memo.name_speakers', 'Sprecher benennen')}
      animationType="fade"
      closeOnOverlayPress={true}
      footerContent={renderFooter()}>
      {renderContent()}
    </BaseModal>
  );
};

export default SpeakerLabelModal;
