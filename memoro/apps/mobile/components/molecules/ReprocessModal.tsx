import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import BaseModal from '~/components/atoms/BaseModal';
import BaseLanguageSelector, { LanguageItem } from '~/components/molecules/BaseLanguageSelector';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import Button from '~/components/atoms/Button';
import {
  useRecordingLanguage,
} from '~/features/audioRecordingV2';
import { createClient } from '@supabase/supabase-js';
import colors from '~/tailwind.config.js';

interface ReprocessModalProps {
  isVisible: boolean;
  onClose: () => void;
  onReprocess: (language?: string, blueprint?: any, recordingDate?: Date) => Promise<void>;
  currentLanguage: string;
  isProcessing?: boolean;
  memo: any; // The memo object to reprocess
}

const ReprocessModal: React.FC<ReprocessModalProps> = ({
  isVisible,
  onClose,
  onReprocess,
  currentLanguage,
  isProcessing = false,
  memo,
}) => {
  const { t } = useTranslation();
  const { isDark, themeVariant } = useTheme();
  const { recordingLanguages, toggleRecordingLanguage, supportedAzureLanguages } =
    useRecordingLanguage();

  const [modalMode, setModalMode] = useState<
    'reprocess' | 'language' | 'blueprint' | 'date' | 'time'
  >('reprocess');
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [selectedBlueprintForReprocess, setSelectedBlueprintForReprocess] = useState<any>(null);
  const [selectedLanguageForReprocess, setSelectedLanguageForReprocess] = useState<string>('auto');
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasCustomTime, setHasCustomTime] = useState(false);

  // Initialize values from memo when modal opens
  React.useEffect(() => {
    if (isVisible && memo) {
      // Set initial language from memo metadata
      const memoLanguage = memo.metadata?.language || 'auto';
      setSelectedLanguageForReprocess(memoLanguage);

      // Set initial date/time from memo
      const recordingDate = memo.metadata?.recordingStartedAt
        ? new Date(memo.metadata.recordingStartedAt)
        : new Date(memo.created_at);
      setSelectedDateTime(recordingDate);

      // Check if memo has a custom time set
      const memoCreatedAt = new Date(memo.created_at);
      const timeDiff = Math.abs(recordingDate.getTime() - memoCreatedAt.getTime());
      setHasCustomTime(timeDiff > 60000); // More than 1 minute difference

      // Reset blueprint selection
      setSelectedBlueprintForReprocess(null);
      setModalMode('reprocess');
    }
  }, [isVisible, memo]);

  // Get theme colors
  const getThemeColors = () => {
    const themeColors = isDark
      ? colors.theme.extend.colors.dark[themeVariant]
      : colors.theme.extend.colors[themeVariant];

    return {
      text: themeColors?.text || (isDark ? '#FFFFFF' : '#000000'),
      contentBackground: themeColors?.contentBackground || (isDark ? '#1E1E1E' : '#FFFFFF'),
      contentBackgroundHover:
        themeColors?.contentBackgroundHover || (isDark ? '#333333' : '#F5F5F5'),
      border: themeColors?.border || (isDark ? '#374151' : '#E5E7EB'),
      primary: themeColors?.primary || '#f8d62b',
    };
  };

  const themeColors = getThemeColors();

  const handleReprocess = async () => {
    if (isProcessing) {
      return;
    }

    try {
      await onReprocess(
        selectedLanguageForReprocess,
        selectedBlueprintForReprocess,
        selectedDateTime
      );
      // Only close modal if reprocess was successful
      handleModalClose();
    } catch (error) {
      console.error('Reprocess failed:', error);
      // Error handling is done in the action handler and global interceptor
      // 402 errors are handled globally, other errors show alerts in memoActions.ts
    }
  };

  const handleLanguageSelect = () => {
    setModalMode('language');
  };

  const handleBlueprintSelect = () => {
    setModalMode('blueprint');
    loadBlueprints();
  };

  const handleDateSelect = () => {
    if (Platform.OS === 'ios') {
      setModalMode('date');
    } else {
      setShowDatePicker(true);
    }
  };

  const handleTimeSelect = () => {
    if (Platform.OS === 'ios') {
      setModalMode('time');
    } else {
      setShowTimePicker(true);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setSelectedDateTime(newDateTime);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setSelectedDateTime(newDateTime);
      setHasCustomTime(true);
    }
  };

  // Load blueprints
  const loadBlueprints = async () => {
    setBlueprintsLoading(true);
    try {
      const directSupabase = createClient(
        'https://npgifbrwhftlbrbaglmi.supabase.co',
        'sb_publishable_HlAZpB4BxXaMcfOCNx6VJA_-64NTxu4'
      );

      const { data: blueprintData, error: blueprintError } = await directSupabase
        .from('blueprints')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (blueprintError) {
        console.error('Error loading blueprints:', blueprintError);
        setBlueprints([]);
      } else {
        setBlueprints(blueprintData || []);
      }
    } catch (error) {
      console.error('Error loading blueprints:', error);
      setBlueprints([]);
    } finally {
      setBlueprintsLoading(false);
    }
  };

  const getSelectedLanguageDisplay = () => {
    if (selectedLanguageForReprocess === 'auto') {
      return t('upload.auto_detect', 'Automatisch erkennen');
    } else {
      return (
        supportedAzureLanguages[selectedLanguageForReprocess]?.nativeName ||
        selectedLanguageForReprocess
      );
    }
  };

  const getSelectedBlueprintDisplay = () => {
    if (selectedBlueprintForReprocess) {
      const lang = currentLanguage.startsWith('de') ? 'de' : 'en';
      return (
        selectedBlueprintForReprocess.name?.[lang] ||
        selectedBlueprintForReprocess.name?.en ||
        selectedBlueprintForReprocess.name?.de ||
        'Blueprint'
      );
    }
    return t('reprocess.no_blueprint_selected', 'Kein Blueprint ausgewählt');
  };

  const getSelectedDateDisplay = () => {
    return selectedDateTime.toLocaleDateString(
      currentLanguage.startsWith('de') ? 'de-DE' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  const getSelectedTimeDisplay = () => {
    return selectedDateTime.toLocaleTimeString(
      currentLanguage.startsWith('de') ? 'de-DE' : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const renderActionButton = (
    iconName: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    showChevron: boolean = true,
    isActive: boolean = false
  ) => (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: themeColors.contentBackgroundHover,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
      onPress={onPress}
      android_ripple={{
        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderless: false,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isActive ? themeColors.primary : themeColors.contentBackgroundHover,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
          borderWidth: isActive ? 0 : 1,
          borderColor: themeColors.border,
        }}>
        <Icon name={iconName} size={20} color={isActive ? '#000000' : themeColors.text} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: themeColors.text,
            marginBottom: 2,
          }}>
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? '#D1D5DB' : '#6B7280',
          }}>
          {subtitle}
        </Text>
      </View>

      {showChevron && (
        <Icon name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
      )}
    </Pressable>
  );

  const getModalTitle = () => {
    switch (modalMode) {
      case 'language':
        return t('reprocess.select_language', 'Sprache auswählen');
      case 'blueprint':
        return t('reprocess.select_blueprint', 'Blueprint auswählen');
      case 'date':
        return t('reprocess.select_date', 'Datum auswählen');
      case 'time':
        return t('reprocess.select_time', 'Uhrzeit auswählen');
      default:
        return t('reprocess.title', 'Memo erneut verarbeiten');
    }
  };

  const renderModalContent = () => {
    switch (modalMode) {
      case 'language':
        // Convert languages to BaseLanguageSelector format
        const languageItems: Record<string, LanguageItem> = Object.entries(
          supportedAzureLanguages
        ).reduce(
          (acc, [code, lang]) => {
            acc[code] = {
              code,
              ...lang,
            };
            return acc;
          },
          {} as Record<string, LanguageItem>
        );

        return (
          <View style={{ height: 400 }}>
            <BaseLanguageSelector
              languages={languageItems}
              selectedLanguages={selectedLanguageForReprocess ? [selectedLanguageForReprocess] : []}
              onSelect={(languages) => {
                if (languages.length > 0) {
                  setSelectedLanguageForReprocess(languages[0]);
                  setModalMode('reprocess');
                }
              }}
              mode="single"
              showAutoDetect={true}
              height={400}
              autoSelectOnSingle={false}
            />
          </View>
        );

      case 'blueprint':
        return (
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
            {blueprintsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={{ color: themeColors.text, marginTop: 10 }}>
                  {t('reprocess.loading_blueprints', 'Blueprints werden geladen...')}
                </Text>
              </View>
            ) : blueprints.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: themeColors.text }}>
                  {t('reprocess.no_blueprints_available', 'Keine Blueprints verfügbar')}
                </Text>
              </View>
            ) : (
              blueprints.map((blueprint) => {
                const isSelected = selectedBlueprintForReprocess?.id === blueprint.id;
                const lang = currentLanguage.startsWith('de') ? 'de' : 'en';
                const displayName =
                  blueprint.name?.[lang] || blueprint.name?.en || blueprint.name?.de || 'Blueprint';
                const displayDescription =
                  blueprint.description?.[lang] ||
                  blueprint.description?.en ||
                  blueprint.description?.de ||
                  '';

                return (
                  <Pressable
                    key={blueprint.id}
                    style={{
                      padding: 16,
                      backgroundColor: isSelected
                        ? themeColors.contentBackgroundHover
                        : 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                    onPress={() => {
                      setSelectedBlueprintForReprocess(blueprint);
                      setModalMode('reprocess');
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: themeColors.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                        <Icon name="document-text" size={20} color="#000000" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: isSelected ? '600' : '500',
                            color: themeColors.text,
                            marginBottom: 2,
                          }}>
                          {displayName}
                        </Text>
                        {displayDescription ? (
                          <Text
                            style={{
                              fontSize: 14,
                              color: isDark ? '#D1D5DB' : '#6B7280',
                              lineHeight: 18,
                            }}
                            numberOfLines={2}
                            ellipsizeMode="tail">
                            {displayDescription}
                          </Text>
                        ) : null}
                      </View>

                      {isSelected && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: themeColors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          <Icon name="checkmark" size={16} color="#000000" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        );

      case 'date':
        return (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <DateTimePicker
              value={selectedDateTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              style={{
                backgroundColor: themeColors.contentBackground,
              }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
            {Platform.OS === 'ios' && (
              <Button
                title={t('common.done', 'Fertig')}
                onPress={() => setModalMode('reprocess')}
                variant="primary"
                style={{ marginTop: 20, minWidth: 120 }}
              />
            )}
          </View>
        );

      case 'time':
        return (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <DateTimePicker
              value={selectedDateTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              style={{
                backgroundColor: themeColors.contentBackground,
              }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
            {Platform.OS === 'ios' && (
              <Button
                title={t('common.done', 'Fertig')}
                onPress={() => setModalMode('reprocess')}
                variant="primary"
                style={{ marginTop: 20, minWidth: 120 }}
              />
            )}
          </View>
        );

      default:
        return (
          <View style={{ width: '100%' }}>
            {isProcessing ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: themeColors.text,
                    marginTop: 16,
                    marginBottom: 8,
                  }}>
                  {t('reprocess.processing', 'Memo wird verarbeitet...')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? '#D1D5DB' : '#6B7280',
                    textAlign: 'center',
                    lineHeight: 20,
                  }}>
                  {memo?.title ||
                    t(
                      'reprocess.processing_memo',
                      'Das Memo wird mit den neuen Einstellungen verarbeitet.'
                    )}
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? '#D1D5DB' : '#6B7280',
                    marginBottom: 24,
                    lineHeight: 20,
                  }}>
                  {t(
                    'reprocess.description',
                    'Konfigurieren Sie die Einstellungen für die erneute Verarbeitung des Memos.'
                  )}
                </Text>

                {renderActionButton(
                  'language-outline',
                  t('reprocess.select_language', 'Sprache auswählen'),
                  getSelectedLanguageDisplay(),
                  handleLanguageSelect,
                  true,
                  selectedLanguageForReprocess !== 'auto'
                )}

                {renderActionButton(
                  'calendar-outline',
                  t('reprocess.select_date', 'Datum auswählen'),
                  getSelectedDateDisplay(),
                  handleDateSelect,
                  true,
                  selectedDateTime.toDateString() !== new Date().toDateString()
                )}

                {renderActionButton(
                  'time-outline',
                  t('reprocess.select_time', 'Uhrzeit auswählen'),
                  getSelectedTimeDisplay(),
                  handleTimeSelect,
                  true,
                  hasCustomTime
                )}

                {renderActionButton(
                  'document-text-outline',
                  t('reprocess.select_blueprint', 'Blueprint auswählen'),
                  getSelectedBlueprintDisplay(),
                  handleBlueprintSelect,
                  true,
                  !!selectedBlueprintForReprocess
                )}
              </>
            )}
          </View>
        );
    }
  };

  const handleModalClose = () => {
    if (isProcessing) {
      return;
    }

    if (modalMode === 'reprocess') {
      setModalMode('reprocess');
      onClose();
    } else {
      setModalMode('reprocess');
    }
  };

  return (
    <>
      <BaseModal
        isVisible={isVisible}
        onClose={handleModalClose}
        title={getModalTitle()}
        animationType="fade"
        closeOnOverlayPress={!isProcessing}
        hideFooter={modalMode !== 'reprocess' || isProcessing}
        noPadding={modalMode === 'language'}
        size="medium"
        footerContent={
          modalMode === 'reprocess' && !isProcessing ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 20,
                gap: 12,
              }}>
              <Button
                title={t('common.cancel', 'Abbrechen')}
                onPress={handleModalClose}
                variant="secondary"
                style={{ flex: 1 }}
                disabled={isProcessing}
              />
              <Button
                title={
                  isProcessing
                    ? t('reprocess.processing', 'Verarbeitung...')
                    : t('reprocess.reprocess', 'Erneut verarbeiten')
                }
                onPress={handleReprocess}
                variant="primary"
                style={{ flex: 1 }}
                disabled={isProcessing}
                loading={isProcessing}
              />
            </View>
          ) : undefined
        }>
        {renderModalContent()}
      </BaseModal>

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Android Time Picker */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </>
  );
};

export default ReprocessModal;
