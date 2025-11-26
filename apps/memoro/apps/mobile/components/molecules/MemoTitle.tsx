import { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import Text from '~/components/atoms/Text';
import HighlightedText from '~/components/atoms/HighlightedText';
import MemoLocation from '~/components/molecules/MemoLocation';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface MemoTitleProps {
  title?: string;
  intro?: string;
  timestamp?: Date;
  duration?: number;
  viewCount?: number;
  wordCount?: number;
  location?: any; // Location-Daten für die Adressanzeige
  language?: string; // Transkript-Sprache (z.B. "de-DE")
  speakerCount?: number; // Anzahl der Sprecher
  isEditMode?: boolean;
  onTitleChange?: (text: string) => void;
  onIntroChange?: (text: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  params?: any;
  memoId?: string;
  tags?: Array<{ id: string; text: string; color: string }>;
  selectedTagIds?: string[];
  onTagPress?: (id: string) => void;
  onAddTagPress?: () => void;
  // Search props
  isSearchMode?: boolean;
  searchQuery?: string;
  currentSearchIndex?: number;
  searchResults?: Array<{
    id: string;
    type: string;
    text: string;
    index: number;
    matchIndex: number;
  }>;
  isPinned?: boolean;
  onPinPress?: () => void;
}

export default function MemoTitle({
  title,
  intro,
  timestamp,
  duration,
  viewCount = 0,
  wordCount,
  location,
  language,
  speakerCount,
  isEditMode = false,
  onTitleChange,
  onIntroChange,
  onSave: _onSave,
  onCancel: _onCancel,
  params: _params,
  memoId: _memoId,
  tags = [],
  selectedTagIds = [],
  onTagPress,
  onAddTagPress,
  isSearchMode = false,
  searchQuery = '',
  currentSearchIndex = 0,
  searchResults = [],
  isPinned = false,
  onPinPress,
}: MemoTitleProps) {
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const [showAllMetadata, setShowAllMetadata] = useState(false);

  const handleCopyMemoId = async () => {
    if (_memoId) {
      await Clipboard.setStringAsync(_memoId);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Alert.alert(
          t('memo.copy_success_title'),
          t('memo.id_copied', 'Memo ID copied to clipboard')
        );
      }
    }
  };

  // Hilfsfunktionen für die Formatierung
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    const langCode = i18n.language.split('-')[0];
    const is12Hour = ['en', 'hi', 'ur', 'tl', 'ms'].includes(langCode);
    
    return date.toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: is12Hour,
    });
  };

  const formatDuration = (durationInSeconds: number): string => {
    if (durationInSeconds < 60) {
      const seconds = Math.ceil(durationInSeconds);
      return t('memo.duration_seconds', '{{seconds}} Sek', { seconds });
    }
    const minutes = Math.ceil(durationInSeconds / 60);
    return t('memo.duration_minutes', '{{minutes}} min', { minutes });
  };

  const formatViewCount = (count: number): string => {
    return t(count === 1 ? 'memo.view_count' : 'memo.view_count_plural', { count });
  };

  const formatWordCount = (count?: number): string | null => {
    if (count === undefined || count === null) return null;
    return t(count === 1 ? 'memo.word_count' : 'memo.word_count_plural', { count });
  };

  const formatLanguage = (lang?: string): string | null => {
    if (!lang) return null;
    // Konvertiere Sprachcodes zu lesbaren Namen
    const languageNames: Record<string, string> = {
      'de-DE': 'Deutsch',
      'en-US': 'Englisch',
      'fr-FR': 'Französisch',
      'es-ES': 'Spanisch',
      'it-IT': 'Italienisch',
      'pt-PT': 'Portugiesisch',
      'nl-NL': 'Niederländisch',
      'pl-PL': 'Polnisch',
      'ru-RU': 'Russisch',
      'ja-JP': 'Japanisch',
      'ko-KR': 'Koreanisch',
      'zh-CN': 'Chinesisch',
      'ar-SA': 'Arabisch',
      'hi-IN': 'Hindi',
      'tr-TR': 'Türkisch',
    };
    return languageNames[lang] || lang;
  };

  const formatSpeakerCount = (count?: number): string | null => {
    if (!count || count === 0) return null;
    return t(count === 1 ? 'memo.speaker_count' : 'memo.speaker_count_plural', { count });
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: 24,
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    metadataContainer: {
      alignSelf: 'stretch',
      marginBottom: 24,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      marginBottom: 4,
    },
    metadataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    metadataLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: showAllMetadata ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
      width: 100,
      marginLeft: 8,
    },
    metadataIcon: {
      marginRight: 0,
    },
    metadataValue: {
      fontSize: 14,
      color: showAllMetadata ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
      flex: 1,
    },
    infoText: {
      fontSize: 14,
      color: showAllMetadata ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
    },
    separator: {
      fontSize: 14,
      color: showAllMetadata ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
      marginHorizontal: 6,
    },
    pinnedText: {
      fontSize: 12,
      fontWeight: '600',
    },
    emojiContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginBottom: 16,
      marginTop: 8,
    },
    headline: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      lineHeight: 32,
      marginBottom: intro ? 8 : 16,
    },
    intro: {
      fontSize: 16,
      color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      lineHeight: 24,
      marginBottom: 16,
    },
    input: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      lineHeight: 32,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      paddingBottom: 4,
      minHeight: 32,
    },
    introInput: {
      fontSize: 16,
      color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      lineHeight: 24,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      paddingBottom: 4,
      minHeight: 24,
    },
  });

  return (
    <View style={styles.container}>
      {isEditMode ? (
        <>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={onTitleChange}
            placeholder={t('memo.title_placeholder', 'Enter title')}
            placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
          <TextInput
            style={styles.introInput}
            value={intro}
            onChangeText={onIntroChange}
            placeholder={t('memo.intro_placeholder', 'Enter description (optional)')}
            placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </>
      ) : (
        <>
          {/* Metadaten über dem Titel */}
          {timestamp && (
            <Pressable onPress={() => setShowAllMetadata(!showAllMetadata)} style={styles.metadataContainer}>
              <View style={styles.dateContainer}>
                <Text style={styles.infoText}>{formatDate(timestamp)}</Text>
                <Text style={styles.separator}>·</Text>
                <Text style={styles.infoText}>{formatTime(timestamp)}</Text>
                {duration !== undefined && (
                  <>
                    <Text style={styles.separator}>·</Text>
                    <Text style={styles.infoText}>{formatDuration(duration)}</Text>
                  </>
                )}
                {isPinned && (
                  <>
                    <Text style={styles.separator}>·</Text>
                    <Pressable onPress={(e) => {
                      e.stopPropagation();
                      onPinPress?.();
                    }}>
                      <Ionicons name="pin" size={14} color="#FF9500" />
                    </Pressable>
                  </>
                )}
                <Ionicons
                  name={showAllMetadata ? 'chevron-down' : 'chevron-back'}
                  size={20}
                  color={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  style={{ marginLeft: 12 }}
                />
              </View>

              {/* Zusätzliche Metadaten nur anzeigen wenn showAllMetadata true ist */}
              {showAllMetadata && (
                <>
                  {/* Date */}
                  <View style={[styles.metadataRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                    <Ionicons name="calendar-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                    <Text style={styles.metadataLabel}>{t('memo.date', 'Date')}</Text>
                    <Text style={styles.metadataValue}>{formatDate(timestamp)}</Text>
                  </View>

                  {/* Time */}
                  <View style={styles.metadataRow}>
                    <Ionicons name="time-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                    <Text style={styles.metadataLabel}>{t('memo.time', 'Time')}</Text>
                    <Text style={styles.metadataValue}>{formatTime(timestamp)}</Text>
                  </View>

                  {/* Duration */}
                  {duration !== undefined && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="timer-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                      <Text style={styles.metadataLabel}>{t('memo.duration', 'Duration')}</Text>
                      <Text style={styles.metadataValue}>{formatDuration(duration)}</Text>
                    </View>
                  )}

                  {/* Views */}
                  <View style={styles.metadataRow}>
                    <Ionicons name="eye-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                    <Text style={styles.metadataLabel}>{t('memo.views', 'Views')}</Text>
                    <Text style={styles.metadataValue}>{viewCount}</Text>
                  </View>

                  {/* Words */}
                  {wordCount !== undefined && wordCount > 0 && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="text-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                      <Text style={styles.metadataLabel}>{t('memo.words', 'Words')}</Text>
                      <Text style={styles.metadataValue}>{wordCount.toLocaleString()}</Text>
                    </View>
                  )}

                  {/* Language */}
                  {language && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="language-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                      <Text style={styles.metadataLabel}>{t('memo.language', 'Language')}</Text>
                      <Text style={styles.metadataValue}>{formatLanguage(language)}</Text>
                    </View>
                  )}

                  {/* Speakers */}
                  {speakerCount && speakerCount > 0 && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="people-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                      <Text style={styles.metadataLabel}>{t('memo.speakers', 'Speakers')}</Text>
                      <Text style={styles.metadataValue}>{speakerCount}</Text>
                    </View>
                  )}

                  {/* Location */}
                  {location && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="location-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                      <Text style={styles.metadataLabel}>{t('memo.location', 'Location')}</Text>
                      <View style={{ flex: 1 }}>
                        <MemoLocation location={location} fullOpacity={true} />
                      </View>
                    </View>
                  )}
                  
                  {/* Memo ID */}
                  {_memoId && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCopyMemoId();
                      }}
                      style={[styles.metadataRow, { borderBottomWidth: 0 }]}
                    >
                      <Ionicons name="key-outline" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={styles.metadataIcon} />
                      <Text style={styles.metadataLabel}>ID</Text>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.metadataValue, { fontFamily: 'monospace', fontSize: 13 }]} numberOfLines={1}>{_memoId}</Text>
                        <Ionicons 
                          name="copy-outline" 
                          size={18} 
                          color={isDark ? '#FFFFFF' : '#000000'} 
                        />
                      </View>
                    </Pressable>
                  )}
                </>
              )}
            </Pressable>
          )}

          {/* Titel und Intro nach den Metadaten */}
          {title ? (
            isSearchMode && searchQuery ? (
              <HighlightedText
                text={title}
                searchQuery={searchQuery}
                style={styles.headline}
                numberOfLines={undefined}
                currentResultIndex={currentSearchIndex}
                searchResults={searchResults}
                textType="title"
              />
            ) : (
              <Text style={styles.headline}>{title}</Text>
            )
          ) : undefined}
          {intro ? (
            isSearchMode && searchQuery ? (
              <HighlightedText
                text={intro}
                searchQuery={searchQuery}
                style={styles.intro}
                numberOfLines={undefined}
                currentResultIndex={currentSearchIndex}
                searchResults={searchResults}
                textType="intro"
              />
            ) : (
              <Text style={styles.intro}>{intro}</Text>
            )
          ) : undefined}
        </>
      )}
    </View>
  );
}
