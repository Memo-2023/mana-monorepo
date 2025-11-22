import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import BaseModal from '~/components/atoms/BaseModal';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import Button from '~/components/atoms/Button';
import BlueprintModal from '~/components/organisms/BlueprintModal';
import { useRecordingLanguage } from '~/features/audioRecordingV2';
import { createClient } from '@supabase/supabase-js';
import colors from '~/tailwind.config.js';
import { useInsufficientCreditsStore } from '~/features/credits/store/insufficientCreditsStore';
import { extractMediaDurationWithFormat, isSupportedMediaFile } from '~/utils/mediaUtils';

interface UploadModalProps {
  isVisible: boolean;
  onClose: () => void;
  onFileUpload: (file: any, language?: string, blueprint?: any, recordingDate?: Date, duration?: number) => Promise<void>;
  currentLanguage: string;
  isUploading?: boolean;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isVisible,
  onClose,
  onFileUpload,
  currentLanguage,
  isUploading = false
}) => {
  const { t } = useTranslation();
  const { isDark, themeVariant } = useTheme();
  const { recordingLanguages, toggleRecordingLanguage, supportedAzureLanguages } = useRecordingLanguage();
  const isInsufficientCreditsModalVisible = useInsufficientCreditsStore((state) => state.isModalVisible);
  
  const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] = useState(false);
  const [isBlueprintModalVisible, setIsBlueprintModalVisible] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'upload' | 'language' | 'blueprint' | 'date' | 'time'>('upload');
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [selectedBlueprintForUpload, setSelectedBlueprintForUpload] = useState<any>(null);
  const [selectedLanguageForUpload, setSelectedLanguageForUpload] = useState<string>('auto');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasCustomTime, setHasCustomTime] = useState(false);
  const [fileDuration, setFileDuration] = useState<{ milliseconds: number; formatted: string } | null>(null);
  const [isExtractingDuration, setIsExtractingDuration] = useState(false);

  // Get theme colors
  const getThemeColors = () => {
    const themeColors = isDark 
      ? colors.theme.extend.colors.dark[themeVariant]
      : colors.theme.extend.colors[themeVariant];
    
    return {
      text: themeColors?.text || (isDark ? '#FFFFFF' : '#000000'),
      contentBackground: themeColors?.contentBackground || (isDark ? '#1E1E1E' : '#FFFFFF'),
      contentBackgroundHover: themeColors?.contentBackgroundHover || (isDark ? '#333333' : '#F5F5F5'),
      border: themeColors?.border || (isDark ? '#374151' : '#E5E7EB'),
      primary: themeColors?.primary || '#f8d62b'
    };
  };

  const themeColors = getThemeColors();

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          // Audio formats
          'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a',
          // Video formats
          'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/*'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setSelectedFile(file);

        // Extract duration from the selected file
        setIsExtractingDuration(true);
        setFileDuration(null);

        try {
          if (!isSupportedMediaFile(file)) {
            console.warn('File may not be a supported media format, attempting extraction anyway');
          }

          const durationResult = await extractMediaDurationWithFormat(file);
          setFileDuration({
            milliseconds: durationResult.durationMillis,
            formatted: durationResult.formatted
          });
          console.log('Duration extracted successfully:', durationResult.formatted);
        } catch (error) {
          console.error('Failed to extract duration:', error);
          Alert.alert(
            t('upload.error_title', 'Error'),
            t('upload.duration_extraction_failed', 'Could not extract media duration. The file may be corrupted or in an unsupported format.'),
            [
              {
                text: t('common.cancel', 'Cancel'),
                style: 'cancel',
                onPress: () => {
                  setSelectedFile(null);
                  setFileDuration(null);
                }
              },
              {
                text: t('common.try_another', 'Try Another File'),
                onPress: () => handleFileSelect()
              }
            ]
          );
        } finally {
          setIsExtractingDuration(false);
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert(
        t('upload.error_title', 'Error'),
        t('upload.file_selection_failed', 'Failed to select file. Please try again.')
      );
    }
  };

  const handleUpload = async () => {
    console.log('handleUpload called');
    if (!selectedFile || isUploading) {
      return;
    }

    // Ensure we have duration before uploading
    if (!fileDuration) {
      Alert.alert(
        t('upload.error_title', 'Error'),
        t('upload.no_duration', 'Media duration could not be determined. Please select a different file.')
      );
      return;
    }

    try {
      console.log('Calling onFileUpload with params:', selectedFile, selectedLanguageForUpload, selectedBlueprintForUpload, selectedDateTime, fileDuration.milliseconds);
      await onFileUpload(selectedFile, selectedLanguageForUpload, selectedBlueprintForUpload, selectedDateTime, fileDuration.milliseconds);
      // Modal wird nur geschlossen, wenn Upload erfolgreich war
      handleModalClose();
    } catch (error) {
      console.error('Upload failed:', error);
      // Modal bleibt offen bei Fehlern
    }
  };

  const handleLanguageSelect = () => {
    console.log('Language select clicked');
    console.log('Current modalMode:', modalMode);
    setModalMode('language');
    console.log('Setting modalMode to language');
  };

  const handleBlueprintSelect = () => {
    console.log('Blueprint select clicked');
    setModalMode('blueprint');
    loadBlueprints();
  };

  const handleDateSelect = () => {
    console.log('Date select clicked');
    if (Platform.OS === 'ios') {
      setModalMode('date');
    } else {
      setShowDatePicker(true);
    }
  };

  const handleTimeSelect = () => {
    console.log('Time select clicked');
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
      // Preserve the existing time when changing date
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setSelectedDateTime(newDateTime);
      // On iOS, don't automatically close - let user press "Done" button
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      // Preserve the existing date when changing time
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setSelectedDateTime(newDateTime);
      setHasCustomTime(true);
      // On iOS, don't automatically close - let user press "Done" button
    }
  };

  // Lade Blueprints
  const loadBlueprints = async () => {
    setBlueprintsLoading(true);
    try {
      // Verwende den direkten Supabase-Zugriff wie in der BlueprintModal
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
        console.log('Loaded blueprints:', blueprintData);
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
    if (selectedLanguageForUpload === 'auto') {
      return t('upload.auto_detect', 'Automatisch erkennen');
    } else {
      return supportedAzureLanguages[selectedLanguageForUpload]?.nativeName || selectedLanguageForUpload;
    }
  };

  const getSelectedBlueprintDisplay = () => {
    if (selectedBlueprintForUpload) {
      const lang = currentLanguage.startsWith('de') ? 'de' : 'en';
      return selectedBlueprintForUpload.name?.[lang] || selectedBlueprintForUpload.name?.en || selectedBlueprintForUpload.name?.de || t('blueprints.title', 'Blueprints');
    }
    return t('upload.no_blueprint_selected', 'No blueprint selected');
  };

  const getSelectedDateDisplay = () => {
    return selectedDateTime.toLocaleDateString(currentLanguage.startsWith('de') ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSelectedTimeDisplay = () => {
    return selectedDateTime.toLocaleTimeString(currentLanguage.startsWith('de') ? 'de-DE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        borderless: false 
      }}
    >
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
        }}
      >
        <Icon name={iconName} size={20} color={isActive ? '#000000' : themeColors.text} />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: themeColors.text,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? '#D1D5DB' : '#6B7280',
          }}
        >
          {subtitle}
        </Text>
      </View>
      
      {showChevron && (
        <Icon 
          name="chevron-forward" 
          size={20} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
        />
      )}
    </Pressable>
  );

  // Bestimme den Modal-Titel basierend auf dem Modus
  const getModalTitle = () => {
    console.log('getModalTitle called with modalMode:', modalMode);
    switch (modalMode) {
      case 'language':
        return t('upload.select_recording_language', 'Aufnahmesprache auswählen');
      case 'blueprint':
        return t('upload.select_blueprint', 'Blueprint auswählen');
      case 'date':
        return t('upload.select_date', 'Datum auswählen');
      case 'time':
        return t('upload.select_time', 'Uhrzeit auswählen');
      default:
        return t('upload.title', 'Audio/Video hochladen');
    }
  };

  // Bestimme den Modal-Inhalt basierend auf dem Modus
  const renderModalContent = () => {
    console.log('renderModalContent called with modalMode:', modalMode);
    switch (modalMode) {
      case 'language':
        return (
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
            {Object.entries(supportedAzureLanguages)
              .sort(([a], [b]) => {
                if (a === 'auto') return -1;
                if (b === 'auto') return 1;
                // Ausgewählte Sprache zuerst, dann alphabetisch
                const aSelected = selectedLanguageForUpload === a;
                const bSelected = selectedLanguageForUpload === b;
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return supportedAzureLanguages[a].nativeName.localeCompare(supportedAzureLanguages[b].nativeName);
              })
              .map(([code, language]) => {
                const isSelected = selectedLanguageForUpload === code;
                return (
                  <Pressable
                    key={code}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      backgroundColor: isSelected ? themeColors.contentBackgroundHover : 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                    onPress={() => {
                      console.log('Language selected:', code);
                      setSelectedLanguageForUpload(code); // Setze nur eine einzelne Sprache
                      setModalMode('upload'); // Zurück zum Upload-Modal
                    }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 16 }}>
                      {language.emoji}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: isSelected ? '600' : '400',
                          color: themeColors.text,
                        }}
                      >
                        {language.nativeName}
                      </Text>
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
                        }}
                      >
                        <Icon name="checkmark" size={16} color={isDark ? '#000000' : '#000000'} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
          </ScrollView>
        );
      
      case 'blueprint':
        return (
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
            {blueprintsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={{ color: themeColors.text, marginTop: 10 }}>
                  {t('upload.loading_blueprints', 'Blueprints werden geladen...')}
                </Text>
              </View>
            ) : blueprints.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: themeColors.text }}>
                  {t('upload.no_blueprints_available', 'Keine Blueprints verfügbar')}
                </Text>
              </View>
            ) : (
              blueprints.map((blueprint) => {
                const isSelected = selectedBlueprintForUpload?.id === blueprint.id;
                const lang = currentLanguage.startsWith('de') ? 'de' : 'en';
                const displayName = blueprint.name?.[lang] || blueprint.name?.en || blueprint.name?.de || 'Blueprint';
                const displayDescription = blueprint.description?.[lang] || blueprint.description?.en || blueprint.description?.de || '';
                
                return (
                  <Pressable
                    key={blueprint.id}
                    style={{
                      padding: 16,
                      backgroundColor: isSelected ? themeColors.contentBackgroundHover : 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                    onPress={() => {
                      console.log('Blueprint selected:', blueprint.id);
                      setSelectedBlueprintForUpload(blueprint);
                      setModalMode('upload'); // Zurück zum Upload-Modal
                    }}
                  >
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
                        }}
                      >
                        <Icon name="document-text" size={20} color={isDark ? '#000000' : '#000000'} />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: isSelected ? '600' : '500',
                            color: themeColors.text,
                            marginBottom: 2,
                          }}
                        >
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
                            ellipsizeMode="tail"
                          >
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
                          }}
                        >
                          <Icon name="checkmark" size={16} color={isDark ? '#000000' : '#000000'} />
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
                onPress={() => setModalMode('upload')}
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
                onPress={() => setModalMode('upload')}
                variant="primary"
                style={{ marginTop: 20, minWidth: 120 }}
              />
            )}
          </View>
        );
      
      default:
        return (
          <View style={{ width: '100%' }}>
            {isUploading ? (
              // Upload-Progress UI
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: themeColors.text,
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  {t('upload.uploading', 'Datei wird hochgeladen...')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? '#D1D5DB' : '#6B7280',
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  {selectedFile?.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? '#9CA3AF' : '#9CA3AF',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  {t('upload.processing_info', 'Die Datei wird verarbeitet und transkribiert. Dies kann einen Moment dauern.')}
                </Text>
              </View>
            ) : (
              // Normale Upload-Konfiguration UI
              <>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? '#D1D5DB' : '#6B7280',
                    marginBottom: 24,
                    lineHeight: 20,
                  }}
                >
                  {t('upload.description', 'Select an audio or video file and configure the recording settings. Video files will be automatically converted to audio for transcription.')}
                </Text>

                {renderActionButton(
                  'cloud-upload-outline',
                  t('upload.select_file', 'Datei auswählen'),
                  selectedFile ?
                    (isExtractingDuration ?
                      t('upload.extracting_duration', 'Extracting duration...') :
                      (fileDuration ?
                        `${selectedFile.name} (${fileDuration.formatted})` :
                        selectedFile.name
                      )
                    ) :
                    t('upload.select_file_description', 'Audio- oder Videodatei hochladen'),
                  handleFileSelect,
                  false,
                  !!selectedFile && !!fileDuration
                )}

                {renderActionButton(
                  'language-outline',
                  t('upload.select_language', 'Sprache auswählen'),
                  getSelectedLanguageDisplay(),
                  handleLanguageSelect,
                  true,
                  selectedLanguageForUpload !== 'auto'
                )}

                {renderActionButton(
                  'calendar-outline',
                  t('upload.select_date', 'Datum auswählen'),
                  getSelectedDateDisplay(),
                  handleDateSelect,
                  true,
                  selectedDateTime.toDateString() !== new Date().toDateString()
                )}

                {renderActionButton(
                  'time-outline',
                  t('upload.select_time', 'Uhrzeit auswählen'),
                  getSelectedTimeDisplay(),
                  handleTimeSelect,
                  true,
                  hasCustomTime
                )}

                {renderActionButton(
                  'document-text-outline',
                  t('upload.select_blueprint', 'Select blueprint'),
                  getSelectedBlueprintDisplay(),
                  handleBlueprintSelect,
                  true,
                  !!selectedBlueprintForUpload
                )}
              </>
            )}
          </View>
        );
    }
  };

  const handleModalClose = () => {
    // Verhindere das Schließen während des Uploads
    if (isUploading) {
      return;
    }
    
    if (modalMode === 'upload') {
      // Reset state when modal is closed
      setSelectedFile(null);
      setSelectedLanguageForUpload('auto');
      setSelectedBlueprintForUpload(null);
      setSelectedDateTime(new Date());
      setHasCustomTime(false);
      setFileDuration(null);
      setIsExtractingDuration(false);
      setModalMode('upload');
      onClose();
    } else {
      setModalMode('upload'); // Zurück zum Upload-Modal
    }
  };

  console.log('UploadModal render - modalMode:', modalMode, 'isVisible:', isVisible);

  // Don't show this modal if the insufficient credits modal is already visible
  if (isInsufficientCreditsModalVisible && isVisible) {
    console.log('[UploadModal] Prevented from showing - insufficient credits modal is already visible');
    return null;
  }

  return (
    <>
      <BaseModal
        isVisible={isVisible}
        onClose={handleModalClose}
        title={getModalTitle()}
        animationType="fade"
        closeOnOverlayPress={!isUploading}
        hideFooter={modalMode !== 'upload' || isUploading}
        footerContent={modalMode === 'upload' && !isUploading ? (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 20,
            gap: 12
          }}>
            <Button
              title={t('common.cancel', 'Abbrechen')}
              onPress={handleModalClose}
              variant="secondary"
              style={{ flex: 1 }}
              disabled={isUploading}
            />
            <Button
              title={isUploading ? t('upload.uploading', 'Hochladen...') : t('upload.upload', 'Hochladen')}
              onPress={handleUpload}
              variant="primary"
              style={{ flex: 1 }}
              disabled={!selectedFile || !fileDuration || isUploading || isExtractingDuration}
              loading={isUploading}
            />
          </View>
        ) : undefined}
      >
        {renderModalContent()}
      </BaseModal>

      {/* Blueprint Modal */}
      {selectedBlueprint && (
        <BlueprintModal
          visible={isBlueprintModalVisible}
          onClose={() => {
            setIsBlueprintModalVisible(false);
            setSelectedBlueprint(null);
          }}
          blueprint={selectedBlueprint}
          currentLanguage={currentLanguage}
        />
      )}

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

export default UploadModal;