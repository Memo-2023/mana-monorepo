import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '~/components/atoms/BaseModal';
import BaseLanguageSelector from '~/components/molecules/BaseLanguageSelector';

interface LanguageSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  languages: Record<string, { locale: string; nativeName: string; emoji: string }>;
  selectedLanguages: string[];
  onToggleLanguage: (languageCode: string) => void;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isVisible,
  onClose,
  languages,
  selectedLanguages,
  onToggleLanguage,
}) => {
  const { t } = useTranslation();
  
  // Handler for selection changes
  const handleSelectionChange = (newSelection: string[]) => {
    // Find the difference to determine which language was toggled
    const added = newSelection.find(lang => !selectedLanguages.includes(lang));
    const removed = selectedLanguages.find(lang => !newSelection.includes(lang));
    
    if (added) {
      onToggleLanguage(added);
    } else if (removed) {
      onToggleLanguage(removed);
    }
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      title={t('upload.select_recording_language', 'Aufnahmesprache auswählen')}
      animationType="fade"
      closeOnOverlayPress={true}
      hideFooter={true}
      noPadding={true}
      size="medium"
    >
      <BaseLanguageSelector
        languages={languages}
        selectedLanguages={selectedLanguages}
        onSelect={handleSelectionChange}
        mode="multi"
        showAutoDetect={true}
        height={450}
      />
    </BaseModal>
  );
};

export default LanguageSelectionModal;