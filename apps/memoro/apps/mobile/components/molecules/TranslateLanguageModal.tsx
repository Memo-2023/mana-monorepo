import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '~/components/atoms/BaseModal';
import BaseLanguageSelector, { LanguageItem } from '~/components/molecules/BaseLanguageSelector';
import { ALL_TRANSLATION_LANGUAGES, isOfficiallySupported } from '~/config/translationLanguages';

interface TranslateLanguageModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (targetLanguage: string) => Promise<boolean>;
}

/**
 * Modal zur Auswahl der Zielsprache für die Memo-Übersetzung
 * Unterstützt alle Gemini 2.0 Flash Sprachen (38 offiziell + zusätzliche)
 */
const TranslateLanguageModal: React.FC<TranslateLanguageModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Convert translation languages to BaseLanguageSelector format
  const languagesWithMetadata: Record<string, LanguageItem> = Object.entries(
    ALL_TRANSLATION_LANGUAGES
  ).reduce(
    (acc, [code, lang]) => {
      acc[code] = {
        code,
        ...lang,
        isExperimental: !isOfficiallySupported(code),
      };
      return acc;
    },
    {} as Record<string, LanguageItem>
  );

  // Handler für die Auswahl einer Sprache (nur State aktualisieren)
  const handleLanguageSelect = (languages: string[]) => {
    if (languages.length === 0) {
      setSelectedLanguage(null);
      return;
    }
    setSelectedLanguage(languages[0]); // Single selection mode
  };

  // Handler für die Bestätigung der Übersetzung
  const handleConfirm = async () => {
    if (!selectedLanguage) return;

    setIsTranslating(true);
    try {
      await onConfirm(selectedLanguage);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handler für das Schließen des Modals
  const handleClose = () => {
    setSelectedLanguage(null);
    setIsTranslating(false);
    onClose();
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={handleClose}
      title={t('memo.translate_select_language', 'Zielsprache für Übersetzung auswählen')}
      animationType="fade"
      closeOnOverlayPress={true}
      noPadding={true}
      size="medium"
      primaryButtonText={isTranslating ? t('memo.translating', 'Übersetze...') : t('memo.translate', 'Übersetzen')}
      primaryButtonDisabled={!selectedLanguage || isTranslating}
      primaryButtonLoading={isTranslating}
      onPrimaryButtonPress={handleConfirm}
      secondaryButtonText={t('common.cancel', 'Abbrechen')}
      onSecondaryButtonPress={handleClose}>
      <BaseLanguageSelector
        languages={languagesWithMetadata}
        selectedLanguages={selectedLanguage ? [selectedLanguage] : []}
        onSelect={handleLanguageSelect}
        mode="single"
        showAutoDetect={false}
        showExperimentalWarning={true}
        loading={false}
        height={450}
        autoSelectOnSingle={false}
      />
    </BaseModal>
  );
};

export default TranslateLanguageModal;
